import { useState, useMemo } from 'react'
import { Plus, MoreHorizontal, Edit, Trash2, Building, Check, X, RefreshCw, ChevronDown, Link2, Settings } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { StatusBadge, StatusDot } from '@/components/shared/StatusBadge'
import { AdminDataTable } from '@/components/shared/AdminDataTable'
import { TenantFormDialog } from '../components/TenantFormDialog'
import { TenantViewModal } from '../components/TenantViewModal'
import { useTenantsPaginated, useCreateTenant, useUpdateTenant, useDeleteTenant, useSuspendTenant, useActivateTenant } from '@/hooks/useTenants'
import type { TenantResponse, TenantCreate } from '@/types/tenant'
import { cn } from '@/lib/utils'

// Status tab filter
type StatusTab = 'all' | 'active' | 'suspended' | 'pending'

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending Deletion' },
]

// Column width configuration
const COLUMN_WIDTHS = {
  select: '48px',
  name: '180px',
  id: '140px',
  slug: '120px',
  description: '200px',
  status: '120px',
  features: '80px',
  created: '120px',
  actions: '80px',
}

export default function TenantsPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  
  const { data: paginatedData, isLoading, error, refetch, isFetching } = useTenantsPaginated({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  })
  
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()
  const deleteTenant = useDeleteTenant()
  const suspendTenant = useSuspendTenant()
  const activateTenant = useActivateTenant()
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tenantId?: string }>({ open: false })
  const [formDialog, setFormDialog] = useState<{ open: boolean; tenant?: TenantResponse }>({ open: false })
  const [viewModal, setViewModal] = useState<{ open: boolean; tenant?: TenantResponse }>({ open: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; tenantIds?: string[] }>({ open: false })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const tenants = paginatedData?.items || []
  const totalItems = paginatedData?.total || 0

  // Status statistics
  const statusStats = useMemo(() => {
    return {
      active: tenants.filter(t => t.status === 'ACTIVE').length,
      suspended: tenants.filter(t => t.status === 'SUSPENDED').length,
      pending: tenants.filter(t => t.status === 'PENDING_DELETION').length,
    }
  }, [tenants])

  // Toggle row selection
  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Toggle all rows
  const toggleAllRows = () => {
    if (selectedRows.size === tenants.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(tenants.map(t => t.id)))
    }
  }

  // Table columns
  const columns: ColumnDef<TenantResponse>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={tenants.length > 0 && selectedRows.size === tenants.length}
          onCheckedChange={toggleAllRows}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.has(row.original.id)}
          onCheckedChange={() => toggleRowSelection(row.original.id)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 48,
    },
    {
      accessorKey: 'name',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Tenant Name</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate max-w-[140px]">{row.getValue('name')}</span>
        </div>
      ),
      size: 180,
    },
    {
      accessorKey: 'id',
      header: 'Tenant ID',
      cell: ({ row }) => (
        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
          {row.original.id.slice(0, 8)}...
        </code>
      ),
      size: 140,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          <code className="rounded bg-muted px-2 py-1 text-xs font-mono">{row.getValue('slug')}</code>
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm truncate max-w-[180px] block">
          {row.original.description || '—'}
        </span>
      ),
      size: 200,
    },
    {
      accessorKey: 'status',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Status</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variant = status === 'ACTIVE' ? 'active' : status === 'SUSPENDED' ? 'locked' : 'disabled'
        return <StatusBadge status={variant as 'active' | 'locked' | 'disabled'} />
      },
      size: 120,
    },
    {
      accessorKey: 'entitlements',
      header: 'Features',
      cell: ({ row }) => {
        const entitlements = row.original.entitlements || {}
        const count = Object.keys(entitlements).length
        return (
          <div className="flex items-center gap-1">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{count}</span>
          </div>
        )
      },
      size: 80,
    },
    {
      accessorKey: 'created_at',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Created</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {new Date(row.getValue('created_at')).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
      size: 120,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const status = row.original.status
        const canDelete = status === 'PENDING_DELETION'

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewModal({ open: true, tenant: row.original })}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFormDialog({ open: true, tenant: row.original })}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {status === 'SUSPENDED' && (
                  <DropdownMenuItem
                    onClick={() => {
                      activateTenant.mutate(row.original.id, {
                        onSuccess: () => refetch(),
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
                        onSuccess: () => refetch(),
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
      size: 80,
    },
  ]

  if (error) {
    return (
      <div className="p-10">
        <div>
          <h1 className="text-2xl font-semibold">Tenants</h1>
          <p className="text-muted-foreground text-sm">Tenant Management / Tenants</p>
        </div>
        <div className="mt-6 rounded-lg border bg-destructive/10 p-6 text-destructive">
          Failed to load tenants: {(error as Error).message}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Action Buttons - Top Right */}
      <div className="absolute top-[105px] right-10 flex items-center gap-4">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-12 w-12 bg-accent hover:bg-accent/90"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-5 w-5", isFetching && "animate-spin")} />
        </Button>
        <Button 
          className="h-12 px-6 gap-2"
          onClick={() => setFormDialog({ open: true })}
        >
          <Plus className="h-5 w-5" />
          Add Tenant
        </Button>
      </div>

      {/* Page Content */}
      <div className="flex flex-col">
        {/* Page Header */}
        <div className="px-10 py-4">
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-primary cursor-pointer hover:underline">Tenant Management</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Tenants</span>
          </div>
          <h1 className="text-2xl font-semibold">Tenants</h1>
        </div>

        {/* Tab Bar */}
        <div className="px-10 py-4 relative">
          <div className="flex items-end gap-4">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'pb-6 text-lg font-medium transition-colors relative',
                  activeTab === tab.value
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
          <div className="absolute bottom-4 left-10 right-10 h-0.5 bg-border -z-10" />
        </div>

        {/* Statistics */}
        <div className="px-10 py-4 flex items-center justify-end">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.active}</span>
              <StatusDot color="green" label="Active" />
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.suspended}</span>
              <StatusDot color="red" label="Suspended" />
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.pending}</span>
              <StatusDot color="gray" label="Pending" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-10 py-4">
          <AdminDataTable
            data={tenants}
            columns={columns}
            columnWidths={COLUMN_WIDTHS}
            isLoading={isLoading}
            isFetching={isFetching}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalItems={totalItems}
            onRowClick={(tenant) => setViewModal({ open: true, tenant })}
            getRowKey={(tenant) => tenant.id}
            emptyIcon={<Building className="h-12 w-12 opacity-50" />}
            emptyTitle="No tenants found"
            emptyDescription="Get started by creating your first tenant."
            onEmptyAction={() => setFormDialog({ open: true })}
            emptyActionLabel="Add Tenant"
          />
        </div>
      </div>

      {/* Dialogs */}
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
          setSelectedRows(new Set())
          
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

      {/* View Modal */}
      {viewModal.open && viewModal.tenant && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setViewModal({ open: false })}
        >
          <div
            className="bg-card rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <TenantViewModal tenant={viewModal.tenant} />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setViewModal({ open: false })}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
