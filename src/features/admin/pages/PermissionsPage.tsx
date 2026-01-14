import { useState } from 'react'
import { Plus, MoreHorizontal, Edit, Trash2, Key, Lock, AlertTriangle, CheckCircle } from 'lucide-react'
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
import { PermissionFormDialog } from '../components/PermissionFormDialog'
import { PermissionViewModal } from '../components/PermissionViewModal'
import { usePermissionsPaginated, useCreatePermission, useUpdatePermission, useDeletePermission } from '@/hooks/usePermissions'
import { useTenantStore } from '@/stores/tenantStore'
import type { PermissionResponse } from '@/types/role'

export default function PermissionsPage() {
  const currentTenantId = useTenantStore((state) => state.currentTenantId)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const { data: paginatedData, isLoading, error, refetch, isFetching } = usePermissionsPaginated({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  })
  const createPermission = useCreatePermission()
  const updatePermission = useUpdatePermission()
  const deletePermission = useDeletePermission()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; permissionId?: string }>({ open: false })
  const [formDialog, setFormDialog] = useState<{ open: boolean; permission?: PermissionResponse }>({ open: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; permissionIds?: string[] }>({ open: false })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const permissions = paginatedData?.items || []
  const totalItems = paginatedData?.total

  const columns: ColumnDef<PermissionResponse>[] = [
    {
      accessorKey: 'permission_key',
      header: 'Permission Key',
      size: 200,
      cell: ({ row }) => {
        const key = row.getValue('permission_key') as string
        const parts = key.split(':')
        const namespace = parts.length > 1 ? parts[0] : null
        const action = parts.length > 1 ? parts.slice(1).join(':') : key
        return (
          <div className="flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1 font-mono text-xs">
              {namespace && (
                <>
                  <span className="text-primary">{namespace}</span>
                  <span className="text-muted-foreground">:</span>
                </>
              )}
              <span className="font-medium truncate max-w-[120px]">{action}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'id',
      header: 'ID',
      size: 100,
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
          {row.original.id.slice(0, 8)}...
        </code>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 180,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs truncate max-w-[160px] block">
          {row.getValue('description') || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 90,
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variant = status === 'ACTIVE' ? 'default' : status === 'DEPRECATED' ? 'secondary' : 'destructive'
        const Icon = status === 'ACTIVE' ? CheckCircle : status === 'DEPRECATED' ? AlertTriangle : Lock
        return (
          <div className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            <Badge variant={variant} className="text-[10px] px-1.5 py-0">{status}</Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'risk_level',
      header: 'Risk',
      size: 70,
      cell: ({ row }) => {
        const risk = row.getValue('risk_level') as string
        const colors: Record<string, string> = {
          LOW: 'bg-green-500/10 text-green-600 border-green-500/20',
          MEDIUM: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
          HIGH: 'bg-red-500/10 text-red-600 border-red-500/20',
        }
        return (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colors[risk] || ''}`}>
            {risk}
          </span>
        )
      },
    },
    {
      accessorKey: 'is_system',
      header: 'Type',
      size: 70,
      cell: ({ row }) => (
        <Badge variant={row.original.is_system ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
          {row.original.is_system ? 'System' : 'Custom'}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_assignable',
      header: 'Assign',
      size: 60,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.getValue('is_assignable') ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      ),
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
              <DropdownMenuItem onClick={() => setFormDialog({ open: true, permission: row.original })}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialog({ open: true, permissionId: row.original.id })}
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
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-muted-foreground">Manage permissions for role-based access control</p>
        </div>
        <div className="rounded-lg border bg-destructive/10 p-6 text-destructive">
          Failed to load permissions: {(error as Error).message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-muted-foreground">Manage permissions for role-based access control</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Permission
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={permissions}
        pageSize={pagination.pageSize}
        totalItems={totalItems}
        paginationState={pagination}
        onPaginationChange={(newState: { pageIndex: number; pageSize: number }) => setPagination(newState)}
        searchPlaceholder="Search by permission key..."
        isLoading={isLoading}
        isFetching={isFetching}
        enableRowSelection
        enableColumnPinning
        enableColumnHiding
        exportToCSV
        fileName="permissions"
        persistedStateKey="permissions-table"
        onRefresh={() => refetch()}
        bulkActions={[
          {
            label: 'Bulk Delete',
            onClick: (selectedRows) => {
              setBulkDeleteDialog({
                open: true,
                permissionIds: selectedRows.map((p: PermissionResponse) => p.id),
              })
            },
            variant: 'destructive',
            icon: <Trash2 className="h-4 w-4" />,
          },
        ]}
        enableRowClick
        renderViewModal={(permission) => (
          <PermissionViewModal permission={permission} />
        )}
        emptyState={{
          title: 'No permissions found',
          description: 'Get started by creating your first permission.',
          action: {
            label: 'Add Permission',
            onClick: () => setFormDialog({ open: true }),
          },
        }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Permission"
        description="Are you sure you want to delete this permission? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteDialog.permissionId) {
            deletePermission.mutate({ permissionId: deleteDialog.permissionId }, {
              onSuccess: () => {
                setDeleteDialog({ open: false, permissionId: undefined })
              },
            })
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteDialog.open}
        onOpenChange={(open) => setBulkDeleteDialog({ ...bulkDeleteDialog, open })}
        title="Delete Multiple Permissions"
        description={`Are you sure you want to delete ${bulkDeleteDialog.permissionIds?.length || 0} permissions? This action cannot be undone.`}
        variant="danger"
        confirmLabel={isBulkDeleting ? 'Deleting...' : 'Delete All'}
        onConfirm={async () => {
          const permissionIds = bulkDeleteDialog.permissionIds || []
          if (permissionIds.length === 0) return
          
          setIsBulkDeleting(true)
          let successCount = 0
          let failCount = 0
          
          for (const permissionId of permissionIds) {
            try {
              await deletePermission.mutateAsync({ permissionId })
              successCount++
            } catch (error) {
              failCount++
              console.error(`Failed to delete permission ${permissionId}:`, error)
            }
          }
          
          setIsBulkDeleting(false)
          setBulkDeleteDialog({ open: false, permissionIds: undefined })
          
          if (failCount === 0) {
            toast.success(`Successfully deleted ${successCount} permission${successCount > 1 ? 's' : ''}`)
          } else {
            toast.warning(`Deleted ${successCount} of ${permissionIds.length} permissions. ${failCount} failed.`)
          }
          
          refetch()
        }}
      />

      <PermissionFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, permission: undefined })}
        permission={formDialog.permission}
        onSubmit={async (data) => {
          try {
            if (formDialog.permission) {
              await updatePermission.mutateAsync({ 
                permissionId: formDialog.permission.id, 
                data: data 
              })
            } else {
              await createPermission.mutateAsync({ data, tenantId: currentTenantId ?? undefined })
            }
            setFormDialog({ open: false, permission: undefined })
            refetch()
          } catch (error) {
            console.error('Failed to save permission:', error)
          }
        }}
        isSubmitting={createPermission.isPending || updatePermission.isPending}
      />
    </div>
  )
}
