import { useState, useMemo } from 'react'
import { Plus, MoreHorizontal, Edit, Trash2, Shield, Users, Key, RefreshCw, ChevronDown } from 'lucide-react'
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
import { RoleFormDialog } from '../components/RoleFormDialog'
import { RoleViewModal } from '../components/RoleViewModal'
import { RolePermissionsDialog } from '../components/RolePermissionsDialog'
import { RoleUsersDialog } from '../components/RoleUsersDialog'
import { useRolesPaginated, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useRoles'
import type { RoleResponse, RoleCreate } from '@/types/role'
import { cn } from '@/lib/utils'

// Status tab filter
type StatusTab = 'all' | 'active' | 'inactive' | 'system'

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'system', label: 'System' },
]

// Column width configuration
const COLUMN_WIDTHS = {
  select: '48px',
  name: '200px',
  id: '140px',
  description: '220px',
  permissions: '100px',
  status: '100px',
  tenant: '120px',
  created: '120px',
  actions: '80px',
}

export default function RolesPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  
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
  const [viewModal, setViewModal] = useState<{ open: boolean; role?: RoleResponse }>({ open: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; roleIds?: string[] }>({ open: false })
  const [permissionsDialog, setPermissionsDialog] = useState<{ open: boolean; role?: RoleResponse }>({ open: false })
  const [usersDialog, setUsersDialog] = useState<{ open: boolean; role?: RoleResponse }>({ open: false })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const roles = paginatedData?.items || []
  const totalItems = paginatedData?.total || 0

  // Status statistics
  const statusStats = useMemo(() => {
    return {
      active: roles.filter(r => r.status === 'ACTIVE').length,
      inactive: roles.filter(r => r.status !== 'ACTIVE').length,
      system: roles.filter(r => r.is_system).length,
    }
  }, [roles])

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
    if (selectedRows.size === roles.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(roles.map(r => r.id)))
    }
  }

  // Table columns
  const columns: ColumnDef<RoleResponse>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={roles.length > 0 && selectedRows.size === roles.length}
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
          <span>Role Name</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate max-w-[140px]">{row.getValue('name')}</span>
          {row.original.is_system && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              System
            </Badge>
          )}
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: 'id',
      header: 'Role ID',
      cell: ({ row }) => (
        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
          {row.original.id.slice(0, 8)}...
        </code>
      ),
      size: 140,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
          {row.getValue('description') || '—'}
        </span>
      ),
      size: 220,
    },
    {
      accessorKey: 'permission_count',
      header: 'Permissions',
      cell: ({ row }) => {
        const count = row.original.permission_count
        return count !== undefined ? (
          <div className="flex items-center gap-1">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-mono">{count}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
      size: 100,
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
        const status = row.original.status
        return <StatusBadge status={status === 'ACTIVE' ? 'active' : 'disabled'} />
      },
      size: 100,
    },
    {
      accessorKey: 'tenant_id',
      header: 'Tenant',
      cell: ({ row }) => {
        const tenantId = row.getValue('tenant_id') as string | null
        return tenantId ? (
          <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
            {tenantId.slice(0, 8)}...
          </code>
        ) : (
          <span className="text-muted-foreground text-sm">Global</span>
        )
      },
      size: 120,
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
              <DropdownMenuItem onClick={() => setViewModal({ open: true, role: row.original })}>
                View Details
              </DropdownMenuItem>
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
      size: 80,
    },
  ]

  if (error) {
    return (
      <div className="p-10">
        <div>
          <h1 className="text-2xl font-semibold">Roles</h1>
          <p className="text-muted-foreground text-sm">Role Management / Roles</p>
        </div>
        <div className="mt-6 rounded-lg border bg-destructive/10 p-6 text-destructive">
          Failed to load roles: {(error as Error).message}
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
          Add Role
        </Button>
      </div>

      {/* Page Content */}
      <div className="flex flex-col">
        {/* Page Header */}
        <div className="px-10 py-4">
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-primary cursor-pointer hover:underline">Role Management</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Roles</span>
          </div>
          <h1 className="text-2xl font-semibold">Roles</h1>
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
              <span className="text-lg font-mono">{statusStats.inactive}</span>
              <StatusDot color="gray" label="Inactive" />
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
            data={roles}
            columns={columns}
            columnWidths={COLUMN_WIDTHS}
            isLoading={isLoading}
            isFetching={isFetching}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalItems={totalItems}
            onRowClick={(role) => setViewModal({ open: true, role })}
            getRowKey={(role) => role.id}
            emptyIcon={<Shield className="h-12 w-12 opacity-50" />}
            emptyTitle="No roles found"
            emptyDescription="Get started by creating your first role."
            onEmptyAction={() => setFormDialog({ open: true })}
            emptyActionLabel="Add Role"
          />
        </div>
      </div>

      {/* Dialogs */}
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
                refetch()
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
          setSelectedRows(new Set())
          
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

      {/* View Modal */}
      {viewModal.open && viewModal.role && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setViewModal({ open: false })}
        >
          <div
            className="bg-card rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <RoleViewModal role={viewModal.role} />
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
