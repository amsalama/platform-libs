import { memo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'
import { useTenants } from '@/hooks/useTenants'
import { Search, Bell, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function Header() {
  const { user, logout, isAuthenticated, hasAdminAccess } = useAuthStore()
  const { currentTenant, setCurrentTenant, clearCurrentTenant } = useTenantStore()
  const { data: tenants, error: tenantsError, isLoading: tenantsLoading } = useTenants()
  const navigate = useNavigate()

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

  // PLACEHOLDER: Notification count
  const notificationCount = 3

  return (
    <header className="h-20 bg-card border-b border-border flex items-center justify-between px-10">
      {/* Left side - Search and tenant selector */}
      <div className="flex items-center gap-4 flex-1">
        {/* Tenant Selector (for admins) */}
        {hasAdminAccess() && (
          <>
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
              <SelectTrigger className="w-[180px] bg-transparent border-none">
                <SelectValue placeholder={tenantsLoading ? 'Loading...' : 'All Tenants'} />
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

            <div className="w-px h-10 bg-border" />
          </>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="w-6 h-6" />
          <span className="text-lg">Search here...</span>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="w-px h-10 bg-border" />

        {/* Notifications */}
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="w-6 h-6" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="w-px h-10 bg-border" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 transition-colors">
            <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center shrink-0">
              <span className="text-primary font-semibold text-sm">
                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                 user.email?.substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{user.name || 'User'}</span>
              <span className="text-xs text-muted-foreground">
                {/* PLACEHOLDER: Role display */}
                Administrator
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default memo(Header)
