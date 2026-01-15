import { useState, useMemo } from 'react'
import { FileText, ChevronDown, RefreshCw, Eye, Download, Filter, Calendar, User, Shield, Activity } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusDot } from '@/components/shared/StatusBadge'
import { AdminDataTable } from '@/components/shared/AdminDataTable'
import type { AuditEventInfo } from '@/types/audit'
import { cn } from '@/lib/utils'

// Status tab filter
type EventTab = 'all' | 'auth' | 'user' | 'role' | 'tenant' | 'api'

const EVENT_TABS: { value: EventTab; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'auth', label: 'Authentication' },
  { value: 'user', label: 'User Management' },
  { value: 'role', label: 'Role & Permissions' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'api', label: 'API Access' },
]

// Generate mock data
function generateMockEvents(): AuditEventInfo[] {
  const eventTypes = [
    { type: 'AUTH_LOGIN', action: 'login', resourceType: 'SESSION', category: 'auth' },
    { type: 'AUTH_LOGOUT', action: 'logout', resourceType: 'SESSION', category: 'auth' },
    { type: 'AUTH_FAILED', action: 'login_failed', resourceType: 'SESSION', category: 'auth' },
    { type: 'AUTH_MFA_VERIFIED', action: 'mfa_verify', resourceType: 'SESSION', category: 'auth' },
    { type: 'USER_CREATED', action: 'create', resourceType: 'USER', category: 'user' },
    { type: 'USER_UPDATED', action: 'update', resourceType: 'USER', category: 'user' },
    { type: 'USER_DELETED', action: 'delete', resourceType: 'USER', category: 'user' },
    { type: 'ROLE_ASSIGNED', action: 'assign', resourceType: 'ROLE', category: 'role' },
    { type: 'ROLE_REVOKED', action: 'revoke', resourceType: 'ROLE', category: 'role' },
    { type: 'PERMISSION_GRANTED', action: 'grant', resourceType: 'PERMISSION', category: 'role' },
    { type: 'PERMISSION_REVOKED', action: 'revoke', resourceType: 'PERMISSION', category: 'role' },
    { type: 'TENANT_CREATED', action: 'create', resourceType: 'TENANT', category: 'tenant' },
    { type: 'TENANT_UPDATED', action: 'update', resourceType: 'TENANT', category: 'tenant' },
    { type: 'TENANT_SUSPENDED', action: 'suspend', resourceType: 'TENANT', category: 'tenant' },
    { type: 'PASSWORD_CHANGED', action: 'change_password', resourceType: 'USER', category: 'user' },
    { type: 'SESSION_EXPIRED', action: 'expire', resourceType: 'SESSION', category: 'auth' },
    { type: 'API_ACCESS', action: 'access', resourceType: 'API', category: 'api' },
    { type: 'SETTINGS_CHANGED', action: 'update', resourceType: 'SETTINGS', category: 'user' },
    { type: 'EXPORT_DATA', action: 'export', resourceType: 'DATA', category: 'api' },
  ]

  const outcomes = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILURE', 'DENIED'] // weighted toward success
  const tenantIds = [
    '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    'f9e8d7c6-b5a4-3210-fedc-ba0987654321',
  ]
  const principalIds = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777',
    '88888888-8888-8888-8888-888888888888',
  ]
  const userNames = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Wilson', 'Sarah Brown', 'David Lee', 'Lisa Anderson']
  const ipAddresses = ['192.168.1.100', '10.0.0.55', '172.16.0.22', '203.0.113.45', '198.51.100.12']
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Safari/604.1',
  ]

  const events: AuditEventInfo[] = []
  const now = new Date()

  for (let i = 0; i < 75; i++) {
    const eventConfig = eventTypes[Math.floor(Math.random() * eventTypes.length)]!
    const principalIndex = Math.floor(Math.random() * principalIds.length)
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)]!
    const tenantId = tenantIds[Math.floor(Math.random() * tenantIds.length)]!
    const principalId = principalIds[principalIndex]!
    const userName = userNames[principalIndex]!
    const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)]!
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)]!
    
    // Generate timestamp within last 7 days
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    
    const event: AuditEventInfo = {
      event_id: crypto.randomUUID(),
      event_type: eventConfig.type,
      timestamp: timestamp.toISOString(),
      tenant_id: tenantId,
      principal_id: principalId,
      resource_type: eventConfig.resourceType,
      resource_id: crypto.randomUUID(),
      action: eventConfig.action,
      outcome: outcome,
      details: {
        user_name: userName,
        ip_address: ipAddress,
        user_agent: userAgent,
        category: eventConfig.category,
        ...(outcome === 'FAILURE' && { error_message: 'Authentication failed: Invalid credentials' }),
        ...(outcome === 'DENIED' && { reason: 'Insufficient permissions' }),
        ...(eventConfig.type === 'API_ACCESS' && { endpoint: '/api/v1/users', method: 'GET', status_code: outcome === 'SUCCESS' ? 200 : 403 }),
      },
    }
    events.push(event)
  }

  // Sort by timestamp descending (most recent first)
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Column width configuration
const COLUMN_WIDTHS = {
  timestamp: '180px',
  eventType: '180px',
  user: '160px',
  resourceType: '120px',
  action: '140px',
  outcome: '100px',
  ipAddress: '140px',
  actions: '80px',
}

// Mock data - generated once
const MOCK_EVENTS = generateMockEvents()

export default function LogsPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [activeTab, setActiveTab] = useState<EventTab>('all')
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all')
  const [isLoading] = useState(false)
  const [viewModal, setViewModal] = useState<{ open: boolean; event?: AuditEventInfo }>({ open: false })

  // Filter events based on tab and outcome
  const filteredEvents = useMemo(() => {
    let events = MOCK_EVENTS

    // Filter by tab
    if (activeTab !== 'all') {
      const categoryMap: Record<EventTab, string[]> = {
        all: [],
        auth: ['AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_FAILED', 'AUTH_MFA_VERIFIED', 'SESSION_EXPIRED'],
        user: ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'PASSWORD_CHANGED', 'SETTINGS_CHANGED'],
        role: ['ROLE_ASSIGNED', 'ROLE_REVOKED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED'],
        tenant: ['TENANT_CREATED', 'TENANT_UPDATED', 'TENANT_SUSPENDED'],
        api: ['API_ACCESS', 'EXPORT_DATA'],
      }
      events = events.filter(e => categoryMap[activeTab].includes(e.event_type))
    }

    // Filter by outcome
    if (outcomeFilter !== 'all') {
      events = events.filter(e => e.outcome === outcomeFilter)
    }

    return events
  }, [activeTab, outcomeFilter])

  // Paginate
  const paginatedEvents = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return filteredEvents.slice(start, start + pagination.pageSize)
  }, [filteredEvents, pagination])

  // Status statistics
  const statusStats = useMemo(() => {
    return {
      success: MOCK_EVENTS.filter(e => e.outcome === 'SUCCESS').length,
      failure: MOCK_EVENTS.filter(e => e.outcome === 'FAILURE').length,
      denied: MOCK_EVENTS.filter(e => e.outcome === 'DENIED').length,
    }
  }, [])

  // Get event type badge color
  const getEventTypeColor = (eventType: string) => {
    if (eventType.startsWith('AUTH_')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    if (eventType.startsWith('USER_')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    if (eventType.startsWith('ROLE_') || eventType.startsWith('PERMISSION_')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    if (eventType.startsWith('TENANT_')) return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    if (eventType.startsWith('API_') || eventType === 'EXPORT_DATA') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }

  // Get outcome badge
  const getOutcomeBadge = (outcome: string) => {
    const config: Record<string, { className: string; label: string }> = {
      SUCCESS: { className: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Success' },
      FAILURE: { className: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Failed' },
      DENIED: { className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Denied' },
      PENDING: { className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Pending' },
    }
    return config[outcome] || { className: 'bg-gray-500/10 text-gray-500 border-gray-500/20', label: outcome }
  }

  // Table columns
  const columns: ColumnDef<AuditEventInfo>[] = [
    {
      accessorKey: 'timestamp',
      header: () => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Timestamp</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('timestamp'))
        return (
          <span className="font-mono text-sm whitespace-nowrap">
            {date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            {' '}
            <span className="text-muted-foreground">
              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </span>
        )
      },
      size: 180,
    },
    {
      accessorKey: 'event_type',
      header: () => (
        <div className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Event Type</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const eventType = row.getValue('event_type') as string
        return (
          <span className={cn('text-xs px-2 py-1 rounded border font-medium', getEventTypeColor(eventType))}>
            {eventType.replace(/_/g, ' ')}
          </span>
        )
      },
      size: 180,
    },
    {
      accessorKey: 'principal_id',
      header: () => (
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span>User</span>
        </div>
      ),
      cell: ({ row }) => {
        const details = row.original.details as Record<string, unknown>
        const userName = details?.user_name as string
        return (
          <div className="flex flex-col">
            <span className="font-medium truncate max-w-[140px]">{userName || 'System'}</span>
            <code className="text-xs text-muted-foreground">
              {(row.getValue('principal_id') as string)?.slice(0, 8)}...
            </code>
          </div>
        )
      },
      size: 160,
    },
    {
      accessorKey: 'resource_type',
      header: () => (
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Resource</span>
        </div>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs font-mono">
          {row.getValue('resource_type')}
        </Badge>
      ),
      size: 120,
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span className="text-sm capitalize">{(row.getValue('action') as string).replace(/_/g, ' ')}</span>
      ),
      size: 140,
    },
    {
      accessorKey: 'outcome',
      header: () => (
        <div className="flex items-center gap-1">
          <span>Outcome</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => {
        const outcome = row.getValue('outcome') as string
        const badge = getOutcomeBadge(outcome)
        return (
          <span className={cn('text-xs px-2 py-1 rounded border font-medium', badge.className)}>
            {badge.label}
          </span>
        )
      },
      size: 100,
    },
    {
      id: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => {
        const details = row.original.details as Record<string, unknown>
        const ip = details?.ip_address as string
        return ip ? (
          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{ip}</code>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
      size: 140,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
                <span className="sr-only">View details</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewModal({ open: true, event: row.original })}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.event_id)}>
                <FileText className="mr-2 h-4 w-4" />
                Copy Event ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      size: 80,
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Action Buttons - Top Right */}
      <div className="absolute top-[105px] right-10 flex items-center gap-4">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-12 w-12 bg-accent hover:bg-accent/90"
          onClick={() => {/* Would refresh from API */}}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
        <Button 
          variant="outline"
          className="h-12 px-6 gap-2"
        >
          <Download className="h-5 w-5" />
          Export Logs
        </Button>
      </div>

      {/* Page Content */}
      <div className="flex flex-col">
        {/* Page Header */}
        <div className="px-10 py-4">
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-primary cursor-pointer hover:underline">Audit & Monitoring</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Logs</span>
          </div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
        </div>

        {/* Tab Bar */}
        <div className="px-10 py-4 relative">
          <div className="flex items-end gap-4">
            {EVENT_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value)
                  setPagination({ ...pagination, pageIndex: 0 })
                }}
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
          {/* Filter Dropdowns */}
          <div className="flex items-center gap-4">
            <Select value={outcomeFilter} onValueChange={(value) => {
              setOutcomeFilter(value)
              setPagination({ ...pagination, pageIndex: 0 })
            }}>
              <SelectTrigger className="w-[160px] bg-secondary border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Outcome: all" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Outcome: all</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILURE">Failed</SelectItem>
                <SelectItem value="DENIED">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Statistics */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.success}</span>
              <StatusDot color="green" label="Success" />
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.failure}</span>
              <StatusDot color="red" label="Failed" />
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-mono">{statusStats.denied}</span>
              <StatusDot color="yellow" label="Denied" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-10 py-4">
          <AdminDataTable
            data={paginatedEvents}
            columns={columns}
            columnWidths={COLUMN_WIDTHS}
            isLoading={isLoading}
            isFetching={false}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalItems={filteredEvents.length}
            onRowClick={(event) => setViewModal({ open: true, event })}
            getRowKey={(event) => event.event_id}
            emptyIcon={<FileText className="h-12 w-12 opacity-50" />}
            emptyTitle="No logs found"
            emptyDescription="No audit events match your current filters."
          />
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.event && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setViewModal({ open: false })}
        >
          <div
            className="bg-card rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Event ID</label>
                  <code className="block text-sm bg-muted p-2 rounded mt-1 break-all">{viewModal.event.event_id}</code>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Timestamp</label>
                  <p className="text-sm mt-1 font-mono">{new Date(viewModal.event.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Event Type</label>
                  <p className="mt-1">
                    <span className={cn('text-xs px-2 py-1 rounded border font-medium', getEventTypeColor(viewModal.event.event_type))}>
                      {viewModal.event.event_type.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Outcome</label>
                  <p className="mt-1">
                    <span className={cn('text-xs px-2 py-1 rounded border font-medium', getOutcomeBadge(viewModal.event.outcome).className)}>
                      {getOutcomeBadge(viewModal.event.outcome).label}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Resource Type</label>
                  <p className="text-sm mt-1">{viewModal.event.resource_type}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Action</label>
                  <p className="text-sm mt-1 capitalize">{viewModal.event.action.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Principal ID</label>
                  <code className="block text-sm bg-muted p-2 rounded mt-1 break-all">{viewModal.event.principal_id}</code>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tenant ID</label>
                  <code className="block text-sm bg-muted p-2 rounded mt-1 break-all">{viewModal.event.tenant_id}</code>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Resource ID</label>
                <code className="block text-sm bg-muted p-2 rounded mt-1 break-all">{viewModal.event.resource_id}</code>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Details</label>
                <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(viewModal.event.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(JSON.stringify(viewModal.event, null, 2))}>
                Copy JSON
              </Button>
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
