import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTenantStore } from '@/stores/tenantStore'
import { useTenants } from '@/hooks/useTenants'
import type { RoleResponse, RoleCreate, RoleUpdate } from '@/types/role'

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleResponse | null
  onSubmit: (data: RoleCreate | RoleUpdate, tenantId?: string) => void
  isSubmitting?: boolean
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSubmit,
  isSubmitting = false,
}: RoleFormDialogProps) {
  const { currentTenantId, currentTenant } = useTenantStore()
  const { data: tenants, error: tenantsError, isLoading: tenantsLoading } = useTenants()
  const isEditing = !!role
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tenant_id: '',
  })
  const [overrideGlobalTenant, setOverrideGlobalTenant] = useState(false)

  // Determine if using global tenant (from header)
  const usingGlobalTenant = !isEditing && currentTenantId && !overrideGlobalTenant
  const effectiveTenantId = usingGlobalTenant ? currentTenantId : formData.tenant_id

  // Reset form when dialog opens or role changes
  useEffect(() => {
    if (open) {
      setOverrideGlobalTenant(false)
      setFormData(
        role
          ? {
              name: role.name,
              description: role.description || '',
              tenant_id: role.tenant_id || '',
            }
          : {
              name: '',
              description: '',
              tenant_id: currentTenantId || '',
            }
      )
    }
  }, [open, role, currentTenantId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    if (isEditing) {
      const updateData: RoleUpdate = {
        name: formData.name || null,
        description: formData.description || null,
      }
      onSubmit(updateData, role?.tenant_id)
    } else {
      const tenantIdToUse = usingGlobalTenant ? currentTenantId : formData.tenant_id
      if (!tenantIdToUse) {
        return // Tenant is required for creation
      }
      const createData: RoleCreate = {
        name: formData.name,
        description: formData.description || null,
      }
      onSubmit(createData, tenantIdToUse)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Add New Role'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update role information below.'
              : 'Enter role details below to create a new role.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Admin, User, Viewer"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            {!isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="tenant">Tenant *</Label>
                <Select
                  value={effectiveTenantId || ''}
                  onValueChange={(value) => handleInputChange('tenant_id', value)}
                  disabled={tenantsLoading || !!usingGlobalTenant}
                >
                  <SelectTrigger id="tenant">
                    <SelectValue placeholder={tenantsLoading ? 'Loading tenants...' : 'Select a tenant'} />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsError ? (
                      <SelectItem value="error" disabled>
                        Failed to load tenants
                      </SelectItem>
                    ) : tenants?.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {usingGlobalTenant && (
                  <p className="text-xs text-muted-foreground">
                    Using tenant "{currentTenant?.name}" selected in the header.{' '}
                    <button
                      type="button"
                      className="text-primary underline hover:no-underline"
                      onClick={() => setOverrideGlobalTenant(true)}
                    >
                      Override
                    </button>
                  </p>
                )}
                {overrideGlobalTenant && currentTenantId && (
                  <p className="text-xs text-muted-foreground">
                    Overriding global tenant selection.{' '}
                    <button
                      type="button"
                      className="text-primary underline hover:no-underline"
                      onClick={() => {
                        setOverrideGlobalTenant(false)
                        setFormData((prev) => ({ ...prev, tenant_id: currentTenantId }))
                      }}
                    >
                      Use global
                    </button>
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="Brief description of role"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (!isEditing && !effectiveTenantId)}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
