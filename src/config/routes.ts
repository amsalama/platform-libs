/**
 * Route Path Constants
 *
 * Centralized route path definitions to avoid hardcoded strings.
 */

export const ROUTES = {
  LOGIN: '/login',
  CALLBACK: '/callback',
  SSO: '/sso',
  LOGOUT: '/logout',

  PROFILE: '/profile',
  SETTINGS: '/settings',

  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_PERMISSIONS: '/admin/permissions',
  ADMIN_TENANTS: '/admin/tenants',
} as const

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]
