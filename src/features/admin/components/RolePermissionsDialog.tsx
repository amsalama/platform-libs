import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Shield, Key, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRolePermissions, useGrantPermissionToRole, useRevokePermissionFromRole } from '@/hooks/useRoles'
import type { RoleResponse, PermissionResponse } from '@/types/role'

interface RolePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleResponse | null
}

export function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
}: RolePermissionsDialogProps) {
  const [search, setSearch] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set())

  // Get the role's tenant_id for API calls
  const roleTenantId = role?.tenant_id

  // Fetch all permissions for the same tenant as the role
  const { data: allPermissions, isLoading: permissionsLoading } = usePermissions(
    roleTenantId ? { tenant_id: roleTenantId } : undefined
  )

  // Fetch current role permissions (using role's tenant_id)
  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useRolePermissions(
    role?.id || '',
    roleTenantId
  )

  const grantPermission = useGrantPermissionToRole()
  const revokePermission = useRevokePermissionFromRole()

  const isLoading = permissionsLoading || rolePermissionsLoading

  // Create a set of current permission IDs for quick lookup
  const currentPermissionIds = useMemo(() => {
    return new Set(rolePermissions?.map((p) => p.id) || [])
  }, [rolePermissions])

  // Group permissions by namespace (resource)
  const groupedPermissions = useMemo(() => {
    if (!allPermissions) return {}

    const filtered = allPermissions.filter((p) => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      return (
        p.permission_key.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    })

    return filtered.reduce<Record<string, PermissionResponse[]>>((acc, permission) => {
      const parts = permission.permission_key.split(':')
      const namespace = parts.length > 1 && parts[0] ? parts[0] : 'other'

      if (!acc[namespace]) {
        acc[namespace] = []
      }
      acc[namespace]!.push(permission)
      return acc
    }, {})
  }, [allPermissions, search])

  const handleTogglePermission = async (permission: PermissionResponse) => {
    if (!role) return

    const permissionId = permission.id
    const isCurrentlyAssigned = currentPermissionIds.has(permissionId)

    // Mark as pending
    setPendingChanges((prev) => new Set(prev).add(permissionId))

    try {
      if (isCurrentlyAssigned) {
        await revokePermission.mutateAsync({ roleId: role.id, permissionId, tenantId: roleTenantId })
        toast.success(`Revoked "${permission.permission_key}" from ${role.name}`)
      } else {
        await grantPermission.mutateAsync({ roleId: role.id, permissionId, tenantId: roleTenantId })
        toast.success(`Granted "${permission.permission_key}" to ${role.name}`)
      }
    } catch (error) {
      console.error('Failed to toggle permission:', error)
      toast.error(`Failed to ${isCurrentlyAssigned ? 'revoke' : 'grant'} permission`)
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev)
        next.delete(permissionId)
        return next
      })
    }
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'secondary'
      case 'LOW':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const namespaces = Object.keys(groupedPermissions).sort()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions
          </DialogTitle>
          <DialogDescription>
            {role ? (
              <>
                Select permissions for <span className="font-medium">{role.name}</span>
              </>
            ) : (
              'Select a role to manage permissions'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : namespaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Key className="h-12 w-12 mb-2" />
              <p>No permissions found</p>
            </div>
          ) : (
            namespaces.map((namespace) => (
              <div key={namespace} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-1">
                  {namespace}
                </h4>
                <div className="space-y-1">
                  {groupedPermissions[namespace]?.map((permission) => {
                    const isAssigned = currentPermissionIds.has(permission.id)
                    const isPending = pendingChanges.has(permission.id)

                    return (
                      <div
                        key={permission.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={permission.id}
                          checked={isAssigned}
                          disabled={isPending || !permission.is_assignable}
                          onCheckedChange={() => handleTogglePermission(permission)}
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={permission.id}
                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                          >
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {permission.permission_key}
                            </code>
                            {!permission.is_assignable && (
                              <Badge variant="outline" className="text-[10px]">
                                Not Assignable
                              </Badge>
                            )}
                          </label>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {permission.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {permission.risk_level === 'HIGH' && (
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <Badge
                            variant={getRiskBadgeVariant(permission.risk_level)}
                            className="text-[10px] px-1.5"
                          >
                            {permission.risk_level}
                          </Badge>
                          {isPending && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {rolePermissions?.length || 0} permission{(rolePermissions?.length || 0) !== 1 ? 's' : ''} assigned
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
