import { Users, Shield, Key, Building, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsers, useRoles, usePermissions, useTenants } from '@/hooks'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'

export default function AdminDashboard() {
  const { data: users, isLoading: usersLoading } = useUsers()
  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissions, isLoading: permissionsLoading } = usePermissions()
  const { data: tenants, isLoading: tenantsLoading } = useTenants()

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
    <div className="space-y-6">
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
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="mx-auto mb-2 h-12 w-12" />
            <p>Activity tracking coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
