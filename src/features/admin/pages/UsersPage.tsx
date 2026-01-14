import { useState } from 'react'
import { Plus, MoreHorizontal, Edit, Trash2, Mail, Shield, Clock, Globe } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { UserFormDialog } from '../components/UserFormDialog'
import { UserViewModal } from '../components/UserViewModal'
import { UserRolesDialog } from '../components/UserRolesDialog'
import { useUsersPaginated, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import type { UserResponse, UserCreate } from '@/types/user'

export default function UsersPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const { data: paginatedData, isLoading, error, refetch, isFetching } = useUsersPaginated({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  })
  console.log('[DEBUG UsersPage] paginatedData:', paginatedData)
  console.log('[DEBUG UsersPage] isLoading:', isLoading)
  console.log('[DEBUG UsersPage] error:', error)
  const { data: roles } = useRoles()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId?: string }>({ open: false })
  const [formDialog, setFormDialog] = useState<{ open: boolean; user?: UserResponse }>({ open: false })
  const [rolesDialog, setRolesDialog] = useState<{ open: boolean; user?: UserResponse }>({ open: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; userIds?: string[] }>({ open: false })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const users = paginatedData?.items || []
  const totalItems = paginatedData?.total
  console.log('[DEBUG UsersPage] users length:', users.length)
  console.log('[DEBUG UsersPage] totalItems:', totalItems)

  const columns: ColumnDef<UserResponse>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      size: 220,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium truncate max-w-[180px]">{row.getValue('email') || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 150,
      cell: ({ row }) => (
        <span className="truncate max-w-[130px] block">{row.getValue('name') || '—'}</span>
      ),
    },
    {
      accessorKey: 'principal_id',
      header: 'Principal ID',
      size: 130,
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
          {row.original.principal_id.slice(0, 8)}...
        </code>
      ),
    },
    {
      accessorKey: 'idp_issuer',
      header: 'Identity Provider',
      size: 140,
      cell: ({ row }) => {
        const issuer = row.getValue('idp_issuer') as string
        const provider = issuer.includes('zitadel') ? 'Zitadel' 
          : issuer.includes('keycloak') ? 'Keycloak'
          : issuer.includes('google') ? 'Google'
          : issuer.includes('microsoft') ? 'Microsoft'
          : issuer.split('/').pop() || 'Unknown'
        return (
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="outline" className="text-[11px] px-1.5 py-0">{provider}</Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'last_seen_at',
      header: 'Last Active',
      size: 110,
      cell: ({ row }) => {
        const lastSeen = row.getValue('last_seen_at') as string | null
        if (!lastSeen) return <span className="text-muted-foreground text-xs">Never</span>
        const date = new Date(lastSeen)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMins = Math.floor(diffMs / (1000 * 60))
        
        let timeAgo = ''
        if (diffMins < 60) timeAgo = `${diffMins}m ago`
        else if (diffHours < 24) timeAgo = `${diffHours}h ago`
        else if (diffDays < 7) timeAgo = `${diffDays}d ago`
        else timeAgo = date.toLocaleDateString()
        
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">{timeAgo}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      size: 90,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.getValue('created_at')).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 50,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFormDialog({ open: true, user: row.original })}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRolesDialog({ open: true, user: row.original })}>
                <Shield className="mr-2 h-4 w-4" />
                Roles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialog({ open: true, userId: row.original.principal_id })}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <div className="rounded-lg border bg-destructive/10 p-6 text-destructive">
          Failed to load users: {(error as Error).message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true })}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        pageSize={pagination.pageSize}
        totalItems={totalItems}
        paginationState={pagination}
        searchPlaceholder="Search by email, name..."
        isLoading={isLoading}
        isFetching={isFetching}
        enableRowSelection
        enableColumnPinning
        enableColumnHiding
        exportToCSV
        fileName="users"
        persistedStateKey="users-table"
        onRefresh={() => refetch()}
        onPaginationChange={(newState: { pageIndex: number; pageSize: number }) => setPagination(newState)}
        bulkActions={[
          {
            label: 'Bulk Delete',
            onClick: (selectedRows) => {
              setBulkDeleteDialog({
                open: true,
                userIds: selectedRows.map((u: UserResponse) => u.principal_id),
              })
            },
            variant: 'destructive',
            icon: <Trash2 className="h-4 w-4" />,
          },
        ]}
        enableRowClick
        renderViewModal={(user) => (
          <UserViewModal user={user} />
        )}
        emptyState={{
          title: 'No users found',
          description: 'Get started by adding your first user.',
          action: {
            label: 'Add User',
            onClick: () => setFormDialog({ open: true }),
          },
        }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteDialog.userId) return

          try {
            await deleteUser.mutateAsync({ principalId: deleteDialog.userId })
            setDeleteDialog({ open: false, userId: undefined })
            refetch()
          } catch (error) {
            console.error('Failed to delete user:', error)
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteDialog.open}
        onOpenChange={(open) => setBulkDeleteDialog({ ...bulkDeleteDialog, open })}
        title="Delete Multiple Users"
        description={`Are you sure you want to delete ${bulkDeleteDialog.userIds?.length || 0} users? This action cannot be undone.`}
        variant="danger"
        confirmLabel={isBulkDeleting ? 'Deleting...' : 'Delete All'}
        onConfirm={async () => {
          const userIds = bulkDeleteDialog.userIds || []
          if (userIds.length === 0) return
          
          setIsBulkDeleting(true)
          let successCount = 0
          let failCount = 0
          
          for (const principalId of userIds) {
            try {
              await deleteUser.mutateAsync({ principalId })
              successCount++
            } catch (error) {
              failCount++
              console.error(`Failed to delete user ${principalId}:`, error)
            }
          }
          
          setIsBulkDeleting(false)
          setBulkDeleteDialog({ open: false, userIds: undefined })
          
          if (failCount === 0) {
            toast.success(`Successfully deleted ${successCount} user${successCount > 1 ? 's' : ''}`)
          } else {
            toast.warning(`Deleted ${successCount} of ${userIds.length} users. ${failCount} failed.`)
          }
          
          refetch()
        }}
      />

      <UserFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, user: undefined })}
        user={formDialog.user}
        roles={roles}
        onSubmit={async (data) => {
          try {
            if (formDialog.user) {
              await updateUser.mutateAsync({ principalId: formDialog.user.principal_id, data: data })
            } else {
              await createUser.mutateAsync(data as UserCreate)
            }
            setFormDialog({ open: false, user: undefined })
            refetch()
          } catch (error) {
            console.error('Failed to save user:', error)
          }
        }}
        isSubmitting={createUser.isPending || updateUser.isPending}
      />

      <UserRolesDialog
        open={rolesDialog.open}
        onOpenChange={(open) => setRolesDialog({ open, user: undefined })}
        user={rolesDialog.user || null}
      />
    </div>
  )
}
