import { useState } from 'react'
import { Plus, MoreHorizontal, Edit, Trash2, Building, Check, X, Activity, Link2, Settings } from 'lucide-react'
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
import { TenantFormDialog } from '../components/TenantFormDialog'
import { TenantViewModal } from '../components/TenantViewModal'
import { useTenantsPaginated, useCreateTenant, useUpdateTenant, useDeleteTenant, useSuspendTenant, useActivateTenant } from '@/hooks/useTenants'
import type { TenantResponse, TenantCreate } from '@/types/tenant'

export default function TenantsPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const { data: paginatedData, isLoading, error, refetch, isFetching } = useTenantsPaginated({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  })
  console.log('[DEBUG TenantsPage] paginatedData:', paginatedData)
  console.log('[DEBUG TenantsPage] isLoading:', isLoading)
  console.log('[DEBUG TenantsPage] error:', error)
  
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()
  const deleteTenant = useDeleteTenant()
  const suspendTenant = useSuspendTenant()
  const activateTenant = useActivateTenant()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tenantId?: string }>({ open: false })
  const [formDialog, setFormDialog] = useState<{ open: boolean; tenant?: TenantResponse }>({ open: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; tenantIds?: string[] }>({ open: false })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const tenants = paginatedData?.items || []
  const totalItems = paginatedData?.total
  console.log('[DEBUG TenantsPage] tenants length:', tenants.length)
  console.log('[DEBUG TenantsPage] totalItems:', totalItems)

  const columns: ColumnDef<TenantResponse>[] = [
    {
      accessorKey: 'name',
      header: 'Tenant',
      size: 180,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium truncate max-w-[140px]">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'id',
      header: 'Tenant ID',
      size: 120,
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
          {row.original.id.slice(0, 8)}...
        </code>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      size: 120,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link2 className="h-3 w-3 text-muted-foreground" />
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">{row.getValue('slug')}</code>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 160,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs truncate max-w-[140px] block">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const statusConfig: Record<string, { variant: 'default' | 'destructive' | 'secondary'; icon: typeof Activity }> = {
          ACTIVE: { variant: 'default', icon: Check },
          SUSPENDED: { variant: 'destructive', icon: X },
          PENDING_DELETION: { variant: 'secondary', icon: Trash2 },
        }
        const config = statusConfig[status] || { variant: 'secondary' as const, icon: Activity }
        const Icon = config.icon
        return (
          <div className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
              {status.replace('_', ' ')}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'entitlements',
      header: 'Features',
      size: 80,
      cell: ({ row }) => {
        const entitlements = row.original.entitlements || {}
        const count = Object.keys(entitlements).length
        return (
          <div className="flex items-center gap-1">
            <Settings className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{count}</span>
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
      cell: ({ row }) => {
        const status = row.original.status
        const canDelete = status === 'PENDING_DELETION'

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFormDialog({ open: true, tenant: row.original })}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {status === 'SUSPENDED' && (
                  <DropdownMenuItem
                    onClick={() => {
                      activateTenant.mutate(row.original.id, {
                        onSuccess: () => {
                          refetch()
                        },
                      })
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                {status === 'ACTIVE' && (
                  <DropdownMenuItem
                    onClick={() => {
                      suspendTenant.mutate(row.original.id, {
                        onSuccess: () => {
                          refetch()
                        },
                      })
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Suspend
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteDialog({ open: true, tenantId: row.original.id })}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage multi-tenant organizations</p>
        </div>
        <div className="rounded-lg border bg-destructive/10 p-6 text-destructive">
          Failed to load tenants: {(error as Error).message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage multi-tenant organizations</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tenants}
        pageSize={pagination.pageSize}
        totalItems={totalItems}
        paginationState={pagination}
        searchPlaceholder="Search by name, slug..."
        isLoading={isLoading}
        isFetching={isFetching}
        enableRowSelection
        enableColumnPinning
        enableColumnHiding
        exportToCSV
        fileName="tenants"
        persistedStateKey="tenants-table"
        onRefresh={() => refetch()}
        onPaginationChange={(newState: { pageIndex: number; pageSize: number }) => setPagination(newState)}
        bulkActions={[
          {
            label: 'Bulk Delete',
            onClick: (selectedRows) => {
              setBulkDeleteDialog({
                open: true,
                tenantIds: selectedRows
                  .filter((t: TenantResponse) => t.status === 'PENDING_DELETION')
                  .map((t: TenantResponse) => t.id),
              })
            },
            variant: 'destructive',
            icon: <Trash2 className="h-4 w-4" />,
          },
        ]}
        enableRowClick
        renderViewModal={(tenant) => (
          <TenantViewModal tenant={tenant} />
        )}
        emptyState={{
          title: 'No tenants found',
          description: 'Get started by creating your first tenant.',
          action: {
            label: 'Add Tenant',
            onClick: () => setFormDialog({ open: true }),
          },
        }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Tenant"
        description="Are you sure you want to delete this tenant? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteDialog.tenantId) {
            deleteTenant.mutate(deleteDialog.tenantId, {
              onSuccess: () => {
                setDeleteDialog({ open: false, tenantId: undefined })
                refetch()
              },
            })
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteDialog.open}
        onOpenChange={(open) => setBulkDeleteDialog({ ...bulkDeleteDialog, open })}
        title="Delete Multiple Tenants"
        description={`Are you sure you want to delete ${bulkDeleteDialog.tenantIds?.length || 0} tenants? Only tenants in PENDING_DELETION status can be deleted. This action cannot be undone.`}
        variant="danger"
        confirmLabel={isBulkDeleting ? 'Deleting...' : 'Delete All'}
        onConfirm={async () => {
          const tenantIds = bulkDeleteDialog.tenantIds || []
          if (tenantIds.length === 0) return
          
          setIsBulkDeleting(true)
          let successCount = 0
          let failCount = 0
          
          for (const tenantId of tenantIds) {
            try {
              await deleteTenant.mutateAsync(tenantId)
              successCount++
            } catch (error) {
              failCount++
              console.error(`Failed to delete tenant ${tenantId}:`, error)
            }
          }
          
          setIsBulkDeleting(false)
          setBulkDeleteDialog({ open: false, tenantIds: undefined })
          
          if (failCount === 0) {
            toast.success(`Successfully deleted ${successCount} tenant${successCount > 1 ? 's' : ''}`)
          } else {
            toast.warning(`Deleted ${successCount} of ${tenantIds.length} tenants. ${failCount} failed.`)
          }
          
          refetch()
        }}
      />

      <TenantFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, tenant: undefined })}
        tenant={formDialog.tenant}
        onSubmit={async (data) => {
          try {
            if (formDialog.tenant) {
              await updateTenant.mutateAsync({ tenantId: formDialog.tenant.id, data: data })
            } else {
              await createTenant.mutateAsync(data as TenantCreate)
            }
            setFormDialog({ open: false, tenant: undefined })
            refetch()
          } catch (error) {
            console.error('Failed to save tenant:', error)
          }
        }}
        isSubmitting={createTenant.isPending || updateTenant.isPending}
      />
    </div>
  )
}
