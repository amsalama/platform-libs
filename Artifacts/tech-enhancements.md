# CraftCrew Auth Platform v2 - Critical Review & Implementation Plan

## Executive Summary

This document provides a comprehensive analysis of the CraftCrew Authentication Frontend v2, comparing the current implementation against the backend OpenAPI specification and identifying gaps, issues, and required work to complete the platform.

**Overall Assessment**: The frontend is approximately **60% complete**. Core authentication flows are production-grade, but admin panel CRUD operations are stubbed, and several API integrations are missing entirely.

---

## Table of Contents

1. [API Specification Analysis](#1-api-specification-analysis)
2. [Current Implementation Status](#2-current-implementation-status)
3. [Critical Issues Identified](#3-critical-issues-identified)
4. [Gap Analysis: API vs Frontend](#4-gap-analysis-api-vs-frontend)
5. [Type Definition Mismatches](#5-type-definition-mismatches)
6. [Security Concerns](#6-security-concerns)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Verification Plan](#8-verification-plan)

---

## 1. API Specification Analysis

### Backend API Overview (from OpenAPI 3.1.0)

**Base URL**: `http://172.174.47.198:8007`
**API Prefix**: `/api/v1/`

### Complete Endpoint Inventory

#### Health Endpoints
| Method | Path | Status |
|--------|------|--------|
| GET | `/health` | Not needed in frontend |
| GET | `/ready` | Not needed in frontend |

#### Authentication Endpoints (tag: auth)
| Method | Path | Frontend Status |
|--------|------|-----------------|
| POST | `/api/v1/auth/login` | Implemented |
| POST | `/api/v1/auth/register` | Implemented |
| POST | `/api/v1/auth/refresh` | Implemented |
| POST | `/api/v1/auth/logout` | Implemented |
| POST | `/api/v1/auth/introspect` | Implemented |
| GET | `/api/v1/auth/userinfo` | Implemented |
| GET | `/api/v1/auth/me` | Implemented |

#### Authorization Endpoints (tag: Authorization)
| Method | Path | Frontend Status |
|--------|------|-----------------|
| GET | `/api/v1/authz/me/permissions` | Implemented |
| POST | `/api/v1/authz/check` | Implemented |
| POST | `/api/v1/authz/check/bulk` | Implemented |

#### User Management Endpoints (tag: User Management)
| Method | Path | Frontend Status |
|--------|------|-----------------|
| GET | `/api/v1/users` | Implemented |
| POST | `/api/v1/users` | **MISSING** |
| GET | `/api/v1/users/{principal_id}` | Implemented |
| PATCH | `/api/v1/users/{principal_id}` | **MISSING** |
| GET | `/api/v1/users/{principal_id}/roles` | Implemented |

#### Role Management Endpoints (tag: Role Management)
| Method | Path | Frontend Status |
|--------|------|-----------------|
| GET | `/api/v1/roles` | Implemented |
| POST | `/api/v1/roles` | Implemented |
| GET | `/api/v1/roles/hierarchy` | **MISSING** |
| GET | `/api/v1/roles/{role_id}` | Implemented |
| PATCH | `/api/v1/roles/{role_id}` | Implemented |
| DELETE | `/api/v1/roles/{role_id}` | Implemented |
| POST | `/api/v1/roles/{role_id}/assignments` | Implemented |
| DELETE | `/api/v1/roles/{role_id}/assignments/{principal_id}` | Implemented |
| GET | `/api/v1/roles/{role_id}/permissions` | Implemented |
| POST | `/api/v1/roles/{role_id}/permissions` | Implemented |
| POST | `/api/v1/roles/{role_id}/permissions/bulk` | **MISSING** |
| GET | `/api/v1/roles/{role_id}/with-permissions` | **MISSING** |
| DELETE | `/api/v1/roles/{role_id}/permissions/{permission_id}` | Implemented |

#### Permission Management Endpoints (tag: Permission Management)
| Method | Path | Frontend Status |
|--------|------|-----------------|
| GET | `/api/v1/permissions` | Implemented |
| POST | `/api/v1/permissions` | Implemented |
| GET | `/api/v1/permissions/groups` | **MISSING** |
| GET | `/api/v1/permissions/{permission_id}` | Implemented |
| DELETE | `/api/v1/permissions/{permission_id}` | Implemented |

#### Tenant Management Endpoints (tag: Tenant Management)
| Method | Path | Frontend Status |
|--------|------|-----------------|
| GET | `/api/v1/tenants` | Implemented |
| POST | `/api/v1/tenants` | Implemented |
| GET | `/api/v1/tenants/{tenant_id}` | Implemented |
| PATCH | `/api/v1/tenants/{tenant_id}` | Implemented |
| DELETE | `/api/v1/tenants/{tenant_id}` | Implemented |
| POST | `/api/v1/tenants/{tenant_id}/suspend` | Implemented |
| POST | `/api/v1/tenants/{tenant_id}/activate` | Implemented |

#### User Profile Endpoints (tag: User Profile)
| Method | Path | Frontend Status |
|--------|------|-----------------|
| PATCH | `/api/v1/user/profile` | **MISSING** |

#### Audit Endpoints (tag: Audit) - **ENTIRELY MISSING**
| Method | Path | Frontend Status |
|--------|------|-----------------|
| POST | `/api/v1/audit` | **MISSING** |
| POST | `/api/v1/audit/verify` | **MISSING** |
| POST | `/api/v1/audit/query` | **MISSING** |

#### Rate Limiting Endpoints (tag: Rate Limiting) - **ENTIRELY MISSING**
| Method | Path | Frontend Status |
|--------|------|-----------------|
| GET | `/api/v1/rate-limit/status/{bucket}` | **MISSING** |
| POST | `/api/v1/rate-limit/check` | **MISSING** |
| DELETE | `/api/v1/rate-limit/reset` | **MISSING** |

#### Token Revocation Endpoints (tag: Token Revocation) - **ENTIRELY MISSING**
| Method | Path | Frontend Status |
|--------|------|-----------------|
| POST | `/api/v1/revocation/token` | **MISSING** |
| POST | `/api/v1/revocation/user` | **MISSING** |
| POST | `/api/v1/revocation/session` | **MISSING** |
| POST | `/api/v1/revocation/check` | **MISSING** |

---

## 2. Current Implementation Status

### Authentication (95% Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password Login | Complete | Form validation, error handling |
| User Registration | Complete | With Zod validation |
| Token Refresh | Complete | Automatic 401 interception, retry |
| Logout | Complete | Backend notification, local cleanup |
| Protected Routes | Complete | Auth guard HOC |
| Admin Routes | Complete | Role-based access |
| SSO Redirect | Partial | Domain validation, weak session ID |
| 2FA Support | Partial | Bypasses auth store |
| Forgot Password | Partial | No success feedback, raw fetch |
| PKCE/OAuth | Partial | Missing state validation on callback |

### Admin Panel (60% Complete)

| Feature | Read | Create | Update | Delete | Notes |
|---------|------|--------|--------|--------|-------|
| Users | Complete | **Stubbed** | **Stubbed** | **Stubbed** | All mutations console.log only |
| Roles | Complete | **Stubbed** | **Stubbed** | **Stubbed** | Hook exists, not wired to UI |
| Permissions | Complete | **Stubbed** | N/A | **Stubbed** | Hook exists, not wired to UI |
| Tenants | Complete | **Stubbed** | **Stubbed** | **Stubbed** | Hook exists, not wired to UI |
| Dashboard | Complete | N/A | N/A | N/A | Stats display working |

### API Services Layer

| Service | Status | Missing |
|---------|--------|---------|
| `auth.ts` | Complete | - |
| `authz.ts` | Complete | - |
| `users.ts` | Partial | createUser, updateUser |
| `roles.ts` | Partial | getRoleHierarchy, bulkGrantPermissions, getRoleWithPermissions |
| `permissions.ts` | Partial | getPermissionsGrouped |
| `tenants.ts` | Complete | - |
| `profile.ts` | **Missing** | updateProfile (self-service) |
| `audit.ts` | **Missing** | Entire service |
| `rate-limit.ts` | **Missing** | Entire service |
| `revocation.ts` | **Missing** | Entire service |

### React Query Hooks

| Hook | Status | Missing Mutations |
|------|--------|-------------------|
| `useUsers.ts` | Partial | useCreateUser, useUpdateUser, useDeleteUser |
| `useRoles.ts` | Complete | - |
| `usePermissions.ts` | Complete | - |
| `useTenants.ts` | Complete | - |
| `useProfile.ts` | **Missing** | useUpdateProfile |
| `useAudit.ts` | **Missing** | Entire hook |

---

## 3. Critical Issues Identified

### Priority 1: Security Issues

1. **Weak SSO Session ID Generation** (`SSORedirectPage.tsx:52`)
   ```typescript
   // CURRENT (insecure):
   const sessionId = `sso_${Math.random().toString(36).substring(2)}`

   // SHOULD BE:
   const sessionId = `sso_${generateSecureRandom(32)}`
   ```

2. **Missing PKCE State Validation** (`CallbackPage.tsx`)
   - OAuth callback doesn't validate `state` parameter against stored value
   - CSRF vulnerability

3. **ID Token Parsing Without Validation** (`authStore.ts:232-271`)
   - JWT claims parsed without signature validation
   - Acceptable if backend validates, but should document assumption

4. **2FA/Forgot Password Bypass Auth Store**
   - `TwoFactorPage.tsx` and `ForgotPasswordPage.tsx` use raw `fetch()` instead of `apiClient`
   - Inconsistent error handling, no token refresh capability

### Priority 2: Implementation Gaps

1. **Admin Panel Forms Not Wired**
   - All "Add" buttons are `console.log()` stubs
   - All "Edit" row actions are stubs
   - All "Delete" operations have hooks but aren't called from UI

2. **Missing User CRUD**
   - No `createUser`, `updateUser`, `deleteUser` in API service
   - No corresponding hooks

3. **Missing API Services**
   - Audit API (required for compliance)
   - Rate Limiting API (required for security)
   - Token Revocation API (required for security)
   - Profile self-service update

### Priority 3: Type Mismatches

1. **UserResponse Field Naming**
   - Frontend: `display_name`
   - Backend API: `name`

2. **Missing Pagination Types**
   - API returns `PaginatedUsersResponse` with `items`, `total`, `limit`, `offset`, `has_more`
   - Frontend expects flat array

3. **Missing Response Types**
   - `RoleHierarchyNode`
   - `RoleWithPermissionsResponse`
   - `PermissionGroupResponse`
   - All Audit types
   - All Rate Limit types
   - All Revocation types

---

## 4. Gap Analysis: API vs Frontend

### User Management Gaps

**API Provides:**
```typescript
// POST /api/v1/users
interface UserCreate {
  email: string;
  name?: string;
  idp_issuer: string;
  idp_subject: string;
  role_id?: string; // Optional role to assign
}

// PATCH /api/v1/users/{principal_id}
interface UserUpdate {
  email?: string;
  name?: string;
}

// GET /api/v1/users (paginated response)
interface PaginatedUsersResponse {
  items: UserResponse[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
```

**Frontend Missing:**
- `createUser()` function in `users.ts`
- `updateUser()` function in `users.ts`
- `useCreateUser()` hook
- `useUpdateUser()` hook
- `useDeleteUser()` hook (API has no delete endpoint - verify if intentional)
- Paginated response handling
- Create/Edit user dialogs in `UsersPage.tsx`

### Role Management Gaps

**API Provides (not in frontend):**
```typescript
// GET /api/v1/roles/hierarchy
interface RoleHierarchyNode {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  depth: number;
  children: RoleHierarchyNode[];
}

// POST /api/v1/roles/{role_id}/permissions/bulk
interface BulkPermissionGrantRequest {
  permission_ids: string[]; // Max 100
}
interface BulkPermissionGrantResponse {
  granted: number;
  skipped: number;
  errors: string[];
}

// GET /api/v1/roles/{role_id}/with-permissions
interface RoleWithPermissionsResponse {
  // ... role fields
  permissions: PermissionResponse[];
  permission_count: number;
}
```

### Permission Management Gaps

**API Provides (not in frontend):**
```typescript
// GET /api/v1/permissions/groups
interface PermissionGroupResponse {
  resource: string;
  permissions: PermissionResponse[];
  total_count: number;
}
```

### Profile Self-Service Gap

**API Provides (not in frontend):**
```typescript
// PATCH /api/v1/user/profile
interface ProfileUpdateRequest {
  name?: string;
}
```

### Entirely Missing API Categories

#### Audit API
```typescript
// POST /api/v1/audit
interface AuditEventRequest {
  event_type: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  outcome?: string; // 'success' | 'failure' | 'unknown'
  details?: Record<string, any>;
}

// POST /api/v1/audit/query
interface AuditQueryRequest {
  tenant_id?: string;
  principal_id?: string;
  event_type?: string;
  resource_type?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}
```

#### Rate Limiting API
```typescript
// GET /api/v1/rate-limit/status/{bucket}
interface RateLimitStatusResponse {
  bucket: string;
  allowed: boolean;
  remaining: number;
  limit: number;
  reset_at: number;
  retry_after?: number;
}
```

#### Token Revocation API
```typescript
// POST /api/v1/revocation/token
interface TokenRevokeRequest {
  token_or_jti: string;
  reason?: string;
  expires_in?: number;
  user_id?: string;
}

// POST /api/v1/revocation/user
interface UserRevokeRequest {
  user_id: string;
  reason?: string;
  expires_in?: number;
}

// POST /api/v1/revocation/session
interface SessionRevokeRequest {
  session_id: string;
  user_id?: string;
  reason?: string;
  expires_in?: number;
}
```

---

## 5. Type Definition Mismatches

### Critical Field Name Differences

| Location | Frontend | Backend API | Action Required |
|----------|----------|-------------|-----------------|
| UserResponse | `display_name` | `name` | Update frontend type |
| UserResponse | Missing | `id` (separate from principal_id) | Add field |
| RoleResponse | Missing | `updated_at` | Add field |
| TenantResponse | Missing | `description` | Add field |

### Missing Type Definitions

**File: `src/types/user.ts`**
```typescript
// ADD:
interface UserCreate {
  email: string;
  name?: string;
  idp_issuer: string;
  idp_subject: string;
  role_id?: string;
}

interface UserUpdate {
  email?: string;
  name?: string;
}

interface PaginatedUsersResponse {
  items: UserResponse[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface UserDetailResponse {
  principal_id: string;
  email: string | null;
  name: string | null;
  idp_issuer: string;
  idp_subject: string;
  created_at: string;
  last_seen_at: string | null;
  roles: RoleResponse[];
  tenant_ids: string[];
}
```

**File: `src/types/role.ts`**
```typescript
// ADD:
interface RoleHierarchyNode {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  depth: number;
  children: RoleHierarchyNode[];
}

interface RoleWithPermissionsResponse extends RoleResponse {
  permissions: PermissionResponse[];
  permission_count: number;
}

interface BulkPermissionGrantRequest {
  permission_ids: string[];
}

interface BulkPermissionGrantResponse {
  granted: number;
  skipped: number;
  errors: string[];
}
```

**New File: `src/types/audit.ts`**
```typescript
interface AuditEventRequest {
  event_type: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  outcome?: 'success' | 'failure' | 'unknown';
  details?: Record<string, any>;
}

interface AuditEventResponse {
  success: boolean;
  event_id: string;
  timestamp: string;
  message: string;
}

interface AuditQueryRequest {
  tenant_id?: string;
  principal_id?: string;
  event_type?: string;
  resource_type?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

interface AuditEventInfo {
  event_id: string;
  event_type: string;
  timestamp: string;
  tenant_id: string | null;
  principal_id: string | null;
  resource_type: string;
  resource_id: string | null;
  action: string;
  outcome: string;
  details: Record<string, any>;
}

interface AuditQueryResponse {
  events: AuditEventInfo[];
  total: number;
  limit: number;
  offset: number;
}
```

**New File: `src/types/revocation.ts`**
```typescript
interface TokenRevokeRequest {
  token_or_jti: string;
  reason?: string;
  expires_in?: number;
  user_id?: string;
}

interface UserRevokeRequest {
  user_id: string;
  reason?: string;
  expires_in?: number;
}

interface SessionRevokeRequest {
  session_id: string;
  user_id?: string;
  reason?: string;
  expires_in?: number;
}

interface RevocationResponse {
  success: boolean;
  message: string;
  revoked_key: string;
}

interface RevocationCheckRequest {
  token_or_jti: string;
}

interface RevocationCheckResponse {
  is_revoked: boolean;
  reason?: string;
  revoked_at?: string;
}
```

---

## 6. Security Concerns

### High Priority

| Issue | Location | Risk | Fix |
|-------|----------|------|-----|
| Math.random() for session IDs | `SSORedirectPage.tsx:52` | Predictable session IDs | Use `generateSecureRandom()` |
| Missing state validation | `CallbackPage.tsx` | CSRF attacks | Validate state against stored value |
| Raw fetch bypasses auth | `ForgotPasswordPage.tsx`, `TwoFactorPage.tsx` | Inconsistent error handling | Use `apiClient` |

### Medium Priority

| Issue | Location | Risk | Fix |
|-------|----------|------|-----|
| No proactive token refresh | `authStore.ts` | Token expiry mid-request | Refresh 30-60s before expiry |
| Error messages expose details | `client.ts:66` | Information disclosure | Sanitize error messages |
| 2FA stores tokens directly | `TwoFactorPage.tsx:52-62` | State inconsistency | Use auth store methods |

### Low Priority

| Issue | Location | Risk | Fix |
|-------|----------|------|-----|
| No token validation in frontend | `authStore.ts` | UI shows incorrect claims | Document backend validates |
| Hardcoded 'admin' role | `AdminRoute.tsx` | Maintainability | Use constant |

---

## 7. Implementation Roadmap

### Phase 0: Code Cleanup (MUST DO FIRST)

The codebase has significant structural issues that must be fixed before any feature work.

#### 0.1 Delete Compilation Artifacts (69 files)

All `.js` files in `src/` are TypeScript compilation artifacts that shouldn't exist:

```bash
# Files to delete:
src/**/*.js  # 69 files total
```

**Root cause**: `tsconfig.json` missing `noEmit: true`. The correct config is in `tsconfig.app.json`.

**Fix**:
1. Delete all 69 `.js` files in `src/`
2. Add `"noEmit": true` to `tsconfig.json`
3. Or reference `tsconfig.app.json` which already has it

#### 0.2 Delete Leftover/Temp Files

| File/Directory | Reason |
|---------------|--------|
| `src/test-app.tsx` | Debug file, not production code |
| `src/test-app.js` | Compiled artifact |
| `src/App.css` | Vite template leftover (unused) |
| `src/assets/react.svg` | Vite template leftover |
| `craft-crew-auth-v2/` (nested) | Empty duplicate directory |
| `tmpclaude-*-cwd` (17 files) | Temp files from Claude sessions |
| `vite.config.js` | Compiled config (have .ts) |
| `vite.config.d.ts` | Type declaration for compiled config |
| `tsconfig.tsbuildinfo` | Build cache |
| `dist/` | Build output (should be in .gitignore) |

#### 0.3 Fix CSS Chaos

Currently have **conflicting theme systems**:

| File | Theme System | Color Format | Dark Mode |
|------|-------------|--------------|-----------|
| `src/index.css` | Tailwind v4 `@theme` | HSL | `.dark` class |
| `src/styles/globals.css` | Old Tailwind + `@theme inline` | OKLCH + HSL mix | `.dark` AND `[data-theme="dark"]` |

**Problem**: Two completely different color variable systems, different formats (HSL vs OKLCH), conflicting dark mode selectors.

**Fix**:
1. Choose ONE theme system (recommend keeping `index.css` Tailwind v4 approach)
2. Delete or consolidate `globals.css`
3. Ensure all components use consistent color variables

#### 0.4 Create .gitignore

**File does not exist!** Create with:

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
*.tsbuildinfo

# Compiled JS (TypeScript project)
src/**/*.js

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temp files
tmpclaude-*
*.log

# Test coverage
coverage/
```

#### 0.5 Fix Confusing File Names

| Current | Problem | Fix |
|---------|---------|-----|
| `src/app/main.tsx` | Named like entry point but it's a route wrapper | Rename to `src/app/RootLayout.tsx` or similar |
| `tsconfig.json` vs `tsconfig.app.json` | Two configs, main one missing `noEmit` | Consolidate or clearly document which to use |

#### 0.6 Fix tsconfig.json

Add missing settings to match `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    // ... existing options ...
    "noEmit": true,  // ADD THIS - prevents .js file generation
    "isolatedModules": true  // ADD THIS - required for Vite
  }
}
```

#### 0.7 Clean Up Duplicate Configs

- `tsconfig.json` - Main config
- `tsconfig.app.json` - Vite-specific (has correct settings)
- `tsconfig.node.json` - Node config for vite.config.ts

**Recommendation**: Either merge into one tsconfig or ensure `tsconfig.json` extends `tsconfig.app.json`.

---

### Phase 1: Security Fixes (Critical)

**Files to modify:**
- `src/features/auth/pages/SSORedirectPage.tsx` - Fix session ID generation
- `src/features/auth/pages/CallbackPage.tsx` - Add state validation
- `src/features/auth/pages/ForgotPasswordPage.tsx` - Use apiClient
- `src/features/auth/pages/TwoFactorPage.tsx` - Use apiClient and auth store

### Phase 2: Type Definitions

**Files to create/modify:**
- `src/types/user.ts` - Add UserCreate, UserUpdate, PaginatedUsersResponse, UserDetailResponse
- `src/types/role.ts` - Add RoleHierarchyNode, RoleWithPermissionsResponse, bulk types
- `src/types/permission.ts` - Add PermissionGroupResponse
- `src/types/audit.ts` - Create new file with all audit types
- `src/types/revocation.ts` - Create new file with all revocation types
- `src/types/rate-limit.ts` - Create new file with rate limit types

### Phase 3: API Services

**Files to create/modify:**
- `src/services/api/users.ts` - Add createUser, updateUser
- `src/services/api/roles.ts` - Add getRoleHierarchy, bulkGrantPermissions, getRoleWithPermissions
- `src/services/api/permissions.ts` - Add getPermissionsGrouped
- `src/services/api/profile.ts` - Create/update for self-service profile
- `src/services/api/audit.ts` - Create new service
- `src/services/api/revocation.ts` - Create new service

### Phase 4: React Query Hooks

**Files to create/modify:**
- `src/hooks/useUsers.ts` - Add useCreateUser, useUpdateUser
- `src/hooks/useRoles.ts` - Add useRoleHierarchy, useBulkGrantPermissions
- `src/hooks/usePermissions.ts` - Add usePermissionsGrouped
- `src/hooks/useProfile.ts` - Add useUpdateProfile
- `src/hooks/useAudit.ts` - Create new hook

### Phase 5: Admin Panel Forms

**Files to create/modify:**
- `src/features/admin/components/UserFormDialog.tsx` - Create/Edit user form
- `src/features/admin/components/RoleFormDialog.tsx` - Create/Edit role form
- `src/features/admin/components/PermissionFormDialog.tsx` - Create permission form
- `src/features/admin/components/TenantFormDialog.tsx` - Create/Edit tenant form
- `src/features/admin/pages/UsersPage.tsx` - Wire up mutations
- `src/features/admin/pages/RolesPage.tsx` - Wire up mutations
- `src/features/admin/pages/PermissionsPage.tsx` - Wire up mutations
- `src/features/admin/pages/TenantsPage.tsx` - Wire up mutations

### Phase 6: Profile Page Enhancement

**Files to modify:**
- `src/features/profile/pages/ProfilePage.tsx` - Add self-service profile editing

### Phase 7: Audit Log Viewer (Admin)

**Files to create:**
- `src/features/admin/pages/AuditLogsPage.tsx` - Audit log viewer
- `src/app/routes.tsx` - Add `/admin/audit` route

---

## 8. Verification Plan

### Unit Tests

1. **Type compliance tests** - Verify types match OpenAPI schemas
2. **Hook tests** - Test all CRUD operations with mocked responses
3. **Form validation tests** - Test Zod schemas

### Integration Tests

1. **Auth flow tests**
   - Login with valid/invalid credentials
   - Token refresh on 401
   - Logout clears all state

2. **Admin CRUD tests**
   - Create/Read/Update/Delete for each entity
   - Error handling for 4xx/5xx responses

### Manual Testing Checklist

- [ ] Login with email/password
- [ ] Register new user (verify email requirement)
- [ ] Token auto-refresh after 401
- [ ] Admin dashboard stats load correctly
- [ ] Create/Edit/Delete user (admin)
- [ ] Create/Edit/Delete role (admin)
- [ ] Create/Delete permission (admin)
- [ ] Create/Edit/Delete tenant (admin)
- [ ] Assign/revoke roles from users
- [ ] SSO redirect flow with valid domain
- [ ] SSO redirect with invalid domain (should fail)

### Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm run test

# Coverage report
npm run test:coverage

# Build verification
npm run build
```

---

## Summary Statistics

| Category | Implemented | Missing | Total |
|----------|-------------|---------|-------|
| Auth Endpoints | 7 | 0 | 7 |
| Authz Endpoints | 3 | 0 | 3 |
| User Endpoints | 3 | 2 | 5 |
| Role Endpoints | 10 | 3 | 13 |
| Permission Endpoints | 4 | 1 | 5 |
| Tenant Endpoints | 7 | 0 | 7 |
| Profile Endpoints | 0 | 1 | 1 |
| Audit Endpoints | 0 | 3 | 3 |
| Rate Limit Endpoints | 0 | 3 | 3 |
| Revocation Endpoints | 0 | 4 | 4 |
| **TOTAL** | **34** | **17** | **51** |

**Overall API Coverage: 67%**
**Admin Panel CRUD Operations: ~20% wired (hooks exist but UI is stubbed)**

---

## 9. Dashboard & User Data Storage Refactor

### Problem

The current implementation parses the `id_token` JWT to extract user information, but the login API response already includes all user data directly:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "id_token": "...",
  "email": "super_admin@example.com",
  "email_verified": true,
  "name": "Super Admin",
  "given_name": "Super",
  "family_name": "Admin",
  "preferred_username": "super_admin",
  "principal_id": "588c178e-a6a5-cc02-8e46-8d66a6883a90",
  "tenant_id": null,
  "roles": ["super_admin", "viewer-access", "pacs-access", ...],
  "permissions": [],
  "authenticated_at": "2026-01-12T15:49:02.409117"
}
```

**Issues with current approach:**
1. Unnecessarily parsing JWT when data is available directly
2. `AuthenticatedPrincipal` type doesn't match actual response structure
3. ProfilePage shows fields like `actor_type` that don't exist in the response
4. `hasAdminAccess()` checks for `'admin'` role but actual role is `'super_admin'`

### Implementation Plan

#### 9.1 Update Types (`src/types/auth.ts`)

Create a simple `User` interface matching the actual response:

```typescript
export interface User {
  principal_id: string
  email: string
  email_verified: boolean
  name: string
  given_name: string
  family_name: string
  preferred_username: string
  tenant_id: string | null
  roles: string[]
  permissions: string[]
  authenticated_at: string
}
```

#### 9.2 Update API Types (`src/services/api/auth.ts`)

Update `UserProfileResponse` to match actual response:

```typescript
export interface LoginResponse {
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_in?: number
  token_type?: string
  email: string
  email_verified: boolean
  name: string
  given_name: string
  family_name: string
  preferred_username: string
  principal_id: string
  tenant_id: string | null
  roles: string[]
  permissions: string[]
  authenticated_at: string
}
```

#### 9.3 Update AuthStore (`src/stores/authStore.ts`)

**Changes:**
- Replace `principal: Principal | null` with `user: User | null`
- Store user data directly from response (no JWT parsing)
- Store user data in sessionStorage for persistence
- Update `hasRole()`, `hasAdminAccess()` to use `user.roles`
- Remove `parseIdToken()` function

**New state shape:**
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  accessToken: string | null
  refreshToken: string | null
  tokenExpiry: number | null
}
```

**Storage keys:**
- `craftcrew_access_token` - keep
- `craftcrew_refresh_token` - keep
- `craftcrew_user` - NEW: JSON stringified user object
- `token_expiry` - keep
- Remove `craftcrew_id_token` - not needed

#### 9.4 Update ProfilePage (`src/features/profile/pages/ProfilePage.tsx`)

Display actual user fields:
- **Header**: Welcome message with user's name
- **User Info Card**: Name, Username, Email (with verified badge), Principal ID, Tenant ID
- **Roles Card**: Display all roles as badges
- **Permissions Card**: Display permissions (if any)
- **Session Card**: Authenticated at, Token expiry, Copy access token button

#### 9.5 Update Role Checks

Update `hasAdminAccess()` to check for actual admin roles:
```typescript
hasAdminAccess: () => {
  const { user } = get()
  if (!user) return false
  return user.roles.some(role =>
    ['super_admin', 'admin', 'administrator'].includes(role.toLowerCase())
  )
}
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/auth.ts` | Add `User` interface, simplify types |
| `src/services/api/auth.ts` | Update `LoginResponse` type |
| `src/stores/authStore.ts` | Replace principal with user, store from response |
| `src/features/profile/pages/ProfilePage.tsx` | Update to display new user fields |
| `src/components/auth/ProtectedRoute.tsx` | Update auth check if needed |
| `src/components/auth/AdminRoute.tsx` | Update admin check |

### Verification

1. Login with valid credentials - should store user data correctly
2. Refresh page - should restore user from sessionStorage
3. Profile page - should display all user fields
4. Admin access - should work for users with `super_admin` role
5. Logout - should clear all stored data
