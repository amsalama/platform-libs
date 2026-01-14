# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CraftCrew Authentication Framework v2 - a production-grade React/TypeScript authentication frontend with:
- Backend-first authentication (email/password to API, not direct IdP OAuth)
- Cross-domain Single Sign-On (SSO) capabilities
- Multi-tenant user management
- Role-Based Access Control (RBAC) admin panel

**Stack**: React 19 + TypeScript + Zustand + shadcn/ui + Radix UI + Vite + Tailwind CSS + Vitest

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (localhost:3000)

# Build & Check
npm run build            # TypeScript check + Vite production build
npm run type-check       # TypeScript only (no emit)
npm run lint             # ESLint (strict: 0 warnings)
npm run preview          # Preview production build

# Testing
npm run test             # Run Vitest
npm run test:coverage    # Run with coverage

# Docker
docker-compose up        # Development containers
docker build -t craftcrew-auth . && docker run -p 80:80 craftcrew-auth
```

## Project Structure

```
craft-crew-auth-v2/
├── src/
│   ├── app/                    # App entry, routing
│   │   ├── App.tsx             # Main app with providers
│   │   ├── routes.tsx          # Route definitions
│   │   └── main.tsx            # Vite entry point
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (button, card, dialog, etc.)
│   │   ├── layout/             # Layout components
│   │   │   ├── AppLayout.tsx       # Authenticated user layout
│   │   │   ├── AdminLayout.tsx     # Admin panel layout with sidebar
│   │   │   ├── AuthLayout.tsx      # Public auth pages layout
│   │   │   ├── Header.tsx          # Top header with user menu
│   │   │   └── ThemeToggle.tsx     # Dark/light/system toggle
│   │   ├── auth/               # Auth-specific components
│   │   │   ├── ProtectedRoute.tsx  # Auth guard HOC
│   │   │   └── AdminRoute.tsx      # Admin role guard HOC
│   │   └── shared/             # Shared components
│   │       ├── DataTable.tsx       # Generic data table (TanStack Table)
│   │       ├── EmptyState.tsx      # Empty state with actions
│   │       ├── LoadingSkeleton.tsx # Loading skeleton
│   │       └── ConfirmDialog.tsx   # Confirmation dialog
│   │
│   ├── features/               # Feature modules
│   │   ├── profile/            # User profile feature
│   │   │   └── pages/ProfilePage.tsx
│   │   ├── settings/           # User settings feature
│   │   │   └── pages/SettingsPage.tsx
│   │   └── admin/              # Admin panel feature
│   │       ├── pages/
│   │       │   ├── AdminDashboard.tsx  # Dashboard with stats
│   │       │   ├── UsersPage.tsx       # User management
│   │       │   ├── RolesPage.tsx       # Role management
│   │       │   ├── PermissionsPage.tsx # Permission management
│   │       │   └── TenantsPage.tsx     # Tenant management
│   │
│   ├── stores/                 # Zustand stores
│   │   ├── authStore.ts        # Auth state, tokens, permissions
│   │   ├── themeStore.ts       # Theme preferences (persisted)
│   │   └── uiStore.ts          # UI state (modals, sidebar)
│   │
│   ├── services/               # API services
│   │   ├── api/                # Real API clients
│   │   │   ├── client.ts           # Base API client (Axios)
│   │   │   ├── auth.ts             # Auth endpoints (login, register, etc.)
│   │   │   ├── users.ts            # Users admin API
│   │   │   ├── roles.ts            # Roles admin API
│   │   │   ├── permissions.ts      # Permissions admin API
│   │   │   ├── tenants.ts          # Tenants admin API
│   │   │   ├── authz.ts            # Authorization checks
│   │   │   └── profile.ts          # Current user profile
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useUsers.ts         # Users CRUD with React Query
│   │   ├── useRoles.ts         # Roles CRUD
│   │   ├── usePermissions.ts   # Permissions hooks
│   │   ├── useTenants.ts       # Tenants hooks
│   │   ├── useAuthz.ts         # Authorization checks
│   │   └── useProfile.ts       # Current user profile
│   │
│   ├── types/                  # TypeScript definitions
│   │   ├── auth.ts             # Principal, Token types
│   │   ├── user.ts             # User, UserRole types
│   │   ├── role.ts             # Role, Permission types
│   │   └── tenant.ts           # Tenant, Entitlement types
│   │
│   ├── lib/                    # Utilities
│   │   ├── utils.ts            # cn() and common utils
│   │   ├── token.ts            # JWT utilities
│   │   ├── validators.ts       # Zod schemas
│   │   └── formatters.ts       # Date, string formatters
│   │
│   └── config/                 # Configuration
│       ├── env.ts              # Environment variables
│       └── routes.ts           # Route path constants
│
└── [config files]              # vite.config.ts, tsconfig.json, etc.
```

## Architecture

### Provider Hierarchy
```
BrowserRouter > ThemeProvider > QueryClientProvider > App > Routes
```

### Routes

| Route | Layout | Protection | Component |
|-------|--------|------------|-----------|
| `/login` | AuthLayout | Public | LoginPage |
| `/callback` | AuthLayout | Public | CallbackPage |
| `/sso` | AuthLayout | Public | SSORedirectPage |
| `/profile` | AppLayout | ProtectedRoute | ProfilePage |
| `/settings` | AppLayout | ProtectedRoute | SettingsPage |
| `/admin` | AdminLayout | AdminRoute | AdminDashboard |
| `/admin/users` | AdminLayout | AdminRoute | UsersPage |
| `/admin/roles` | AdminLayout | AdminRoute | RolesPage |
| `/admin/permissions` | AdminLayout | AdminRoute | PermissionsPage |
| `/admin/tenants` | AdminLayout | AdminRoute | TenantsPage |

### Zustand Auth Store

Key state and methods:
```typescript
interface AuthState {
  principal: Principal | null;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, display_name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;

  // Permission utilities
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAdminAccess: () => boolean;
}
```

### Authorization Model

**Precedence (fail-closed)**: ACL DENY > ACL ALLOW > RBAC > DENY

Permission utilities in `src/lib/permissions.ts`:
- `hasRole(principal, role)` - Exact role check
- `hasAnyRole(principal, roles)` - Any role match
- `hasAdminAccess(principal)` - Admin role check
- `canManageUsers(principal)` - User management permission
- `canManageRoles(principal)` - Role management permission
- `canManageTenants(principal)` - Tenant management permission

### Authentication Flow

**IMPORTANT**: The frontend does NOT directly communicate with IdPs (Keycloak, Zitadel, etc.). All authentication is handled through backend API endpoints. The backend manages IdP integration.

1. User enters email/password on `/login`
2. Frontend calls `POST /api/v1/auth/login` with credentials
3. Backend validates credentials (may query IdP) and returns tokens (access_token, refresh_token, id_token)
4. Tokens are stored in sessionStorage
5. User is redirected to authenticated pages

### Token Storage

- **sessionStorage** (not localStorage for security)
- Keys: `craftcrew_access_token`, `craftcrew_refresh_token`, `craftcrew_id_token`, `token_expiry`

## Key Types

### AuthenticatedPrincipal

```typescript
interface AuthenticatedPrincipal {
  principal_id: string;           // Platform-generated UUID (internal only)
  actor_type: 'USER' | 'SERVICE' | 'API_KEY' | 'SYSTEM';
  authentication_method: 'PASSWORD' | 'SSO' | 'MFA' | 'CLIENT_CREDENTIALS' | 'API_KEY' | 'REFRESH_TOKEN' | 'IMPERSONATION' | 'SYSTEM_INTERNAL';
  auth_source?: AuthSource;
  authentication_time: string; // ISO 8601 timestamp
  token_expiry?: string; // ISO 8601 timestamp (absent for API_KEY/SYSTEM)
  email?: string;
  email_verified?: boolean;
  display_name?: string;
  roles?: string[];
  scopes?: string[];
  tenant_hints?: TenantHints;
  custom_claims?: CustomClaims;
  operation_id?: string; // Required for SYSTEM
  api_key_id?: string; // Required for API_KEY
  impersonation?: ImpersonationContext;
}
```

### User

```typescript
interface UserResponse {
  id: string;
  principal_id: string;
  email: string | null;
  display_name: string | null;
  idp_issuer: string;
  idp_subject: string;
  created_at: string;
  last_seen_at: string | null;
}
```

### Tenant

```typescript
interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED';
  entitlements: TenantEntitlements;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}
```

## Environment Configuration

Environment variables (prefix: `VITE_`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_EXTERNAL_AUTH_ENABLED=true
VITE_EXTERNAL_AUTH_RESPONSE_MODE=code
VITE_ALLOWED_REDIRECT_DOMAINS=app.craftcrew.com,admin.craftcrew.com
VITE_SSO_SESSION_TIMEOUT=1800
VITE_SSO_MAX_CONCURRENT=5
VITE_ENABLE_MOCK_API=false
```

Config loader: `src/config/env.ts`

## UI Components

Built on shadcn/ui + Radix UI primitives with Tailwind CSS.

**Component library**: `src/components/ui/`
- Uses class-variance-authority (cva) for variants
- Uses clsx + tailwind-merge via `cn()` utility

**Shared Components**: `src/components/shared/`
- `DataTable.tsx` - Reusable data table with TanStack Table
- `EmptyState.tsx` - Empty state with optional actions
- `LoadingSkeleton.tsx` - Loading skeleton
- `ConfirmDialog.tsx` - Confirmation dialog

**Design Tokens**:
- Colors: CSS variables in `globals.css`
- Typography: Inter (body), JetBrains Mono (code)
- Spacing: 4px base scale

**Accessibility**: WCAG 2.1 AA target
- Keyboard navigation
- Focus management
- ARIA labels
- Color contrast compliance

## Admin Panel

### Dashboard (`/admin`)

Statistics cards and quick actions for:
- Total Users
- Total Roles
- Total Permissions
- Total Tenants

### User Management (`/admin/users`)

Features:
- List users with pagination
- Search/filter by email
- View user details
- Assign/remove roles
- Delete users

### Role Management (`/admin/roles`)

Features:
- List roles with system badge
- Create/edit/delete roles
- Manage role permissions
- View user assignments
- System roles protected from deletion

### Permission Management (`/admin/permissions`)

Features:
- List permissions by resource
- Create/delete permissions
- Grouped by resource type

### Tenant Management (`/admin/tenants`)

Features:
- List tenants with status badges
- Create/update/delete tenants
- Suspend/activate tenants
- View tenant entitlements

## API Endpoints (Backend)

### Authentication
- `POST /api/v1/auth/login` - Email/password login
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/introspect` - Validate token
- `GET /api/v1/auth/userinfo` - Get IdP user profile
- `GET /api/v1/auth/me` - Get current authenticated user

### Authorization
- `POST /api/v1/authz/check` - Check authorization
- `POST /api/v1/authz/check/bulk` - Bulk check
- `GET /api/v1/authz/me/permissions` - Get my permissions

### User Management
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{principal_id}` - Get user
- `GET /api/v1/users/{principal_id}/roles` - Get user roles

### Role Management
- `GET /api/v1/roles` - List roles
- `POST /api/v1/roles` - Create role
- `GET /api/v1/roles/{role_id}` - Get role
- `PATCH /api/v1/roles/{role_id}` - Update role
- `DELETE /api/v1/roles/{role_id}` - Delete role
- `POST /api/v1/roles/{role_id}/assignments` - Assign to user
- `DELETE /api/v1/roles/{role_id}/assignments/{principal_id}` - Revoke from user
- `GET /api/v1/roles/{role_id}/permissions` - Get role permissions
- `POST /api/v1/roles/{role_id}/permissions` - Grant permission
- `DELETE /api/v1/roles/{role_id}/permissions/{permission_id}` - Revoke permission

### Permission Management
- `GET /api/v1/permissions` - List permissions
- `POST /api/v1/permissions` - Create permission
- `GET /api/v1/permissions/{permission_id}` - Get permission
- `DELETE /api/v1/permissions/{permission_id}` - Delete permission

### Tenant Management
- `GET /api/v1/tenants` - List tenants
- `POST /api/v1/tenants` - Create tenant
- `GET /api/v1/tenants/{tenant_id}` - Get tenant
- `PATCH /api/v1/tenants/{tenant_id}` - Update tenant
- `DELETE /api/v1/tenants/{tenant_id}` - Delete tenant
- `POST /api/v1/tenants/{tenant_id}/suspend` - Suspend tenant
- `POST /api/v1/tenants/{tenant_id}/activate` - Activate tenant

## Critical Files

| File | Purpose |
|------|---------|
| `src/stores/authStore.ts` | Authentication state, token management |
| `src/services/api/client.ts` | API client with auth headers, 401 refresh |
| `src/services/api/auth.ts` | Auth endpoints |
| `src/services/api/users.ts` | Users admin API |
| `src/services/api/roles.ts` | Roles admin API |
| `src/services/api/permissions.ts` | Permissions admin API |
| `src/services/api/tenants.ts` | Tenants admin API |
| `src/types/auth.ts` | AuthenticatedPrincipal, Token types |
| `src/types/user.ts` | User types |
| `src/types/role.ts` | Role, Permission types |
| `src/types/tenant.ts` | Tenant types |
| `src/components/auth/ProtectedRoute.tsx` | Route protection HOC |
| `src/components/shared/DataTable.tsx` | Reusable table for admin pages |
