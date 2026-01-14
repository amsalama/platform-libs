# CraftCrew Auth v2 - Admin Dashboard Code Review

**Review Date**: January 2026
**Reviewer**: Claude Code
**Scope**: Admin dashboard functionality, security practices, data bindings

---

## Executive Summary

| Category | Status | Score |
|----------|--------|-------|
| Admin Dashboard | 55% functional | Critical Bugs |
| Security | Good foundation, 2 high-priority fixes needed | Needs Work |
| API Integration | API-Frontend Mismatch | Critical |
| Code Quality | Clean, well-structured | Good |

**Key Findings**:
- **CRITICAL**: API response format mismatch causes tables to display no data
- Backend returns plain arrays, frontend expects paginated objects
- Core CRUD operations work for most entities
- Several UI actions stubbed with `console.log()` placeholders
- 2 high-priority security issues identified
- 3 security issues from tech-enhancements.md already fixed

---

## 1. Admin Pages Functionality

### 1.1 AdminDashboard.tsx
**Status**: FULLY WORKING

- Statistics cards display correctly
- Quick action navigation links functional
- "Recent Activity" placeholder (acceptable)

### 1.2 UsersPage.tsx
**Status**: PARTIALLY STUBBED (70% complete)

| Feature | Works | Location |
|---------|-------|----------|
| List Users (paginated) | Yes | `useUsersPaginated()` |
| Create User | Yes | `UserFormDialog` + mutation |
| Update User | Yes | `updateUser.mutateAsync()` |
| View User Details | Yes | Expandable row + modal |
| Delete User | **NO** | Line 233: `console.log()` |
| View User Roles | **NO** | Line 96: `console.log()` |
| Bulk Delete | **NO** | Line 246: `console.log()` |

**Blocker**: `useDeleteUser` hook does not exist.

### 1.3 RolesPage.tsx
**Status**: PARTIALLY STUBBED (75% complete)

| Feature | Works | Location |
|---------|-------|----------|
| List Roles | Yes | `useRoles()` |
| Create Role | Yes | `createRole.mutateAsync()` |
| Update Role | Yes | `updateRole.mutateAsync()` |
| Delete Role (single) | Yes | `deleteRole.mutate()` |
| System Role Protection | Yes | Delete hidden for system roles |
| View Role Permissions | **NO** | Line 83: `console.log()` |
| View Role Users | **NO** | Line 87: `console.log()` |
| Bulk Delete | **NO** | Line 251: `console.log()` |

### 1.4 PermissionsPage.tsx
**Status**: PARTIALLY STUBBED (65% complete)

| Feature | Works | Location |
|---------|-------|----------|
| List Permissions | Yes | `usePermissions()` |
| Create Permission | Yes | `createPermission.mutateAsync()` |
| Delete Permission | Yes | `deletePermission.mutate()` |
| Edit Permission | **NO** | Line 78: `console.log()` |
| Bulk Delete | **NO** | Line 237: `console.log()` |

**Note**: Edit should be removed - API doesn't support permission updates (by design).

### 1.5 TenantsPage.tsx
**Status**: CRITICAL API PARSING BUG (95% complete)

**Blocker**: API returns plain array `TenantResponse[]`, but frontend expects paginated format `{ items, total, limit, offset, has_more }`. Service layer fails to normalize response, causing table to receive undefined data and render empty rows.

| Feature | Works | Notes |
|---------|-------|-------|
| List Tenants (paginated) | **NO** | API success, parsing failure |
| Create Tenant | Yes | - |
| Update Tenant | Yes | - |
| Delete Tenant | Yes (PENDING_DELETION only) | - |
| Suspend Tenant | Yes | - |
| Activate Tenant | Yes | - |
| Bulk Delete | **NO** (stubbed) | - |

### 1.6 API Response Format Issues (CRITICAL BUGS)

| Issue | Severity | Root Cause | Affected Pages |
|-------|----------|-------------|----------------|
| Tenants table never shows data | **CRITICAL** | API returns `[]`, frontend expects `{items, total}` - parsing fails | TenantsPage |
| Page navigation hangs/freezes | **CRITICAL** | All paginated hooks parse arrays as objects → React Query errors → infinite renders | All admin pages |
| Data inconsistent, requires refresh | **HIGH** | Failed parsing puts query in error state, cache invalid | All admin pages |

#### Root Cause Analysis

**Backend Response Format:**
```json
// GET /api/v1/users, /api/v1/roles, /api/v1/permissions, /api/v1/tenants
[
  { "id": "...", "name": "..." },
  { "id": "...", "name": "..." }
]
```

**Frontend Expectation:**
```json
{
  "items": [
    { "id": "...", "name": "..." }
  ],
  "total": 100,
  "limit": 10,
  "offset": 0,
  "has_more": true
}
```

**Impact:**
- Service functions call `response.data.items` → undefined (no error, just returns undefined)
- React Query receives undefined → table renders empty
- Repeated failures cause error state → navigation hangs
- Cache becomes invalid → requires refresh

#### Backend Requirements

To fix properly, backend should support:
1. **Pagination**: Return paginated response format with `items`, `total`, `limit`, `offset`, `has_more`
2. **Search**: Accept `search`, `email`, `name`, `resource` query parameters
3. **Filtration**: Accept `status`, `tenant_id` query parameters
4. **Sorting**: Accept `sort_by`, `sort_order` query parameters

**Temporary Frontend Fix**: Normalize responses in service layer (Option A - always normalize)

#### Specific API Discrepancies

| Endpoint | API Returns | Frontend Expects | Solution |
|----------|-------------|-----------------|----------|
| GET /api/v1/users | `UserResponse[]` | `{ items, total }` | Normalize in service |
| GET /api/v1/roles | `RoleResponse[]` | `{ items, total }` | Normalize in service |
| GET /api/v1/permissions | `PermissionResponse[]` | `{ items, total }` | Normalize in service |
| GET /api/v1/tenants | `TenantResponse[]` | `{ items, total }` | Normalize in service |
| GET /api/v1/users/{id}/roles | `RoleResponse[]` | `{ roles: [] }` | Wrap in object |

---

## 2. Security Audit

### 2.1 HIGH Priority Issues

#### Issue #1: SSO Domain Validation Vulnerability
**File**: `src/features/auth/pages/SSORedirectPage.tsx:29-35`

```typescript
// VULNERABLE CODE:
const isAllowed = allowedDomains.some(domain => {
  if (domain.startsWith('*.')) {
    const baseDomain = domain.substring(2)
    return redirectUri.endsWith(baseDomain) || redirectUri.includes(`.${baseDomain}`)
  }
  return redirectUri.includes(domain)  // <-- Substring matching!
})
```

**Problem**: Uses substring matching instead of proper URL/domain parsing.
- For `*.example.com`, would accept `notexample.com`
- Would accept `evil.site/redirect?url=.example.com`

**Risk**: Open redirect vulnerability, phishing attacks.

**Fix**: Use URL API for proper domain extraction and comparison.

#### Issue #2: TwoFactorPage Token Storage Race Condition
**File**: `src/features/auth/pages/TwoFactorPage.tsx:44-56`

```typescript
// PROBLEMATIC CODE:
// Lines 44-54: Manual sessionStorage writes
sessionStorage.setItem('craftcrew_access_token', tokenResponse.access_token)
// ... more manual storage ...

// Line 56: Then calls authStore which overwrites
await login(email, data.code)
```

**Problem**: Manual token storage followed by `login()` creates race condition.

**Risk**: Inconsistent auth state, potential token leakage.

**Fix**: Remove manual storage, use authStore exclusively.

### 2.2 MEDIUM Priority Issues

#### Issue #3: SSO Sessions Grow Unbounded
**File**: `src/features/auth/pages/SSORedirectPage.tsx:55-57`

```typescript
const activeSessions = JSON.parse(sessionStorage.getItem('active_sso_sessions') || '[]')
activeSessions.push(sessionId)
// No cleanup!
```

**Fix**: Add timestamp-based cleanup (remove sessions older than 30 minutes).

#### Issue #4: No Client-Side Rate Limiting
**Files**: `LoginPage.tsx`, `ForgotPasswordPage.tsx`

No exponential backoff on failed attempts.

**Fix**: Add client-side rate limiting with exponential backoff.

### 2.3 Security Issues Already Fixed

The following issues from `tech-enhancements.md` are **NOT present** in the codebase:

| Claimed Issue | Actual Status |
|--------------|---------------|
| `Math.random()` for session IDs | Uses `crypto.randomUUID()` |
| Missing PKCE state validation | Implemented in CallbackPage |
| Raw `fetch()` instead of apiClient | Uses `apiClient` |

---

## 3. API Integration Status

### 3.1 Services Layer (90% Complete - CRITICAL PARSING BUGS)

| Service | Functions | Issues |
|---------|-----------|---------|
| `users.ts` | listUsers, listUsersPaginated, createUser, getUser, updateUser, getUserRoles | listUsersPaginated expects paginated, API returns array. getUserRoles expects `{roles: []}`, API returns array. |
| `roles.ts` | Full CRUD + hierarchy, permissions, assignments, bulk operations | listRolesPaginated expects paginated, API returns array. |
| `permissions.ts` | Full CRUD + grouped permissions | listPermissionsPaginated expects paginated, API returns array. |
| `tenants.ts` | Full CRUD + suspend/activate | listTenantsPaginated expects paginated, API returns array. |
| `audit.ts` | log, verify, query | - |
| `revocation.ts` | token, user, session revocation | - |

**CRITICAL**: All paginated list functions need response normalization.

### 3.2 Backend API Documentation

Based on OpenAPI spec at `http://172.174.47.198:8007/openapi.json`:

**Users Endpoint:**
- `GET /api/v1/users` - Returns `UserResponse[]`, supports `limit`, `offset`, `email`, `name`, `sort_by`, `sort_order`
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/{principal_id}` - Update user
- `DELETE /api/v1/users/{principal_id}` - Delete user (exists but not used by frontend)
- `GET /api/v1/users/{principal_id}/roles` - Returns `RoleResponse[]`

**Roles Endpoint:**
- `GET /api/v1/roles` - Returns `RoleResponse[]`, no query params
- Full CRUD available
- Permissions management: `/roles/{id}/permissions`
- User assignments: `/roles/{id}/assignments`

**Permissions Endpoint:**
- `GET /api/v1/permissions` - Returns `PermissionResponse[]`, supports `resource` param
- Full CRUD available (includes PATCH for updates)
- Bulk create: `POST /api/v1/permissions/bulk`
- Roles with permission: `GET /api/v1/permissions/{id}/roles`

**Tenants Endpoint:**
- `GET /api/v1/tenants` - Returns `TenantResponse[]`, supports `status`, `limit`, `offset`
- Full CRUD available
- Suspend/Activate: `/tenants/{id}/suspend`, `/tenants/{id}/activate`

**Missing Frontend Support:**
- DELETE /api/v1/users/{principal_id} - Use exists, frontend doesn't use it
- PATCH /api/v1/permissions/{permission_id} - Update exists, frontend doesn't use it
- POST /api/v1/permissions/bulk - Bulk create exists, frontend doesn't use it
- GET /api/v1/permissions/{permission_id}/roles - Get roles with permission

### 3.2 React Query Hooks (95% Complete)

| Hook | Status | Missing |
|------|--------|---------|
| useUsers | Partial | `useDeleteUser` |
| useRoles | Complete | - |
| usePermissions | Complete | - |
| useTenants | Complete | - |
| useProfile | Complete | - |
| useAudit | Complete | - |
| useRevocation | Complete | - |

---

## 4. Stubbed Actions Summary

### Actions with `console.log()` Placeholders

| Page | Action | Line | Priority |
|------|--------|------|----------|
| UsersPage | Delete User | 233 | High |
| UsersPage | View Roles | 96 | Medium |
| UsersPage | Bulk Delete | 246 | Low |
| RolesPage | View Permissions | 83 | Medium |
| RolesPage | View Users | 87 | Medium |
| RolesPage | Bulk Delete | 251 | Low |
| PermissionsPage | Edit | 78 | Remove (not supported) |
| PermissionsPage | Bulk Delete | 237 | Low |
| TenantsPage | Bulk Delete | 309 | Low |

---

## 5. Missing UI Components

| Component | Purpose | Hooks Available |
|-----------|---------|-----------------|
| UserRolesModal | View/manage user's roles | `useUserRoles`, `useAssignRoleToUser`, `useRevokeRoleFromUser` |
| RolePermissionsModal | View/manage role permissions | `useRolePermissions`, `useGrantPermissionToRole`, `useRevokePermissionFromRole` |
| RoleUsersModal | View users assigned to role | `useRoleWithPermissions` |
| AuditLogsPage | View audit trail | `useQueryAudit` |

---

## 6. Next Steps

### Immediate (Critical API Fixes - Backend)
1. **Implement proper pagination** for /users, /roles, /permissions, /tenants endpoints
   - Return `{ items, total, limit, offset, has_more }` format
   - Add `search` parameter for text search
   - Add `status` parameter for filtering
   - Add `sort_by` and `sort_order` for sorting

### Immediate (Critical API Fixes - Frontend)
2. **Normalize API responses** in service layer (Option A - always normalize)
   - `listUsersPaginated` - Convert array to paginated format
   - `listRolesPaginated` - Convert array to paginated format
   - `listPermissionsPaginated` - Convert array to paginated format
   - `listTenantsPaginated` - Convert array to paginated format
   - `getUserRoles` - Wrap array in `{ roles: [] }`

3. **Add console logging** to tenants paginated hook to debug issue before fixing

### Immediate (UI Fixes)
4. **Fix first column color** - Remove `bg-background` from pinned variants
5. **Enable column resizing** - Set `enableColumnResizing = true` by default
6. **Reorganize columns** - Logical ordering across all admin pages
7. **Add column sizes** - Logical widths based on content
8. **Enhanced table styling** - Better headers, row states, dark mode support
9. **Responsive tables** - Mobile-friendly with proper min-widths

### Immediate (Security)
10. Fix SSO domain validation with proper URL parsing
11. Fix TwoFactorPage token storage duplication
12. Add SSO session cleanup

### Short-term (Functionality)
13. Add `useDeleteUser` hook and wire to mutation
14. Create UserRolesModal
15. Create RolePermissionsModal
16. Create RoleUsersModal
17. Remove Edit button from PermissionsPage (API doesn't support updates)
18. Implement missing API integrations:
    - Delete user endpoint
    - Update permission endpoint
    - Bulk create permissions

### Medium-term (Polish)
19. Implement bulk delete operations
20. Add client-side rate limiting
21. Create AuditLogsPage
22. Optimize query caching and invalidation strategy

---

## 7. Code Quality Notes

### Positive Patterns
- Consistent use of React Query for data fetching
- Good TypeScript typing throughout
- Proper separation of concerns (services/hooks/components)
- Accessible UI with ARIA labels
- Consistent error handling patterns

### Areas for Improvement
- Some components have large render functions (could extract sub-components)
- Magic strings for query keys (could use constants)
- Some duplicate code in admin pages (could create shared table config)

---

## Appendix: Files Reviewed

- `src/features/admin/pages/AdminDashboard.tsx`
- `src/features/admin/pages/UsersPage.tsx`
- `src/features/admin/pages/RolesPage.tsx`
- `src/features/admin/pages/PermissionsPage.tsx`
- `src/features/admin/pages/TenantsPage.tsx`
- `src/features/auth/pages/SSORedirectPage.tsx`
- `src/features/auth/pages/TwoFactorPage.tsx`
- `src/features/auth/pages/CallbackPage.tsx`
- `src/hooks/useUsers.ts`
- `src/hooks/useRoles.ts`
- `src/hooks/usePermissions.ts`
- `src/hooks/useTenants.ts`
- `src/services/api/users.ts`
- `src/services/api/roles.ts`
- `src/services/api/client.ts`
- `src/stores/authStore.ts`
