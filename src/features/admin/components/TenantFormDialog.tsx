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
import type { TenantResponse, TenantCreate, TenantUpdate } from '@/types/tenant'

interface TenantFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: TenantResponse | null
  onSubmit: (data: TenantCreate | TenantUpdate) => void
  isSubmitting?: boolean
}

export function TenantFormDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  isSubmitting = false,
}: TenantFormDialogProps) {
  const isEditing = !!tenant
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  // Reset form when dialog opens or tenant changes
  useEffect(() => {
    if (open) {
      setFormData(
        tenant
          ? {
              name: tenant.name,
              slug: tenant.slug,
              description: tenant.description || '',
            }
          : {
              name: '',
              slug: '',
              description: '',
            }
      )
    }
  }, [open, tenant])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || (!isEditing && !formData.slug.trim())) {
      return
    }

    if (isEditing) {
      const updateData: TenantUpdate = {
        name: formData.name || null,
        description: formData.description || null,
        entitlements: null,
        settings: null,
      }
      onSubmit(updateData)
    } else {
      const createData: TenantCreate = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        entitlements: null,
        settings: null,
      }
      onSubmit(createData)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const autoGenerateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData((prev) => ({ ...prev, slug }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update tenant information below. Slug cannot be modified after creation.'
              : 'Enter tenant details below to create a new tenant.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tenant Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Acme Corporation"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            {!isEditing && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug">Slug *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={autoGenerateSlug}
                  >
                    Auto-generate from name
                  </Button>
                </div>
                <Input
                  id="slug"
                  type="text"
                  placeholder="e.g., acme-corp"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier used in URLs. Cannot be changed after creation.
                </p>
              </div>
            )}

            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="Brief description of tenant"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
