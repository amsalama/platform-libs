import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Search, Shield, ShieldPlus, ShieldMinus, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useUserRoles } from '@/hooks/useUsers'
import { useRoles, useAssignRoleToUser, useRevokeRoleFromUser } from '@/hooks/useRoles'
import { useTenantStore } from '@/stores/tenantStore'
import type { UserResponse } from '@/types/user'
import type { RoleResponse } from '@/types/role'

interface UserRolesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponse | null
}

export function UserRolesDialog({
  open,
  onOpenChange,
  user,
}: UserRolesDialogProps) {
  const [search, setSearch] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set())
  const [showAddRole, setShowAddRole] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    roleId: '',
    isTenantWide: true,
    grantReason: '',
  })

  const currentTenantId = useTenantStore((state) => state.currentTenantId)

  // Fetch user's current roles
  const { data: userRolesData, isLoading: userRolesLoading } = useUserRoles(user?.principal_id || '')

  // Fetch all roles in the current tenant
  const { data: allRoles, isLoading: rolesLoading } = useRoles({ tenant_id: currentTenantId || undefined })

  const assignRole = useAssignRoleToUser()
  const revokeRole = useRevokeRoleFromUser()

  const isLoading = userRolesLoading || rolesLoading

  // Create a set of assigned role IDs for quick lookup
  const assignedRoleIds = useMemo(() => {
    return new Set(userRolesData?.roles?.map((r) => r.id) || [])
  }, [userRolesData])

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!allRoles) return []

    return allRoles.filter((role) => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      return (
        role.name.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower) ||
        role.id.toLowerCase().includes(searchLower)
      )
    })
  }, [allRoles, search])

  // Separate assigned and unassigned roles
  const { assignedRoles, unassignedRoles } = useMemo(() => {
    const assigned: RoleResponse[] = []
    const unassigned: RoleResponse[] = []

    filteredRoles.forEach((role) => {
      if (assignedRoleIds.has(role.id)) {
        assigned.push(role)
      } else {
        unassigned.push(role)
      }
    })

    return { assignedRoles: assigned, unassignedRoles: unassigned }
  }, [filteredRoles, assignedRoleIds])

  const handleRevokeRole = async (role: RoleResponse) => {
    if (!user) return

    setPendingChanges((prev) => new Set(prev).add(role.id))

    try {
      await revokeRole.mutateAsync({
        roleId: role.id,
        principalId: user.principal_id,
        tenantId: role.tenant_id,
      })
      toast.success(`Removed "${role.name}" from ${user.email || user.name}`)
    } catch (error) {
      console.error('Failed to revoke role:', error)
      toast.error('Failed to remove role from user')
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev)
        next.delete(role.id)
        return next
      })
    }
  }

  const handleAssignRole = async (role: RoleResponse) => {
    if (!user) return

    setPendingChanges((prev) => new Set(prev).add(role.id))

    try {
      await assignRole.mutateAsync({
        roleId: role.id,
        data: {
          principal_id: user.principal_id,
          is_tenant_wide: true,
        },
        tenantId: role.tenant_id,
      })
      toast.success(`Assigned "${role.name}" to ${user.email || user.name}`)
    } catch (error) {
      console.error('Failed to assign role:', error)
      toast.error('Failed to assign role to user')
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev)
        next.delete(role.id)
        return next
      })
    }
  }

  const handleAddNewRole = async () => {
    if (!user || !newAssignment.roleId.trim()) return

    setPendingChanges((prev) => new Set(prev).add(newAssignment.roleId))

    try {
      await assignRole.mutateAsync({
        roleId: newAssignment.roleId.trim(),
        data: {
          principal_id: user.principal_id,
          is_tenant_wide: newAssignment.isTenantWide,
          grant_reason: newAssignment.grantReason || undefined,
        },
        tenantId: currentTenantId || undefined,
      })
      toast.success(`Role assigned to ${user.email || user.name}`)
      setNewAssignment({ roleId: '', isTenantWide: true, grantReason: '' })
      setShowAddRole(false)
    } catch (error) {
      console.error('Failed to assign role:', error)
      toast.error('Failed to assign role to user')
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev)
        next.delete(newAssignment.roleId)
        return next
      })
    }
  }

  const assignedCount = userRolesData?.count || assignedRoles.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Roles
          </DialogTitle>
          <DialogDescription>
            {user ? (
              <>
                Manage roles for <span className="font-medium">{user.email || user.name || user.principal_id}</span>
              </>
            ) : (
              'Select a user to manage roles'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search and Add Role */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showAddRole ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => setShowAddRole(!showAddRole)}
            title="Add role by ID"
          >
            <ShieldPlus className="h-4 w-4" />
          </Button>
        </div>

        {/* Add Role Form */}
        {showAddRole && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <h4 className="font-medium text-sm">Add Role by ID</h4>
            <div className="space-y-2">
              <Label htmlFor="roleId">Role ID</Label>
              <Input
                id="roleId"
                placeholder="Enter role ID..."
                value={newAssignment.roleId}
                onChange={(e) => setNewAssignment((prev) => ({ ...prev, roleId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grantReason">Reason (optional)</Label>
              <Input
                id="grantReason"
                placeholder="Why is this role being assigned?"
                value={newAssignment.grantReason}
                onChange={(e) => setNewAssignment((prev) => ({ ...prev, grantReason: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isTenantWide"
                checked={newAssignment.isTenantWide}
                onCheckedChange={(checked) => 
                  setNewAssignment((prev) => ({ ...prev, isTenantWide: checked === true }))
                }
              />
              <Label htmlFor="isTenantWide" className="text-sm">Tenant-wide assignment</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddRole(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleAddNewRole}
                disabled={!newAssignment.roleId.trim() || pendingChanges.has(newAssignment.roleId)}
              >
                {pendingChanges.has(newAssignment.roleId) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldPlus className="h-4 w-4 mr-2" />
                )}
                Assign
              </Button>
            </div>
          </div>
        )}

        {/* Roles List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Assigned Roles */}
              {assignedRoles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-1 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Assigned Roles ({assignedRoles.length})
                  </h4>
                  <div className="space-y-1">
                    {assignedRoles.map((role) => {
                      const isPending = pendingChanges.has(role.id)

                      return (
                        <div
                          key={role.id}
                          className="flex items-center gap-3 p-3 rounded-md border bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {role.name}
                              </span>
                              {role.is_system && (
                                <Badge variant="secondary" className="text-[10px]">
                                  System
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-[10px]">
                                Assigned
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {role.description && (
                                <span className="flex items-center gap-1 truncate max-w-[300px]">
                                  <Info className="h-3 w-3 shrink-0" />
                                  {role.description}
                                </span>
                              )}
                              <code className="text-[10px] bg-muted px-1 py-0.5 rounded shrink-0">
                                {role.id.slice(0, 8)}...
                              </code>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevokeRole(role)}
                            disabled={isPending || role.is_system}
                            title={role.is_system ? 'System roles cannot be revoked' : 'Remove role'}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldMinus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Unassigned Roles */}
              {unassignedRoles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-1 flex items-center gap-2">
                    <ShieldPlus className="h-4 w-4" />
                    Available Roles ({unassignedRoles.length})
                  </h4>
                  <div className="space-y-1">
                    {unassignedRoles.map((role) => {
                      const isPending = pendingChanges.has(role.id)

                      return (
                        <div
                          key={role.id}
                          className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {role.name}
                              </span>
                              {role.is_system && (
                                <Badge variant="outline" className="text-[10px]">
                                  System
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {role.description && (
                                <span className="flex items-center gap-1 truncate max-w-[300px]">
                                  <Info className="h-3 w-3 shrink-0" />
                                  {role.description}
                                </span>
                              )}
                              <code className="text-[10px] bg-muted px-1 py-0.5 rounded shrink-0">
                                {role.id.slice(0, 8)}...
                              </code>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleAssignRole(role)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldPlus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {assignedRoles.length === 0 && unassignedRoles.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Shield className="h-12 w-12 mb-2" />
                  <p>No roles found</p>
                  {search && (
                    <p className="text-sm">Try a different search term</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {assignedCount} role{assignedCount !== 1 ? 's' : ''} assigned
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
