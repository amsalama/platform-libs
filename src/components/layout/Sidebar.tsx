import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'
import {
  Home,
  Activity,
  Users as UsersIcon,
  Shield,
  Key,
  BarChart3,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
  Building,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  hasSubmenu?: boolean
  roles?: string[]
  requiredAdminAccess?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { hasAdminAccess, hasRole } = useAuthStore()
  const { currentTenant } = useTenantStore()
  
  // Get tenant display info from store, fallback to "All Tenants" when none selected
  const tenant = {
    name: currentTenant?.name || 'All Tenants',
    initials: currentTenant?.name 
      ? currentTenant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'AT',
  }

  const menuSections: NavSection[] = [
    // {
    //   title: 'Menu',
    //   items: [
    //     // PLACEHOLDER: These menu items are from Figma but may not have routes yet
    //     { label: 'Home', path: '/dashboard', icon: Home },
    //     { label: 'Studies', path: '/studies', icon: Activity }, // PLACEHOLDER: Route not implemented
    //     { label: 'Patients', path: '/patients', icon: UserCircle, hasSubmenu: true }, // PLACEHOLDER: Route not implemented
    //     { label: 'Reports', path: '/reports', icon: BarChart3 }, // PLACEHOLDER: Route not implemented
    //   ],
    // },
    {
      title: 'Users Management',
      items: [
        { label: 'Users', path: '/admin/users', icon: UsersIcon, roles: ['admin', 'super_admin'] },
        { label: 'Tenants', path: '/admin/tenants', icon: Building, roles: ['admin', 'super_admin'] },
        { label: 'Roles', path: '/admin/roles', icon: Shield, roles: ['admin', 'super_admin'] },
        { label: 'Permissions', path: '/admin/permissions', icon: Key, roles: ['admin', 'super_admin'] },
        { label: 'Logs', path: '/admin/audit', icon: BarChart3, roles: ['admin', 'super_admin'] }, // PLACEHOLDER: Points to audit logs
      ],
    },
    {
      title: 'Others',
      items: [
        { label: 'Settings', path: '/settings', icon: Settings },
        // { label: 'Help', path: '/help', icon: HelpCircle }, // PLACEHOLDER: Route not implemented
      ],
    },
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path || 
      (location.pathname.startsWith(`${path}/`) && path !== '/dashboard')
  }

  const canViewItem = (item: NavItem) => {
    if (item.requiredAdminAccess && !hasAdminAccess()) return false
    if (item.roles && !item.roles.some(role => hasRole(role))) return false
    return true
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-[100px]' : 'w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center py-5 px-4">
        {collapsed ? (
          <div className="w-10 h-10 flex items-center justify-center">
            {/* Small logo for collapsed sidebar */}
            <img 
              src="/logo-no-text.svg" 
              alt="TELE GNOST" 
              width={35} 
              height={38} 
              className="h-10 w-auto" 
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Full logo with text for expanded sidebar */}
            <img 
              src="/logo-with-text.svg" 
              alt="TELE GNOST" 
              width={196} 
              height={38} 
              className="h-10 w-auto" 
            />
          </div>
        )}
      </div>

      {/* Tenant Selector */}
      <div className={cn(
        'flex items-center gap-2 py-4 mx-4 border-b border-sidebar-border',
        collapsed ? 'justify-center' : 'justify-start'
      )}>
        <div className="w-11 h-11 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center shrink-0">
          <span className="text-primary font-semibold">{tenant.initials}</span>
        </div>
        {!collapsed && (
          <span className="text-sidebar-foreground font-semibold text-lg truncate flex-1">
            {tenant.name}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-4">
        {menuSections.map((section, sectionIndex) => {
          const visibleItems = section.items.filter(canViewItem)
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title} className={cn(sectionIndex > 0 && 'mt-4 pt-4 border-t border-sidebar-border')}>
              {!collapsed && (
                <span className="text-xs text-sidebar-muted uppercase tracking-wide px-4 mb-2 block">
                  {section.title}
                </span>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isActivePath(item.path)

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-lg transition-colors',
                        collapsed ? 'justify-center p-4' : 'px-4 py-3',
                        isActive
                          ? 'bg-sidebar-accent text-white'
                          : 'text-sidebar-foreground hover:bg-sidebar-border/50'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-base">{item.label}</span>
                          {item.hasSubmenu && (
                            <ChevronDown className="w-4 h-4 shrink-0" />
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg p-3 transition-colors',
            'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-border/50',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
