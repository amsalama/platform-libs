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
import type { UserResponse, UserCreate, UserUpdate } from '@/types/user'
import type { RoleResponse } from '@/types/role'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserResponse | null
  roles?: RoleResponse[]
  onSubmit: (data: UserCreate | UserUpdate) => void
  isSubmitting?: boolean
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles = [],
  onSubmit,
  isSubmitting = false,
}: UserFormDialogProps) {
  const isEditing = !!user
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    idp_issuer: '',
    idp_subject: '',
    role_id: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      const updateData: UserUpdate = {
        email: formData.email || null,
        name: formData.name || null,
      }
      onSubmit(updateData)
    } else {
      if (!formData.email || !formData.idp_issuer || !formData.idp_subject) {
        return
      }
      const createData: UserCreate = {
        email: formData.email,
        name: formData.name || null,
        idp_issuer: formData.idp_issuer,
        idp_subject: formData.idp_subject,
        role_id: formData.role_id || null,
      }
      onSubmit(createData)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Reset form when dialog opens or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          email: user.email || '',
          name: user.name || '',
          idp_issuer: '',
          idp_subject: '',
          role_id: '',
        })
      } else {
        setFormData({
          email: '',
          name: '',
          idp_issuer: '',
          idp_subject: '',
          role_id: '',
        })
      }
    }
  }, [open, user])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update user information below. IdP fields cannot be modified.'
              : 'Enter user details below to create a new account.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            {!isEditing && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="idp_issuer">Identity Provider Issuer *</Label>
                  <Input
                    id="idp_issuer"
                    type="text"
                    placeholder="https://auth.example.com"
                    value={formData.idp_issuer}
                    onChange={(e) => handleInputChange('idp_issuer', e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="idp_subject">Identity Provider Subject *</Label>
                  <Input
                    id="idp_subject"
                    type="text"
                    placeholder="unique-user-id-from-idp"
                    value={formData.idp_subject}
                    onChange={(e) => handleInputChange('idp_subject', e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role_id || 'none'}
                    onValueChange={(value) => handleInputChange('role_id', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No role assigned</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
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
