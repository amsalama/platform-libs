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
import type { PermissionResponse, PermissionCreate } from '@/types/role'

interface PermissionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permission?: PermissionResponse | null
  onSubmit: (data: PermissionCreate) => void
  isSubmitting?: boolean
}

export function PermissionFormDialog({
  open,
  onOpenChange,
  permission,
  onSubmit,
  isSubmitting = false,
}: PermissionFormDialogProps) {
  const [formData, setFormData] = useState<{
    permission_key: string
    description: string
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
    is_assignable: boolean
  }>({
    permission_key: '',
    description: '',
    risk_level: 'MEDIUM',
    is_assignable: true,
  })

  // Reset form when dialog opens or permission changes
  useEffect(() => {
    if (open) {
      setFormData(
        permission
          ? {
              permission_key: permission.permission_key,
              description: permission.description || '',
              risk_level: permission.risk_level as 'LOW' | 'MEDIUM' | 'HIGH',
              is_assignable: permission.is_assignable,
            }
          : {
              permission_key: '',
              description: '',
              risk_level: 'MEDIUM' as const,
              is_assignable: true,
            }
      )
    }
  }, [open, permission])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.permission_key.trim()) {
      return
    }

    const createData: PermissionCreate = {
      permission_key: formData.permission_key,
      description: formData.description || null,
      risk_level: formData.risk_level,
      is_assignable: formData.is_assignable,
    }
    onSubmit(createData)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Permission</DialogTitle>
          <DialogDescription>
            Enter permission details below to create a new permission.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="permission_key">Permission Key *</Label>
              <Input
                id="permission_key"
                type="text"
                placeholder="e.g., users.read, roles.write"
                value={formData.permission_key}
                onChange={(e) => handleInputChange('permission_key', e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Format: namespace.resource.action (e.g., admin.users.read)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="risk_level">Risk Level</Label>
              <select
                id="risk_level"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.risk_level}
                onChange={(e) => handleInputChange('risk_level', e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="is_assignable">Assignable</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="is_assignable"
                  type="checkbox"
                  checked={formData.is_assignable}
                  onChange={(e) => handleInputChange('is_assignable', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Allow this permission to be assigned to roles</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="Brief description of permission"
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
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
