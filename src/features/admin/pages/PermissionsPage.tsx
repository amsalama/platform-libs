import { useState, useMemo } from 'react'
import { Plus, MoreHorizontal, Edit, Trash2, Key, Lock, CheckCircle, RefreshCw, ChevronDown } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { PermissionFormDialog } from '../components/PermissionFormDialog'
import { PermissionViewModal } from '../components/PermissionViewModal'
import { usePermissionsPaginated, useCreatePermission, useUpdatePermission, useDeletePermission } from '@/hooks/usePermissions'
import { useTenantStore } from '@/stores/tenantStore'
import type { PermissionResponse } from '@/types/role'
import { cn } from '@/lib/utils'

// Status tab filter
type StatusTab = 'all' | 'active' | 'deprecated' | 'system'

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'system', label: 'System' },
]

// Column width configuration
const COLUMN_WIDTHS = {
  select: '48px',
  key: '220px',
  id: '120px',
  description: '200px',
  status: '100px',
  risk: '80px',
  type: '80px',
  assignable: '80px',
  created: '120px',
  actions: '80px',
}

export default function PermissionsPage() {
  const currentTenantId = useTenantStore((state) => state.currentTenantId)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  
  const { data: paginatedData, isLoading, error, refetch, isFetching } = usePermissionsPaginated({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  })
  
  const createPermission = useCreatePermission()
  const updatePermission = useUpdatePermission()
  const deletePermission = useDeletePermission()
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; permissionId?: string }>({ open: false })
  const [formDialog, setFormDialog] = useState<{ open: boolean; permission?: PermissionResponse }>({ open: false })
  const [viewModal, setViewModal] = useState<{ open: boolean; permission?: PermissionResponse }>({ open: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; permissionIds?: string[] }>({ open: false })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const permissions = paginatedData?.items || []
  const totalItems = paginatedData?.total || 0

  // Status statistics
  const statusStats = useMemo(() => {
    return {
      active: permissions.filter(p => p.status === 'ACTIVE').length,
      deprecated: permissions.filter(p => p.status === 'DEPRECATED').length,
      system: permissions.filter(p => p.is_system).length,
    }
  }, [permissions])

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
    if (selectedRows.size === permissions.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(permissions.map(p => p.id)))
    }
  }

  // Table columns
  const columns: ColumnDef<PermissionResponse>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={permissions.length > 0 && selectedRows.size === permissions.length}
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
      accessorKey: 'permission_key',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Permission Key</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const key = row.getValue('permission_key') as string
        const parts = key.split(':')
        const namespace = parts.length > 1 ? parts[0] : null
        const action = parts.length > 1 ? parts.slice(1).join(':') : key
        return (
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1 font-mono text-sm">
              {namespace && (
                <>
                  <span className="text-primary">{namespace}</span>
                  <span className="text-muted-foreground">:</span>
                </>
              )}
              <span className="font-medium truncate max-w-[140px]">{action}</span>
            </div>
          </div>
        )
      },
      size: 220,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
          {row.original.id.slice(0, 8)}...
        </code>
      ),
      size: 120,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm truncate max-w-[180px] block">
          {row.getValue('description') || '—'}
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
        const variant = status === 'ACTIVE' ? 'active' : status === 'DEPRECATED' ? 'disabled' : 'locked'
        return <StatusBadge status={variant as 'active' | 'disabled' | 'locked'} />
      },
      size: 100,
    },
    {
      accessorKey: 'risk_level',
      header: 'Risk',
      cell: ({ row }) => {
        const risk = row.getValue('risk_level') as string
        const colors: Record<string, string> = {
          LOW: 'bg-green-500/10 text-green-500 border-green-500/20',
          MEDIUM: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          HIGH: 'bg-red-500/10 text-red-500 border-red-500/20',
        }
        return (
          <span className={cn('text-xs px-2 py-1 rounded border font-medium', colors[risk] || '')}>
            {risk}
          </span>
        )
      },
      size: 80,
    },
    {
      accessorKey: 'is_system',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant={row.original.is_system ? 'secondary' : 'outline'} className="text-xs">
          {row.original.is_system ? 'System' : 'Custom'}
        </Badge>
      ),
      size: 80,
    },
    {
      accessorKey: 'is_assignable',
      header: 'Assign',
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.getValue('is_assignable') ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
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
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewModal({ open: true, permission: row.original })}>
                View Details
              </DropdownMenuItem>
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
      size: 80,
    },
  ]

  if (error) {
    return (
      <div className="p-10">
        <div>
          <h1 className="text-2xl font-semibold">Permissions</h1>
          <p className="text-muted-foreground text-sm">Permission Management / Permissions</p>
        </div>
        <div className="mt-6 rounded-lg border bg-destructive/10 p-6 text-destructive">
          Failed to load permissions: {(error as Error).message}
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
          Add Permission
        </Button>
      </div>

      {/* Page Content */}
      <div className="flex flex-col">
        {/* Page Header */}
        <div className="px-10 py-4">
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-primary cursor-pointer hover:underline">Permission Management</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Permissions</span>
          </div>
          <h1 className="text-2xl font-semibold">Permissions</h1>
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
              <span className="text-lg font-mono">{statusStats.deprecated}</span>
              <StatusDot color="gray" label="Deprecated" />
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.system}</span>
              <StatusDot color="blue" label="System" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-10 py-4">
          <AdminDataTable
            data={permissions}
            columns={columns}
            columnWidths={COLUMN_WIDTHS}
            isLoading={isLoading}
            isFetching={isFetching}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalItems={totalItems}
            onRowClick={(permission) => setViewModal({ open: true, permission })}
            getRowKey={(permission) => permission.id}
            emptyIcon={<Key className="h-12 w-12 opacity-50" />}
            emptyTitle="No permissions found"
            emptyDescription="Get started by creating your first permission."
            onEmptyAction={() => setFormDialog({ open: true })}
            emptyActionLabel="Add Permission"
          />
        </div>
      </div>

      {/* Dialogs */}
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
                refetch()
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
          setSelectedRows(new Set())
          
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

      {/* View Modal */}
      {viewModal.open && viewModal.permission && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setViewModal({ open: false })}
        >
          <div
            className="bg-card rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <PermissionViewModal permission={viewModal.permission} />
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
