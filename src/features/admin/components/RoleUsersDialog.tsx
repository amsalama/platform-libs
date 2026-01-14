import { useState, useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
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
import { Loader2, Search, Users, UserPlus, UserMinus, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useAssignRoleToUser, useRevokeRoleFromUser } from '@/hooks/useRoles'
import { getUserRoles, listUsers } from '@/services/api/users'
import type { RoleResponse } from '@/types/role'
import type { UserResponse } from '@/types/user'

interface RoleUsersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleResponse | null
}

export function RoleUsersDialog({
  open,
  onOpenChange,
  role,
}: RoleUsersDialogProps) {
  const [search, setSearch] = useState('')
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set())
  const [showAddUser, setShowAddUser] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    principalId: '',
    isTenantWide: true,
    grantReason: '',
  })

  // Get the role's tenant_id for API calls
  const roleTenantId = role?.tenant_id

  // Fetch all users in the same tenant as the role
  const usersQuery = useQuery({
    queryKey: ['users', 'for-role-dialog', roleTenantId],
    queryFn: () => listUsers({ tenant_id: roleTenantId }),
    enabled: !!roleTenantId && open,
    staleTime: 5 * 60 * 1000,
  })

  const users = usersQuery.data || []

  // Fetch roles for each user to determine assignment status
  const userRolesQueries = useQueries({
    queries: users.map((user) => ({
      queryKey: ['users', user.principal_id, 'roles'],
      queryFn: () => getUserRoles(user.principal_id),
      enabled: !!user.principal_id && open,
      staleTime: 5 * 60 * 1000,
    })),
  })

  // Build a map of user principal_id -> whether they have this role
  const userRoleMap = useMemo(() => {
    const map = new Map<string, boolean>()
    users.forEach((user, index) => {
      const rolesData = userRolesQueries[index]?.data
      if (rolesData?.roles && role) {
        const hasRole = rolesData.roles.some((r) => r.id === role.id)
        map.set(user.principal_id, hasRole)
      }
    })
    return map
  }, [users, userRolesQueries, role])

  const assignRole = useAssignRoleToUser()
  const revokeRole = useRevokeRoleFromUser()

  const isLoading = usersQuery.isLoading || userRolesQueries.some((q) => q.isLoading)

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!users) return []

    return users.filter((user) => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      return (
        user.email?.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.principal_id.toLowerCase().includes(searchLower)
      )
    })
  }, [users, search])

  // Separate assigned and unassigned users
  const { assignedUsers, unassignedUsers } = useMemo(() => {
    const assigned: UserResponse[] = []
    const unassigned: UserResponse[] = []

    filteredUsers.forEach((user) => {
      const hasRole = userRoleMap.get(user.principal_id)
      if (hasRole) {
        assigned.push(user)
      } else {
        unassigned.push(user)
      }
    })

    return { assignedUsers: assigned, unassignedUsers: unassigned }
  }, [filteredUsers, userRoleMap])

  const handleRevokeUser = async (user: UserResponse) => {
    if (!role) return

    setPendingChanges((prev) => new Set(prev).add(user.principal_id))

    try {
      await revokeRole.mutateAsync({
        roleId: role.id,
        principalId: user.principal_id,
        tenantId: roleTenantId,
      })
      toast.success(`Removed "${user.email || user.name}" from ${role.name}`)
    } catch (error) {
      console.error('Failed to revoke role:', error)
      toast.error('Failed to remove user from role')
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev)
        next.delete(user.principal_id)
        return next
      })
    }
  }

  const handleAssignUser = async (user: UserResponse) => {
    if (!role) return

    setPendingChanges((prev) => new Set(prev).add(user.principal_id))

    try {
      await assignRole.mutateAsync({
        roleId: role.id,
        data: {
          principal_id: user.principal_id,
          is_tenant_wide: true,
        },
        tenantId: roleTenantId,
      })
      toast.success(`Assigned "${user.email || user.name}" to ${role.name}`)
    } catch (error) {
      console.error('Failed to assign role:', error)
      toast.error('Failed to assign user to role')
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev)
        next.delete(user.principal_id)
        return next
      })
    }
  }

  const handleAddNewUser = async () => {
    if (!role || !newAssignment.principalId.trim()) return

    setPendingChanges((prev) => new Set(prev).add(newAssignment.principalId))

    try {
      await assignRole.mutateAsync({
        roleId: role.id,
        data: {
          principal_id: newAssignment.principalId.trim(),
          is_tenant_wide: newAssignment.isTenantWide,
          grant_reason: newAssignment.grantReason || undefined,
        },
        tenantId: roleTenantId,
      })
      toast.success(`User assigned to ${role.name}`)
      setNewAssignment({ principalId: '', isTenantWide: true, grantReason: '' })
      setShowAddUser(false)
    } catch (error) {
      console.error('Failed to assign role:', error)
      toast.error('Failed to assign user to role')
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev)
        next.delete(newAssignment.principalId)
        return next
      })
    }
  }

  const assignedCount = assignedUsers.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Users
          </DialogTitle>
          <DialogDescription>
            {role ? (
              <>
                Manage users assigned to <span className="font-medium">{role.name}</span>
              </>
            ) : (
              'Select a role to manage users'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search and Add User */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showAddUser ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => setShowAddUser(!showAddUser)}
            title="Add user by ID"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <h4 className="font-medium text-sm">Add User by Principal ID</h4>
            <div className="space-y-2">
              <Label htmlFor="principalId">Principal ID</Label>
              <Input
                id="principalId"
                placeholder="Enter principal ID..."
                value={newAssignment.principalId}
                onChange={(e) => setNewAssignment((prev) => ({ ...prev, principalId: e.target.value }))}
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
              <Button variant="ghost" size="sm" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleAddNewUser}
                disabled={!newAssignment.principalId.trim() || pendingChanges.has(newAssignment.principalId)}
              >
                {pendingChanges.has(newAssignment.principalId) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Assign
              </Button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Assigned Users */}
              {assignedUsers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-1 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assigned Users ({assignedUsers.length})
                  </h4>
                  <div className="space-y-1">
                    {assignedUsers.map((user) => {
                      const isPending = pendingChanges.has(user.principal_id)

                      return (
                        <div
                          key={user.principal_id}
                          className="flex items-center gap-3 p-3 rounded-md border bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {user.name || user.email || 'Unknown User'}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                Assigned
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {user.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                              )}
                              <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                                {user.principal_id.slice(0, 8)}...
                              </code>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevokeUser(user)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserMinus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Unassigned Users */}
              {unassignedUsers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-1 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Available Users ({unassignedUsers.length})
                  </h4>
                  <div className="space-y-1">
                    {unassignedUsers.map((user) => {
                      const isPending = pendingChanges.has(user.principal_id)

                      return (
                        <div
                          key={user.principal_id}
                          className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {user.name || user.email || 'Unknown User'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {user.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                              )}
                              <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                                {user.principal_id.slice(0, 8)}...
                              </code>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleAssignUser(user)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {assignedUsers.length === 0 && unassignedUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Users className="h-12 w-12 mb-2" />
                  <p>No users found</p>
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
            {assignedCount} user{assignedCount !== 1 ? 's' : ''} assigned
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
