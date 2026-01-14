# CraftCrew Auth Platform v2 - Documentation

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Core Functionalities](#core-functionalities)
5. [Data Models](#data-models)
6. [API Endpoints](#api-endpoints)
7. [Security Implementation](#security-implementation)
8. [Configuration](#configuration)
9. [Admin Panel](#admin-panel)
10. [Development Guidelines](#development-guidelines)
11. [References](#references)

---

## Overview

### Purpose

The CraftCrew Authentication Framework is a **backend-first authentication frontend** built with React and TypeScript. It provides:

- **Email/Password authentication** via backend API
- **Cross-domain Single Sign-On (SSO)** capabilities
- **Multi-tenant user management**
- **Role-Based Access Control (RBAC)** with permission management
- **Admin panel** for user, role, permission, and tenant administration

### Design Philosophy

| Principle                | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| **Backend-First Auth**    | Frontend calls backend API for auth; backend manages IdP integration        |
| **Contract-First**       | Frontend uses OpenAPI spec for type safety                             |
| **Tenant-Aware**         | Authentication operates within tenant context (tenant determined upstream) |
| **Principal Separation** | Clean separation between Principal identity and TenantContext              |
| **Fail-Closed**          | All authentication failures result in denial                               |

### Project Structure

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
│   │   │   ├── AdminLayout.tsx     # Admin panel layout
│   │   │   ├── AuthLayout.tsx      # Public auth pages layout
│   │   │   ├── Header.tsx          # Top header
│   │   │   └── ThemeToggle.tsx     # Dark/light/system toggle
│   │   ├── auth/               # Auth guards
│   │   │   ├── ProtectedRoute.tsx  # Auth guard HOC
│   │   │   └── AdminRoute.tsx      # Admin role guard HOC
│   │   └── shared/             # Shared components
│   │       ├── DataTable.tsx       # Generic data table
│   │       ├── EmptyState.tsx      # Empty state
│   │       ├── LoadingSkeleton.tsx # Loading skeleton
│   │       └── ConfirmDialog.tsx   # Confirmation dialog
│   │
│   ├── features/               # Feature modules
│   │   ├── profile/            # User profile
│   │   ├── settings/           # User settings
│   │   └── admin/              # Admin panel
│   │       ├── pages/            # Admin pages
│   │
│   ├── stores/                 # Zustand stores
│   │   ├── authStore.ts        # Auth state
│   │   ├── themeStore.ts       # Theme preferences
│   │   └── uiStore.ts          # UI state
│   │
│   ├── services/               # API services
│   │   └── api/                # Real API clients
│   │       ├── client.ts           # Base API client
│   │       ├── auth.ts             # Auth endpoints
│   │       ├── users.ts            # Users API
│   │       ├── roles.ts            # Roles API
│   │       ├── permissions.ts      # Permissions API
│   │       ├── tenants.ts          # Tenants API
│   │       ├── authz.ts            # Authorization API
│   │       └── profile.ts          # Profile API
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Auth hook
│   │   ├── useUsers.ts         # Users CRUD
│   │   ├── useRoles.ts         # Roles CRUD
│   │   ├── usePermissions.ts   # Permissions hooks
│   │   ├── useTenants.ts       # Tenants hooks
│   │   ├── useAuthz.ts         # Authorization checks
│   │   └── useProfile.ts       # Current user
│   │
│   ├── types/                  # TypeScript definitions
│   │   ├── auth.ts             # Principal types
│   │   ├── user.ts             # User types
│   │   ├── role.ts             # Role, Permission types
│   │   └── tenant.ts           # Tenant types
│   │
│   ├── lib/                    # Utilities
│   │   ├── utils.ts            # cn() utility
│   │   └── token.ts            # JWT utilities
│   │
│   └── config/                 # Configuration
│       ├── env.ts              # Environment variables
│       └── routes.ts           # Route constants
│
├── tests/
├── [config files]
└── [documentation]
```

---

## Technology Stack

### Frontend Framework

| Technology       | Version | Purpose             |
| ---------------- | ------- | ------------------- |
| React            | 19.2.0  | UI framework        |
| TypeScript       | 5.9.3   | Type safety         |
| Vite             | 7.2.4   | Build tool with HMR |
| React Router DOM | 7.12.0  | Client-side routing |

### State Management

| Technology    | Version | Purpose                 |
| ------------- | ------- | ----------------------- |
| Zustand       | 5.0.10  | Global state management |
| TanStack Query | 5.90.16 | Server state, caching   |

### UI & Styling

| Technology               | Version | Purpose                        |
| ------------------------ | ------- | ------------------------------ |
| Tailwind CSS             | 4.1.18   | Utility-first CSS              |
| Radix UI                 | 1.x     | Accessible headless components |
| shadcn/ui               | -       | UI component library         |
| Lucide React             | 0.562.0 | Icon library                   |
| class-variance-authority | 0.7.1   | Component variants             |
| clsx + tailwind-merge    | -       | Class name utilities           |
| next-themes             | 0.4.6   | Theme management              |

### Data & HTTP

| Technology           | Version | Purpose                         |
| -------------------- | ------- | ------------------------------- |
| Axios                | 1.13.2  | HTTP client                     |
| TanStack React Table | 8.21.3  | Data table component            |

### Forms & Validation

| Technology    | Version | Purpose                 |
| ------------- | ------- | ----------------------- |
| React Hook Form | 7.71.0  | Form state management    |
| Zod            | 4.3.5   | Schema validation       |

### Development Tools

| Tool         | Purpose            |
| ------------ | ------------------ |
| ESLint       | Code linting       |
| Vitest       | Unit testing       |
| PostCSS      | CSS processing     |
| Docker       | Containerization   |

---

## Architecture

### Authentication Flow (Backend-First)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │  Auth App   │     │  Backend    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Email/Password│                   │
       │    on /login     │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │ 2. POST /api/v1/auth/login
       │                   │──────────────────>
       │                   │                   │
       │                   │ 3. Backend validates (may query IdP)
       │                   │<──────────────────
       │                   │                   │
       │ 4. Return tokens (access, refresh, id)│
       │<──────────────────│───────────────────
       │                   │                   │
       │ 5. Store in sessionStorage
       │                   │                   │
       │ 6. Redirect to authenticated pages
       │<──────────────────│
```

### State Management Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         React App                              │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │   AuthStore     │    │   ThemeStore    │                 │
│  ├──────────────────┤    ├──────────────────┤                 │
│  │ - principal      │    │ - theme          │                 │
│  │ - accessToken    │    │ - setTheme()     │                 │
│  │ - isAuthenticated│    └──────────────────┘                 │
│  │ - login()        │                                         │
│  │ - logout()       │    ┌──────────────────┐                 │
│  │ - refreshSession()│    │   UIStore       │                 │
│  └──────────────────┘    ├──────────────────┤                 │
│                          │ - modals         │                 │
│                          │ - sidebar        │                 │
│                          └──────────────────┘                 │
├────────────────────────────────────────────────────────────────┤
│                     Protected Routes                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ProtectedRoute│  │ AdminRoute   │  │  Component   │        │
│  │ (auth check) │─>│ (role check) │─>│   Render     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

### Authorization Model (Fail-Closed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authorization Decision Flow                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Check Explicit ACL DENY  ─────> If exists → DENY           │
│         │                                                       │
│         ▼                                                       │
│  2. Check Explicit ACL ALLOW ─────> If exists → ALLOW          │
│         │                                                       │
│         ▼                                                       │
│  3. Check RBAC Role Permissions ──> Based on assigned roles    │
│         │                                                       │
│         ▼                                                       │
│  4. No match found ───────────────> DENY (fail-closed)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Functionalities

### 1. Authentication

#### Backend API Login

| Feature           | Implementation                              |
| ----------------- | ------------------------------------------- |
| Flow             | Email/password → POST /api/v1/auth/login   |
| Token Storage     | sessionStorage (not localStorage)             |
| Token Types       | Access token, Refresh token, ID token       |
| Auto Refresh     | 401 → retry with refresh token             |

**Location**: `src/stores/authStore.ts`, `src/services/api/auth.ts`

#### Token Management

```typescript
// Token operations available in authStore
login(email, password)           // Authenticate via backend
logout()                         // Logout and clear tokens
refreshSession()                  // Refresh access token
hasRole(role)                    // Check user role
hasAdminAccess()                 // Check admin role
```

### 2. Cross-Domain SSO

Enables external platforms to redirect users to `/sso` for authentication.

| Feature           | Description                  |
| ----------------- | ---------------------------- |
| Domain Whitelist  | Configurable allowed domains |
| Response Mode     | code (OAuth 2.0) or token |
| Token Passing     | Via secure query parameters  |

**Configuration**: `VITE_EXTERNAL_AUTH_ENABLED`, `VITE_ALLOWED_REDIRECT_DOMAINS`

**Location**: `src/features/auth/pages/SSORedirectPage.tsx`

### 3. User Management

#### Admin Features

- List users with pagination and search
- View user details (email, display name, IdP info)
- Assign/remove roles
- Delete users
- Track last seen timestamp

**Location**: `src/features/admin/pages/UsersPage.tsx`

### 4. Role-Based Access Control (RBAC)

Permission checking utilities:

```typescript
hasAdminAccess(principal); // Check admin roles
hasRole(principal, role); // Exact role check
hasAnyRole(principal, roles); // Check any of multiple roles
canManageUsers(principal); // User management permission
canManageRoles(principal); // Role management permission
canManageTenants(principal); // Tenant management permission
```

**Location**: `src/lib/permissions.ts`

---

## Data Models

### AuthenticatedPrincipal

```typescript
interface AuthenticatedPrincipal {
  principal_id: string;           // Platform-generated UUID
  actor_type: 'USER' | 'SERVICE' | 'API_KEY' | 'SYSTEM';
  authentication_method: 'PASSWORD' | 'SSO' | 'MFA' | 'CLIENT_CREDENTIALS' | 'API_KEY' | 'REFRESH_TOKEN' | 'IMPERSONATION' | 'SYSTEM_INTERNAL';
  auth_source?: {
    idp_issuer: string;
    idp_subject: string;
    provider_type: 'KEYCLOAK' | 'AUTH0' | 'ZITADEL' | 'OKTA' | 'GENERIC_OIDC';
  };
  authentication_time: string;
  token_expiry?: string;
  email?: string;
  email_verified?: boolean;
  display_name?: string;
  roles?: string[];
  scopes?: string[];
  tenant_hints?: {
    tenant_id?: string;
    organization_id?: string;
    tenant_roles?: string[];
  };
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

interface UserRole {
  id: string;
  name: string;
  tenant_id: string;
}
```

### Role

```typescript
interface RoleResponse {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface PermissionResponse {
  id: string;
  tenant_id: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: string;
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

interface TenantEntitlements {
  features: Record<string, boolean>;
  quotas: Record<string, number>;
  plan_tier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
}
```

---

## API Endpoints

### Frontend Routes

| Route                | Component       | Protection | Description            |
| -------------------- | --------------- | ---------- | ---------------------- |
| `/login`             | LoginPage       | Public     | Login page             |
| `/callback`          | CallbackPage    | Public     | OAuth callback handler |
| `/sso`               | SSORedirectPage | Public | Cross-domain SSO       |
| `/profile`           | ProfilePage    | Protected  | User profile           |
| `/settings`          | SettingsPage   | Protected  | User settings          |
| `/admin`             | AdminDashboard | Admin      | Admin dashboard        |
| `/admin/users`       | UsersPage      | Admin      | User management        |
| `/admin/roles`       | RolesPage      | Admin      | Role management        |
| `/admin/permissions` | PermissionsPage | Admin   | Permission management  |
| `/admin/tenants`     | TenantsPage    | Admin      | Tenant management      |

### Backend API Endpoints

#### Authentication

| Method | Endpoint                    | Description                            |
| ------ | --------------------------- | -------------------------------------- |
| POST   | `/api/v1/auth/login`     | Email/password login                    |
| POST   | `/api/v1/auth/register`  | Register new user                      |
| POST   | `/api/v1/auth/refresh`   | Refresh access token                   |
| POST   | `/api/v1/auth/logout`    | Logout and invalidate tokens           |
| POST   | `/api/v1/auth/introspect`| Validate and decode tokens              |
| GET    | `/api/v1/auth/userinfo`  | Get user profile from IdP             |
| GET    | `/api/v1/auth/me`        | Get current authenticated user         |

#### Authorization

| Method | Endpoint                          | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| POST   | `/api/v1/authz/check`           | Check authorization               |
| POST   | `/api/v1/authz/check/bulk`       | Bulk authorization check          |
| GET    | `/api/v1/authz/me/permissions` | Get current user's permissions  |

#### User Management

| Method | Endpoint                          | Description         |
| ------ | --------------------------------- | ------------------- |
| GET    | `/api/v1/users`                  | List users         |
| GET    | `/api/v1/users/{principal_id}`     | Get user by ID      |
| GET    | `/api/v1/users/{principal_id}/roles` | Get user roles |

#### Role Management

| Method | Endpoint                                    | Description               |
| ------ | ------------------------------------------- | ------------------------- |
| GET    | `/api/v1/roles`                           | List roles                |
| POST   | `/api/v1/roles`                           | Create role               |
| GET    | `/api/v1/roles/{role_id}`                | Get role by ID            |
| PATCH  | `/api/v1/roles/{role_id}`                | Update role               |
| DELETE | `/api/v1/roles/{role_id}`                | Delete role               |
| POST   | `/api/v1/roles/{role_id}/assignments`    | Assign role to user      |
| DELETE | `/api/v1/roles/{role_id}/assignments/{principal_id}` | Revoke role from user |
| GET    | `/api/v1/roles/{role_id}/permissions`   | Get role permissions      |
| POST   | `/api/v1/roles/{role_id}/permissions`   | Grant permission to role  |
| DELETE | `/api/v1/roles/{role_id}/permissions/{permission_id}` | Revoke permission |

#### Permission Management

| Method | Endpoint                              | Description                 |
| ------ | ------------------------------------- | --------------------------- |
| GET    | `/api/v1/permissions`              | List all permissions        |
| POST   | `/api/v1/permissions`              | Create permission           |
| GET    | `/api/v1/permissions/{permission_id}` | Get permission by ID      |
| DELETE | `/api/v1/permissions/{permission_id}` | Delete permission           |

#### Tenant Management

| Method | Endpoint                                  | Description          |
| ------ | ----------------------------------------- | -------------------- |
| GET    | `/api/v1/tenants`                      | List tenants         |
| POST   | `/api/v1/tenants`                      | Create tenant        |
| GET    | `/api/v1/tenants/{tenant_id}`           | Get tenant by ID     |
| PATCH  | `/api/v1/tenants/{tenant_id}`           | Update tenant        |
| DELETE | `/api/v1/tenants/{tenant_id}`           | Delete tenant        |
| POST   | `/api/v1/tenants/{tenant_id}/suspend`   | Suspend tenant       |
| POST   | `/api/v1/tenants/{tenant_id}/activate`  | Activate tenant       |

---

## Security Implementation

### Token Security

| Aspect       | Implementation                       |
| ------------ | ------------------------------------ |
| Storage      | SessionStorage (not localStorage)    |
| Transmission | Bearer token in Authorization header |
| Expiration   | Automatic checking and refresh       |
| Cleanup      | Cleared on logout and expiration     |

### CSRF Protection

- State parameter validation on SSO redirects
- Token refresh on 401 responses

### Domain Validation

- Whitelist-based validation for SSO redirects
- URL parsing and sanitization

---

## Configuration

### Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Cross-Domain SSO
VITE_EXTERNAL_AUTH_ENABLED=true
VITE_EXTERNAL_AUTH_RESPONSE_MODE=code
VITE_ALLOWED_REDIRECT_DOMAINS=app.example.com,admin.example.com
VITE_SSO_SESSION_TIMEOUT=1800
VITE_SSO_MAX_CONCURRENT=5

# Development
VITE_ENABLE_MOCK_API=false
```

---

## Admin Panel

### Dashboard (`/admin`)

- Statistics cards: Total users, roles, permissions, tenants
- Quick action buttons: Create user, role, permission, tenant
- Recent activity section (placeholder)

### User Management (`/admin/users`)

- Paginated data table with TanStack Table
- Search/filter by email
- View user details (email, display name, IdP, created, last seen)
- Assign/remove roles
- Delete users with confirmation

### Role Management (`/admin/roles`)

- List roles with system badge
- Create/edit/delete roles (system roles protected)
- Manage role permissions
- View user assignments

### Permission Management (`/admin/permissions`)

- List permissions by resource
- Create/delete permissions
- Display resource, action, description

### Tenant Management (`/admin/tenants`)

- List tenants with status badges
- Create/update/delete tenants
- Suspend/activate tenants
- View tenant slug and created date

---

## Development Guidelines

### Component Patterns

```typescript
// Use function components with explicit props interfaces
interface Props {
  title: string
  onSave: () => void
}

export const MyComponent: React.FC<Props> = ({ title, onSave }) => {
  return <div>{title}</div>
}
```

### Imports

```typescript
// External libraries
import { useState } from 'react'

// Internal components
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'

// Internal utilities
import { cn } from '@/lib/utils'
```

### Form Handling (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
})
```

### TanStack Query Best Practices

```typescript
// Use unique query keys
useQuery({
  queryKey: ['users', { search }],
  queryFn: () => fetchUsers({ search }),
  staleTime: 5 * 60 * 1000,
})

// Invalidate related queries after mutations
useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

---

## References

### Key File Locations

| Purpose               | File                              |
| --------------------- | -------------------------------- |
| Auth State Management  | `src/stores/authStore.ts`        |
| API Client            | `src/services/api/client.ts`       |
| Auth Endpoints        | `src/services/api/auth.ts`         |
| Admin Pages          | `src/features/admin/pages/`        |
| Type Definitions      | `src/types/`                      |
| Route Protection     | `src/components/auth/ProtectedRoute.tsx` |
| Data Table Component | `src/components/shared/DataTable.tsx` |

### Build Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run type-check       # TypeScript check
npm run lint             # ESLint
npm run test             # Run tests
```
