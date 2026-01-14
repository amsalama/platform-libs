import { memo, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'
import { useTenants } from '@/hooks/useTenants'
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings, LayoutDashboard, Users, Shield, Key, Building2 } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  requiredAdminAccess?: boolean
}

function Header() {
  const { user, logout, isAuthenticated, hasAdminAccess, hasRole } = useAuthStore()
  const { currentTenant, setCurrentTenant, clearCurrentTenant } = useTenantStore()
  const { data: tenants, error: tenantsError, isLoading: tenantsLoading } = useTenants()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const navItems: NavItem[] = useMemo(() => [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      requiredAdminAccess: true,
    },
    {
      label: 'Users',
      path: '/admin/users',
      icon: Users,
      roles: ['admin', 'super_admin'],
    },
    {
      label: 'Roles',
      path: '/admin/roles',
      icon: Shield,
      roles: ['admin', 'super_admin'],
    },
    {
      label: 'Permissions',
      path: '/admin/permissions',
      icon: Key,
      roles: ['admin', 'super_admin'],
    },
    {
      label: 'Tenants',
      path: '/admin/tenants',
      icon: Building2,
      roles: ['super_admin'],
    },
  ], [])

  const visibleNavItems = useMemo(() => navItems.filter(item => {
    if (item.requiredAdminAccess && !hasAdminAccess()) return false
    if (item.roles && !item.roles.some(role => hasRole(role))) return false
    return true
  }), [navItems, hasAdminAccess, hasRole])

  const isActivePath = (path: string) => {
    return location.pathname === path || (location.pathname.startsWith(`${path}/`) && path !== '/admin')
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-xl font-bold">
            CraftCrew
          </Link>
          
          {visibleNavItems.length > 0 && (
            <nav className="flex space-x-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActivePath(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {hasAdminAccess() && (
            <Select
              value={currentTenant?.id || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  clearCurrentTenant()
                } else {
                  const tenant = tenants?.find((t) => t.id === value)
                  if (tenant) setCurrentTenant(tenant)
                }
              }}
              disabled={tenantsLoading}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={tenantsLoading ? 'Loading...' : 'Select tenant'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenantsError ? (
                  <SelectItem value="error" disabled>
                    Failed to load tenants
                  </SelectItem>
                ) : tenants?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Link to="/settings">
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user.name || user.email}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default memo(Header)
