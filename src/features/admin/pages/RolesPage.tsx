import { useState } from 'react'
import { Plus, MoreHorizontal, Edit, Trash2, Shield, Users, Key } from 'lucide-react'
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
import { RoleFormDialog } from '../components/RoleFormDialog'
import { RoleViewModal } from '../components/RoleViewModal'
import { RolePermissionsDialog } from '../components/RolePermissionsDialog'
import { RoleUsersDialog } from '../components/RoleUsersDialog'
import { useRolesPaginated, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useRoles'
import type { RoleResponse, RoleCreate } from '@/types/role'

export default function RolesPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const { data: paginatedData, isLoading, error, refetch, isFetching } = useRolesPaginated({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    include_permissions: true
  })

  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; roleId?: string }>({ open: false })
  const [formDialog, setFormDialog] = useState<{ open: boolean; role?: RoleResponse }>({ open: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; roleIds?: string[] }>({ open: false })
  const [permissionsDialog, setPermissionsDialog] = useState<{ open: boolean; role?: RoleResponse }>({ open: false })
  const [usersDialog, setUsersDialog] = useState<{ open: boolean; role?: RoleResponse }>({ open: false })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const roles = paginatedData?.items || []
  const totalItems = paginatedData?.total

  const columns: ColumnDef<RoleResponse>[] = [
    {
      accessorKey: 'name',
      header: 'Role',
      size: 180,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium truncate max-w-[120px]">{row.getValue('name')}</span>
          {row.original.is_system && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              System
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'id',
      header: 'Role ID',
      size: 120,
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
          {row.original.id.slice(0, 8)}...
        </code>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 200,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs truncate max-w-[180px] block">
          {row.getValue('description') || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'permission_count',
      header: 'Permissions',
      size: 100,
      cell: ({ row }) => {
        const count = row.original.permission_count
        return count !== undefined ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
            <Key className="h-3 w-3 mr-1" />
            {count}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 80,
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge 
            variant={status === 'ACTIVE' ? 'default' : 'secondary'} 
            className="text-[10px] px-1.5 py-0"
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'tenant_id',
      header: 'Tenant',
      size: 100,
      cell: ({ row }) => {
        const tenantId = row.getValue('tenant_id') as string | null
        return tenantId ? (
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
            {tenantId.slice(0, 8)}...
          </code>
        ) : (
          <span className="text-muted-foreground text-xs">Global</span>
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
      accessorKey: 'updated_at',
      header: 'Updated',
      size: 90,
      cell: ({ row }) => {
        const updatedAt = row.original.updated_at
        return (
          <span className="text-xs text-muted-foreground">
            {updatedAt ? new Date(updatedAt).toLocaleDateString() : '—'}
          </span>
        )
      },
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
              <DropdownMenuItem onClick={() => setFormDialog({ open: true, role: row.original })}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPermissionsDialog({ open: true, role: row.original })}>
                <Shield className="mr-2 h-4 w-4" />
                Permissions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUsersDialog({ open: true, role: row.original })}>
                <Users className="mr-2 h-4 w-4" />
                Users
              </DropdownMenuItem>
              {!row.original.is_system && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialog({ open: true, roleId: row.original.id })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
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
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">Manage roles and their permissions</p>
        </div>
        <div className="rounded-lg border bg-destructive/10 p-6 text-destructive">
          Failed to load roles: {(error as Error).message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">Manage roles and their permissions</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        pageSize={pagination.pageSize}
        totalItems={totalItems}
        paginationState={pagination}
        onPaginationChange={(newState: { pageIndex: number; pageSize: number }) => setPagination(newState)}
        searchPlaceholder="Search by name, description..."
        isLoading={isLoading}
        isFetching={isFetching}
        enableRowSelection
        enableColumnPinning
        enableColumnHiding
        exportToCSV
        fileName="roles"
        persistedStateKey="roles-table"
        onRefresh={() => refetch()}
        bulkActions={[
          {
            label: 'Bulk Delete',
            onClick: (selectedRows) => {
              setBulkDeleteDialog({
                open: true,
                roleIds: selectedRows
                  .filter((r: RoleResponse) => !r.is_system)
                  .map((r: RoleResponse) => r.id),
              })
            },
            variant: 'destructive',
            icon: <Trash2 className="h-4 w-4" />,
          },
        ]}
        enableRowClick
        renderViewModal={(role) => (
          <RoleViewModal role={role} />
        )}
        emptyState={{
          title: 'No roles found',
          description: 'Get started by creating your first role.',
          action: {
            label: 'Add Role',
            onClick: () => setFormDialog({ open: true }),
          },
        }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteDialog.roleId) {
            const role = roles.find((r) => r.id === deleteDialog.roleId)
            deleteRole.mutate({ roleId: deleteDialog.roleId, tenantId: role?.tenant_id }, {
              onSuccess: () => {
                setDeleteDialog({ open: false, roleId: undefined })
              },
            })
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteDialog.open}
        onOpenChange={(open) => setBulkDeleteDialog({ ...bulkDeleteDialog, open })}
        title="Delete Multiple Roles"
        description={`Are you sure you want to delete ${bulkDeleteDialog.roleIds?.length || 0} roles? System roles cannot be deleted. This action cannot be undone.`}
        variant="danger"
        confirmLabel={isBulkDeleting ? 'Deleting...' : 'Delete All'}
        onConfirm={async () => {
          const roleIds = bulkDeleteDialog.roleIds || []
          if (roleIds.length === 0) return
          
          setIsBulkDeleting(true)
          let successCount = 0
          let failCount = 0
          
          for (const roleId of roleIds) {
            try {
              const role = roles.find((r) => r.id === roleId)
              await deleteRole.mutateAsync({ roleId, tenantId: role?.tenant_id })
              successCount++
            } catch (error) {
              failCount++
              console.error(`Failed to delete role ${roleId}:`, error)
            }
          }
          
          setIsBulkDeleting(false)
          setBulkDeleteDialog({ open: false, roleIds: undefined })
          
          if (failCount === 0) {
            toast.success(`Successfully deleted ${successCount} role${successCount > 1 ? 's' : ''}`)
          } else {
            toast.warning(`Deleted ${successCount} of ${roleIds.length} roles. ${failCount} failed.`)
          }
          
          refetch()
        }}
      />

      <RoleFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, role: undefined })}
        role={formDialog.role}
        onSubmit={async (data, tenantId) => {
          try {
            if (formDialog.role) {
              await updateRole.mutateAsync({ 
                roleId: formDialog.role.id, 
                data: data as Partial<RoleCreate>,
                tenantId: tenantId 
              })
            } else {
              if (!tenantId) {
                toast.error('Please select a tenant before creating a role')
                return
              }
              await createRole.mutateAsync({ 
                data: data as RoleCreate,
                tenantId: tenantId 
              })
            }
            setFormDialog({ open: false, role: undefined })
            refetch()
          } catch (error) {
            console.error('Failed to save role:', error)
          }
        }}
        isSubmitting={createRole.isPending || updateRole.isPending}
      />

      <RolePermissionsDialog
        open={permissionsDialog.open}
        onOpenChange={(open) => setPermissionsDialog({ open, role: undefined })}
        role={permissionsDialog.role || null}
      />

      <RoleUsersDialog
        open={usersDialog.open}
        onOpenChange={(open) => setUsersDialog({ open, role: undefined })}
        role={usersDialog.role || null}
      />
    </div>
  )
}
