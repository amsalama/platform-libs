import { useMemo } from 'react'
import { Users, Shield, Key, Building, Activity, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsers, useRoles, usePermissions, useTenants } from '@/hooks'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import type { AuditEventInfo } from '@/types/audit'
import { cn } from '@/lib/utils'

// Generate mock audit events for dashboard (replicates LogsPage pattern)
function generateMockEvents(): AuditEventInfo[] {
  const eventTypes = [
    { type: 'AUTH_LOGIN', action: 'login', resourceType: 'SESSION' },
    { type: 'AUTH_LOGOUT', action: 'logout', resourceType: 'SESSION' },
    { type: 'AUTH_FAILED', action: 'login_failed', resourceType: 'SESSION' },
    { type: 'USER_CREATED', action: 'create', resourceType: 'USER' },
    { type: 'USER_UPDATED', action: 'update', resourceType: 'USER' },
    { type: 'ROLE_ASSIGNED', action: 'assign', resourceType: 'ROLE' },
    { type: 'PERMISSION_GRANTED', action: 'grant', resourceType: 'PERMISSION' },
    { type: 'TENANT_CREATED', action: 'create', resourceType: 'TENANT' },
  ]

  const outcomes = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILURE', 'DENIED']
  const userNames = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Wilson', 'Sarah Brown']

  const events: AuditEventInfo[] = []
  const now = new Date()

  for (let i = 0; i < 5; i++) {
    const eventConfig = eventTypes[Math.floor(Math.random() * eventTypes.length)]!
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)]!
    const userName = userNames[Math.floor(Math.random() * userNames.length)]!
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000) // 30 min intervals

    events.push({
      event_id: crypto.randomUUID(),
      event_type: eventConfig.type,
      timestamp: timestamp.toISOString(),
      tenant_id: crypto.randomUUID(),
      principal_id: crypto.randomUUID(),
      resource_type: eventConfig.resourceType,
      resource_id: crypto.randomUUID(),
      action: eventConfig.action,
      outcome: outcome,
      details: { user_name: userName },
    })
  }

  return events
}

export default function AdminDashboard() {
  const { data: users, isLoading: usersLoading } = useUsers()
  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissions, isLoading: permissionsLoading } = usePermissions()
  const { data: tenants, isLoading: tenantsLoading } = useTenants()

  // Generate mock events (in production, this would come from useQueryAudit)
  const recentLogs = useMemo(() => generateMockEvents(), [])

  // Get event type badge color
  const getEventTypeColor = (eventType: string) => {
    if (eventType.startsWith('AUTH_')) return 'bg-blue-500/10 text-blue-500'
    if (eventType.startsWith('USER_')) return 'bg-purple-500/10 text-purple-500'
    if (eventType.startsWith('ROLE_') || eventType.startsWith('PERMISSION_')) return 'bg-orange-500/10 text-orange-500'
    if (eventType.startsWith('TENANT_')) return 'bg-cyan-500/10 text-cyan-500'
    return 'bg-gray-500/10 text-gray-500'
  }

  // Get outcome badge
  const getOutcomeBadge = (outcome: string) => {
    const config: Record<string, { className: string; label: string }> = {
      SUCCESS: { className: 'bg-green-500/10 text-green-500', label: 'Success' },
      FAILURE: { className: 'bg-red-500/10 text-red-500', label: 'Failed' },
      DENIED: { className: 'bg-yellow-500/10 text-yellow-500', label: 'Denied' },
    }
    return config[outcome] || { className: 'bg-gray-500/10 text-gray-500', label: outcome }
  }

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (usersLoading || rolesLoading || permissionsLoading || tenantsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform</p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Users',
      value: users?.length || 0,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Total Roles',
      value: roles?.length || 0,
      icon: Shield,
      color: 'text-purple-500',
    },
    {
      title: 'Total Permissions',
      value: permissions?.length || 0,
      icon: Key,
      color: 'text-green-500',
    },
    {
      title: 'Total Tenants',
      value: tenants?.length || 0,
      icon: Building,
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-6 container mx-auto px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin/users"
              className="flex items-center gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted"
            >
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Manage Users</div>
                <div className="text-sm text-muted-foreground">View and manage user accounts</div>
              </div>
            </Link>
            <Link
              to="/admin/roles"
              className="flex items-center gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted"
            >
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-medium">Manage Roles</div>
                <div className="text-sm text-muted-foreground">View and manage roles</div>
              </div>
            </Link>
            <Link
              to="/admin/permissions"
              className="flex items-center gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted"
            >
              <Key className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Manage Permissions</div>
                <div className="text-sm text-muted-foreground">View and manage permissions</div>
              </div>
            </Link>
            <Link
              to="/admin/tenants"
              className="flex items-center gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted"
            >
              <Building className="h-5 w-5 text-orange-500" />
              <div>
                <div className="font-medium">Manage Tenants</div>
                <div className="text-sm text-muted-foreground">View and manage tenants</div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link 
            to="/admin/audit" 
            className="inline-flex items-center gap-2 h-9 px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            View All Logs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.map((log) => {
              const userName = (log.details as Record<string, unknown>)?.user_name as string
              const outcomeBadge = getOutcomeBadge(log.outcome)
              return (
                <div
                  key={log.event_id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Activity className={cn('h-4 w-4', getEventTypeColor(log.event_type).replace('bg-', 'text-').split(' ')[1])} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {log.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {userName || 'System'} • {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-1 rounded font-medium', outcomeBadge.className)}>
                    {outcomeBadge.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
