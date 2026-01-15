import { useState, useMemo } from 'react'
import { Plus, MoreHorizontal, Edit, Trash2, Shield, ChevronDown, RefreshCw, Users } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { StatusBadge, MFABadge, StatusDot, type UserStatus } from '@/components/shared/StatusBadge'
import { AdminDataTable } from '@/components/shared/AdminDataTable'
import { UserFormDialog } from '../components/UserFormDialog'
import { UserViewModal } from '../components/UserViewModal'
import { UserRolesDialog } from '../components/UserRolesDialog'
import { useUsersPaginated, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useTenants } from '@/hooks/useTenants'
import type { UserResponse, UserCreate } from '@/types/user'
import { cn } from '@/lib/utils'

// PLACEHOLDER: Role filter tabs from Figma design
type RoleTab = 'all' | 'administrator' | 'radiologists' | 'technologists' | 'physician'

const ROLE_TABS: { value: RoleTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'radiologists', label: 'Radiologists' },
  { value: 'technologists', label: 'Technologists' },
  { value: 'physician', label: 'Physician' },
]

// PLACEHOLDER: Map user status - in real app, this would come from backend
function getUserStatus(user: UserResponse): UserStatus {
  if (user.principal_id.startsWith('locked')) return 'locked'
  if (user.principal_id.startsWith('disabled')) return 'disabled'
  const hash = user.principal_id.charCodeAt(0) % 10
  if (hash < 2) return 'disabled'
  if (hash < 3) return 'locked'
  return 'active'
}

// PLACEHOLDER: Check if MFA is enabled
function isMFAEnabled(user: UserResponse): boolean {
  return user.principal_id.charCodeAt(0) % 2 === 0
}

// Column width configuration
const COLUMN_WIDTHS = {
  select: '48px',
  name: '160px',
  email: '280px',
  role: '120px',
  tenant: '120px',
  status: '100px',
  mfa: '100px',
  lastLogin: '180px',
  actions: '80px',
}

export default function UsersPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [activeTab, setActiveTab] = useState<RoleTab>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tenantFilter, setTenantFilter] = useState<string>('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const { data: paginatedData, isLoading, error, refetch, isFetching } = useUsersPaginated({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  })
  const { data: roles } = useRoles()
  const { data: tenants } = useTenants()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId?: string }>({ open: false })
  const [formDialog, setFormDialog] = useState<{ open: boolean; user?: UserResponse }>({ open: false })
  const [rolesDialog, setRolesDialog] = useState<{ open: boolean; user?: UserResponse }>({ open: false })
  const [viewModal, setViewModal] = useState<{ open: boolean; user?: UserResponse }>({ open: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{ open: boolean; userIds?: string[] }>({ open: false })
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const users = paginatedData?.items || []
  const totalItems = paginatedData?.total || 0

  // PLACEHOLDER: Status statistics
  const statusStats = useMemo(() => {
    return {
      active: 2157,
      inactive: 1020,
      locked: 279,
    }
  }, [])

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
    if (selectedRows.size === users.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(users.map(u => u.principal_id)))
    }
  }

  // Table columns
  const columns: ColumnDef<UserResponse>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={users.length > 0 && selectedRows.size === users.length}
          onCheckedChange={toggleAllRows}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.has(row.original.principal_id)}
          onCheckedChange={() => toggleRowSelection(row.original.principal_id)}
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
          <span>User Name</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-medium capitalize truncate block max-w-[140px]">
          {row.original.name || row.original.email?.split('@')[0] || 'Unknown User'}
        </span>
      ),
      size: 160,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-foreground truncate block max-w-[260px]">{row.getValue('email') || 'N/A'}</span>
      ),
      size: 280,
    },
    {
      accessorKey: 'role',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Role</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <span className="capitalize truncate block max-w-[100px]">
          {row.original.name?.includes('Admin') ? 'Administrator' : 'Radiologist'}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'tenant',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Tenant</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: () => (
        <span className="truncate block max-w-[100px]">Tenant Name</span>
      ),
      size: 120,
    },
    {
      id: 'status',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Status</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const status = getUserStatus(row.original)
        return <StatusBadge status={status} />
      },
      size: 100,
    },
    {
      id: 'mfa',
      header: () => (
        <div className="flex items-center gap-1">
          <span>MFA</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const enabled = isMFAEnabled(row.original)
        return <MFABadge enabled={enabled} />
      },
      size: 100,
    },
    {
      accessorKey: 'last_seen_at',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Last Login</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const lastSeen = row.getValue('last_seen_at') as string | null
        if (!lastSeen) return <span className="text-muted-foreground font-mono text-sm">Never</span>
        const date = new Date(lastSeen)
        return (
          <span className="font-mono text-sm uppercase whitespace-nowrap">
            {date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        )
      },
      size: 180,
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
              <DropdownMenuItem onClick={() => setViewModal({ open: true, user: row.original })}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFormDialog({ open: true, user: row.original })}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRolesDialog({ open: true, user: row.original })}>
                <Shield className="mr-2 h-4 w-4" />
                Manage Roles
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
      size: 96,
    },
  ]

  if (error) {
    return (
      <div className="p-10">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground text-sm">Users Management / Users</p>
        </div>
        <div className="mt-6 rounded-lg border bg-destructive/10 p-6 text-destructive">
          Failed to load users: {(error as Error).message}
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
          Add User
        </Button>
      </div>

      {/* Page Content */}
      <div className="flex flex-col">
        {/* Page Header */}
        <div className="px-10 py-4">
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-primary cursor-pointer hover:underline">Users Management</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Users</span>
          </div>
          <h1 className="text-2xl font-semibold">Users</h1>
        </div>

        {/* Tab Bar */}
        <div className="px-10 py-4 relative">
          <div className="flex items-end gap-4">
            {ROLE_TABS.map((tab) => (
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

        {/* Filters and Statistics */}
        <div className="px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-secondary border-border">
                <SelectValue placeholder="Status: all" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: all</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-[140px] bg-secondary border-border">
                <SelectValue placeholder="Tenant: all" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tenant: all</SelectItem>
                {tenants?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.active.toLocaleString()}</span>
              <StatusDot color="green" label="Active" />
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.inactive.toLocaleString()}</span>
              <StatusDot color="gray" label="Inactive" />
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.locked.toLocaleString()}</span>
              <StatusDot color="red" label="Locked" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-10 py-4">
          <AdminDataTable
            data={users}
            columns={columns}
            columnWidths={COLUMN_WIDTHS}
            isLoading={isLoading}
            isFetching={isFetching}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalItems={totalItems}
            onRowClick={(user) => setViewModal({ open: true, user })}
            getRowKey={(user) => user.principal_id}
            emptyIcon={<Users className="h-12 w-12 opacity-50" />}
            emptyTitle="No users found"
            emptyDescription="Get started by adding your first user."
            onEmptyAction={() => setFormDialog({ open: true })}
            emptyActionLabel="Add User"
          />
        </div>
      </div>

      {/* Dialogs */}
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
          setSelectedRows(new Set())
          
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

      {/* View Modal */}
      {viewModal.open && viewModal.user && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setViewModal({ open: false })}
        >
          <div
            className="bg-card rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <UserViewModal user={viewModal.user} />
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
