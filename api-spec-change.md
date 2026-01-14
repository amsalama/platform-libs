# API Specification Change Plan

**Date**: January 14, 2026  
**Source**: http://172.174.47.198:8007/openapi.json

## Executive Summary

The backend API has undergone significant changes requiring updates across all API service files, type definitions, and hooks. Key changes include:

- **Permissions**: Now use `permission_key` format (`namespace.resource.action`) instead of separate `resource`+`action` fields, and are globally scoped (no tenant)
- **All List Endpoints**: Now support `search`, `sort_by`, `sort_order` filtering parameters
- **User Responses**: Dropped the `id` field in favor of `principal_id` only
- **Role Assignments**: Now support app-scoped grants with `app_id`, `is_tenant_wide`, `grant_reason` fields
- **New Modules**: Invitations and Rate Limiting modules need to be created

---

## 1. Type Definition Changes

### 1.1 Permission Types (`src/types/role.ts`)

#### Current Implementation

```typescript
interface PermissionResponse {
  readonly id: string;
  readonly resource: string;
  readonly action: string;
  readonly description: string | null;
  readonly tenant_id: string;
  readonly created_at: string;
}

interface PermissionCreate {
  resource: string;
  action: string;
  description: string | null;
  tenant_id?: string;
}

interface PermissionGroupResponse {
  readonly resource: string;
  readonly permissions: PermissionResponse[];
  readonly total_count: number;
}
```

#### New Implementation Required

```typescript
interface PermissionResponse {
  readonly id: string;
  readonly permission_key: string; // REPLACES resource+action
  readonly description: string | null;
  readonly status: string; // NEW: "ACTIVE" | "DEPRECATED" | "DISABLED"
  readonly risk_level: string; // NEW: "LOW" | "MEDIUM" | "HIGH"
  readonly is_system: boolean; // NEW
  readonly is_assignable: boolean; // NEW
  readonly introduced_in_version?: string; // NEW
  readonly created_at: string;
  readonly updated_at: string | null; // NEW
  // REMOVED: tenant_id, resource, action
}

interface PermissionCreate {
  permission_key: string; // Pattern: ^[a-z]+(\.[a-z0-9_]+){2,}$
  description?: string | null;
  risk_level?: "LOW" | "MEDIUM" | "HIGH"; // NEW, default: "MEDIUM"
  is_assignable?: boolean; // NEW, default: true
  // REMOVED: resource, action, tenant_id
}

interface PermissionUpdate {
  // NEW INTERFACE
  description?: string | null;
  status?: "ACTIVE" | "DEPRECATED" | "DISABLED";
  risk_level?: "LOW" | "MEDIUM" | "HIGH";
  is_assignable?: boolean;
}

interface PermissionGroupResponse {
  readonly namespace: string; // RENAMED from resource
  readonly permissions: PermissionResponse[];
  readonly count: number; // RENAMED from total_count
}

interface PermissionRolesResponse {
  // NEW INTERFACE
  permission_id: string;
  permission_key: string;
  role_count: number;
  roles: RoleResponse[];
}

interface ListPermissionsParams {
  // NEW INTERFACE
  limit?: number;
  offset?: number;
  permission_key?: string | null;
  namespace?: string | null;
  risk_level?: "LOW" | "MEDIUM" | "HIGH" | null;
  is_system?: boolean | null;
  status?: "ACTIVE" | "DEPRECATED" | "DISABLED" | null;
  sort_by?: "permission_key" | "created_at" | "risk_level";
  sort_order?: "asc" | "desc";
}

interface BulkPermissionCreateRequest {
  // NEW INTERFACE
  permissions: PermissionCreate[];
}

interface BulkPermissionCreateResponse {
  // NEW INTERFACE
  created: number;
  skipped: number;
  errors?: string[];
  permissions?: PermissionResponse[];
}
```

### 1.2 User Types (`src/types/user.ts`)

#### Current Implementation

```typescript
interface UserResponse {
  id: string;
  principal_id: string;
  email: string | null;
  name: string | null;
  idp_issuer: string;
  idp_subject: string;
  created_at: string;
  last_seen_at: string | null;
}

interface UserCreate {
  email: string;
  name: string | null;
  idp_issuer: string;
  idp_subject: string;
  role_id: string | null;
  tenant_id?: string;
}

interface UserUpdate {
  email: string | null;
  name: string | null;
}

interface ListUsersParams {
  limit?: number;
  offset?: number;
  email?: string;
}
```

#### New Implementation Required

```typescript
interface UserResponse {
  principal_id: string; // UUID
  email: string | null;
  name: string | null;
  idp_issuer: string;
  idp_subject: string;
  created_at: string;
  last_seen_at: string | null;
  // REMOVED: id
}

interface UserDetailResponse extends UserResponse {
  roles: RoleResponse[];
  tenant_ids: string[];
}

interface UserCreate {
  email: string;
  username?: string | null; // NEW: 3-50 chars
  password?: string | null; // NEW: 8-128 chars
  first_name?: string | null; // NEW: max 100
  last_name?: string | null; // NEW: max 100
  name?: string | null;
  idp_issuer?: string | null; // NOW OPTIONAL
  idp_subject?: string | null; // NOW OPTIONAL
  role_id?: string | null;
}

interface UserUpdate {
  email?: string | null;
  first_name?: string | null; // NEW
  last_name?: string | null; // NEW
  name?: string | null;
  enabled?: boolean | null; // NEW: Enable/disable account
}

interface ListUsersParams {
  limit?: number;
  offset?: number;
  search?: string | null; // NEW: Full-text search
  email?: string | null;
  name?: string | null; // NEW
  sort_by?: "email" | "name" | "created_at" | "last_seen_at"; // NEW
  sort_order?: "asc" | "desc"; // NEW
  tenant_id?: string | null;
}

interface UserRolesResponse {
  // NEW INTERFACE
  principal_id: string;
  roles: RoleResponse[];
  count: number;
}
```

### 1.3 Role Types (`src/types/role.ts`)

#### Current Implementation

```typescript
interface RoleResponse {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly is_system: boolean;
  readonly tenant_id: string;
  readonly created_at: string;
  readonly updated_at: string | null;
}

interface RoleCreate {
  name: string;
  description: string | null;
  is_system?: boolean;
  tenant_id?: string;
}

interface UserRoleAssign {
  principal_id: string;
  role_id: string;
  expires_at?: string;
}

interface UserRoleResponse {
  principal_id: string;
  role_id: string;
  tenant_id: string;
  assigned_at: string;
  expires_at: string | null;
}
```

#### New Implementation Required

```typescript
interface RoleResponse {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly is_system: boolean;
  readonly status: string; // NEW: default "active"
  readonly tenant_id: string;
  readonly created_at: string;
  readonly updated_at: string | null;
  readonly deleted_at?: string | null; // NEW: Soft delete timestamp
  readonly deleted_by?: string | null; // NEW: Who deleted
}

interface RoleCreate {
  name: string;
  description?: string | null;
  is_system?: boolean;
  // REMOVED: tenant_id (taken from auth context)
}

interface RoleUpdate {
  name?: string | null;
  description?: string | null;
}

interface RoleAssignmentCreate {
  // RENAMED from UserRoleAssign
  principal_id: string;
  app_id?: string | null; // NEW: App-scoped grant
  is_tenant_wide?: boolean; // NEW: default false
  grant_reason?: string | null; // NEW: Required if is_tenant_wide=true
  expires_at?: string | null;
  // REMOVED: role_id (comes from URL path)
}

interface RoleAssignmentResponse {
  // RENAMED from UserRoleResponse
  principal_id: string;
  role_id: string;
  tenant_id: string;
  grant_tenant_id?: string | null; // NEW: Cross-tenant MSP model
  app_id?: string | null; // NEW
  is_tenant_wide: boolean; // NEW
  grant_reason?: string | null; // NEW
  granted_at: string; // RENAMED from assigned_at
  granted_by?: string | null; // NEW
  expires_at: string | null;
}

interface ListRolesParams {
  // NEW INTERFACE
  limit?: number;
  offset?: number;
  search?: string | null;
  name?: string | null;
  is_system?: boolean | null;
  sort_by?: "name" | "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
  tenant_id?: string | null;
  include_permissions?: boolean;
}
```

### 1.4 Tenant Types (`src/types/tenant.ts`)

#### New Interface Required

```typescript
interface ListTenantsParams {
  // NEW INTERFACE
  limit?: number;
  offset?: number;
  search?: string | null;
  status?: "active" | "suspended" | "pending_deletion" | null;
  sort_by?: "name" | "slug" | "created_at" | "status";
  sort_order?: "asc" | "desc";
}
```

### 1.5 New Type Files Required

#### `src/types/invitation.ts` (NEW FILE)

```typescript
export interface InvitationCreate {
  email?: string | null;
  role_id: string;
  app_ids?: string[] | null;
  is_tenant_wide?: boolean;
  grant_reason?: string | null;
  expires_in_days?: number;
}

export interface InvitationResponse {
  id: string;
  tenant_id: string;
  code: string;
  email: string | null;
  role_id: string;
  role_name: string | null;
  app_ids: string[] | null;
  is_tenant_wide: boolean;
  grant_reason: string | null;
  status: string;
  expires_at: string;
  created_by: string;
  created_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
}

export interface PaginatedInvitationsResponse {
  items: InvitationResponse[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ListInvitationsParams {
  limit?: number;
  offset?: number;
  status?: "pending" | "accepted" | "expired" | "revoked" | null;
}
```

#### `src/types/rate-limit.ts` (NEW FILE)

```typescript
export interface RateLimitCheckRequest {
  bucket: string;
  limit?: number;
  window_seconds?: number;
}

export interface RateLimitStatusResponse {
  bucket: string;
  allowed: boolean;
  remaining: number;
  limit: number;
  reset_at: number;
  retry_after?: number | null;
}

export interface RateLimitResetRequest {
  bucket: string;
}

export interface RateLimitResetResponse {
  success: boolean;
  message: string;
  bucket: string;
}
```

---

## 2. API Service Changes

### 2.1 Permissions Service (`src/services/api/permissions.ts`)

#### Functions to Modify

| Function           | Change                                               |
| ------------------ | ---------------------------------------------------- |
| `listPermissions`  | Accept `ListPermissionsParams`, remove `tenant_id`   |
| `fetchPermissions` | Accept `ListPermissionsParams`, remove `tenant_id`   |
| `createPermission` | Send `permission_key` instead of `resource`+`action` |
| `deletePermission` | Add `force?: boolean` parameter                      |

#### Functions to Add

```typescript
export async function updatePermission(
  id: string,
  data: PermissionUpdate
): Promise<PermissionResponse>;

export async function getPermissionRoles(
  id: string
): Promise<PermissionRolesResponse>;

export async function bulkCreatePermissions(
  permissions: PermissionCreate[]
): Promise<BulkPermissionCreateResponse>;
```

### 2.2 Users Service (`src/services/api/users.ts`)

#### Functions to Modify

| Function       | Change                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `listUsers`    | Accept new `ListUsersParams` with `search`, `name`, `sort_by`, `sort_order`                                                 |
| `fetchUsers`   | Accept new `ListUsersParams`                                                                                                |
| `createUser`   | Update request body to include `username`, `password`, `first_name`, `last_name`; make `idp_issuer`, `idp_subject` optional |
| `updateUser`   | Add `enabled`, `first_name`, `last_name` to request body                                                                    |
| `getUserRoles` | Return `UserRolesResponse` with `principal_id` and `count`                                                                  |

### 2.3 Roles Service (`src/services/api/roles.ts`)

#### Functions to Modify

| Function     | Change                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `listRoles`  | Accept `ListRolesParams` with `search`, `name`, `is_system`, `sort_by`, `sort_order`, `include_permissions` |
| `fetchRoles` | Accept `ListRolesParams`                                                                                    |
| `createRole` | Remove `tenant_id` from request body                                                                        |
| `deleteRole` | Add `force?: boolean` parameter                                                                             |
| `assignRole` | Use `RoleAssignmentCreate` (remove `role_id` from body, add `app_id`, `is_tenant_wide`, `grant_reason`)     |
| `revokeRole` | Add `app_id?: string` and `tenant_wide_only?: boolean` query params                                         |

### 2.4 Tenants Service (`src/services/api/tenants.ts`)

#### Functions to Modify

| Function         | Change                                                                      |
| ---------------- | --------------------------------------------------------------------------- |
| `listTenants`    | Accept `ListTenantsParams` with `search`, `status`, `sort_by`, `sort_order` |
| `fetchTenants`   | Accept `ListTenantsParams`                                                  |
| `suspendTenant`  | Return `TenantResponse` instead of `void`                                   |
| `activateTenant` | Return `TenantResponse` instead of `void`                                   |

### 2.5 Auth Service (`src/services/api/auth.ts`)

#### Functions to Modify

| Function       | Change                                                          |
| -------------- | --------------------------------------------------------------- |
| `refreshToken` | Remove `grant_type` from request body                           |
| `introspect`   | Change to POST without request body (uses Authorization header) |

#### Response Type Changes

```typescript
// Add 'sub' field to UserProfileResponse/LoginResponse
interface UserProfileResponse {
  sub: string; // NEW REQUIRED FIELD
  // ... existing fields
}
```

### 2.6 Authz Service (`src/services/api/authz.ts`)

#### Functions to Modify

| Function    | Change                                                                |
| ----------- | --------------------------------------------------------------------- |
| `bulkCheck` | Change request body from `{ requests: [...] }` to `{ checks: [...] }` |

### 2.7 Audit Service (`src/services/api/audit.ts`)

#### Response Type Changes

```typescript
// AuditVerifyResponse changes
interface AuditVerifyResponse {
  valid: boolean; // RENAMED from 'verified'
  event_id: string; // NEW
  message: string; // NEW
  verified_at: string; // NEW
  // REMOVED: event_info
}
```

### 2.8 New Service Files

#### `src/services/api/invitations.ts` (NEW FILE)

```typescript
export async function createInvitation(
  data: InvitationCreate
): Promise<InvitationResponse>;
export async function listInvitations(
  params?: ListInvitationsParams
): Promise<PaginatedInvitationsResponse>;
export async function getInvitation(id: string): Promise<InvitationResponse>;
export async function revokeInvitation(id: string): Promise<void>;
export async function validateInvitationCode(
  code: string
): Promise<InvitationResponse>;
```

#### `src/services/api/rate-limit.ts` (NEW FILE)

```typescript
export async function getRateLimitStatus(
  bucket: string
): Promise<RateLimitStatusResponse>;
export async function checkRateLimit(
  request: RateLimitCheckRequest
): Promise<RateLimitStatusResponse>;
export async function resetRateLimit(
  bucket: string
): Promise<RateLimitResetResponse>;
```

---

## 3. Hook Changes

### 3.1 Permissions Hooks (`src/hooks/usePermissions.ts`)

#### Modify Existing Hooks

- Update `usePermissions` query key to include new filter params
- Update `useCreatePermission` mutation types

#### Add New Hooks

```typescript
export function useUpdatePermission();
export function usePermissionRoles(permissionId: string);
export function useBulkCreatePermissions();
```

### 3.2 Users Hooks (`src/hooks/useUsers.ts`)

#### Modify Existing Hooks

- Update `useUsers` to accept new `ListUsersParams`
- Update query keys to include `search`, `name`, `sort_by`, `sort_order`
- Update `useCreateUser` and `useUpdateUser` mutation types

### 3.3 Roles Hooks (`src/hooks/useRoles.ts`)

#### Modify Existing Hooks

- Update `useRoles` to accept new `ListRolesParams`
- Update `useAssignRole` mutation to use `RoleAssignmentCreate` type
- Update `useRevokeRole` mutation to accept `app_id` and `tenant_wide_only` params

### 3.4 Tenants Hooks (`src/hooks/useTenants.ts`)

#### Modify Existing Hooks

- Update `useTenants` to accept new `ListTenantsParams`
- Update `useSuspendTenant` and `useActivateTenant` to return `TenantResponse`

### 3.5 New Hook Files

#### `src/hooks/useInvitations.ts` (NEW FILE)

```typescript
export function useInvitations(params?: ListInvitationsParams);
export function useInvitation(id: string);
export function useCreateInvitation();
export function useRevokeInvitation();
export function useValidateInvitationCode();
```

#### `src/hooks/useRateLimit.ts` (NEW FILE)

```typescript
export function useRateLimitStatus(bucket: string);
export function useCheckRateLimit();
export function useResetRateLimit();
```

---

## 4. Breaking Changes Summary

### 4.1 Critical (Will Cause Immediate Errors)

| Change                                                      | Impact                                 | Migration                                     |
| ----------------------------------------------------------- | -------------------------------------- | --------------------------------------------- |
| `PermissionResponse.resource` + `action` → `permission_key` | All permission display/filtering logic | Update all references to use `permission_key` |
| `PermissionCreate` schema change                            | Permission creation forms              | Update forms to use `permission_key` format   |
| `UserResponse.id` removed                                   | Any code referencing `user.id`         | Replace with `user.principal_id`              |
| Bulk authz `requests` → `checks`                            | Authorization bulk checks              | Rename property in request body               |
| `AuditVerifyResponse.verified` → `valid`                    | Audit verification logic               | Rename property references                    |
| Introspect no request body                                  | Token introspection                    | Remove body from introspect call              |

### 4.2 Medium Risk (May Cause Issues)

| Change                                           | Impact                  | Migration                  |
| ------------------------------------------------ | ----------------------- | -------------------------- |
| `UserCreate.idp_issuer/idp_subject` now optional | User creation logic     | Update validation          |
| Role assignment model overhaul                   | Role assignment UI      | Update forms and mutations |
| `PermissionGroupResponse.resource` → `namespace` | Permission grouping UI  | Rename property references |
| `PermissionGroupResponse.total_count` → `count`  | Permission display      | Rename property references |
| `UserRoleResponse.assigned_at` → `granted_at`    | Role assignment display | Rename property references |

### 4.3 Low Risk (Additive Changes)

| Change                                                     | Impact                 |
| ---------------------------------------------------------- | ---------------------- |
| New filter/sort params on list endpoints                   | Optional enhancement   |
| New `status`, `deleted_at`, `deleted_by` on `RoleResponse` | Optional UI updates    |
| New `UserRolesResponse` wrapper with `count`               | Optional UI updates    |
| Health/ready endpoints                                     | Optional health checks |

---

## 5. Implementation Order

### Phase 1: Critical Type Fixes (Blocks Everything)

1. Update `src/types/role.ts` - Permission types overhaul
2. Update `src/types/user.ts` - Remove `id`, add new fields
3. Update `src/types/auth.ts` - Add `sub` field

### Phase 2: API Service Updates

4. Rewrite `src/services/api/permissions.ts`
5. Update `src/services/api/users.ts`
6. Update `src/services/api/roles.ts`
7. Update `src/services/api/tenants.ts`
8. Update `src/services/api/auth.ts`
9. Update `src/services/api/authz.ts`
10. Update `src/services/api/audit.ts`

### Phase 3: Hook Updates

11. Update `src/hooks/usePermissions.ts`
12. Update `src/hooks/useUsers.ts`
13. Update `src/hooks/useRoles.ts`
14. Update `src/hooks/useTenants.ts`
15. Update `src/hooks/useAuthz.ts`
16. Update `src/hooks/useAudit.ts`

### Phase 4: New Modules

17. Create `src/types/invitation.ts`
18. Create `src/types/rate-limit.ts`
19. Create `src/services/api/invitations.ts`
20. Create `src/services/api/rate-limit.ts`
21. Create `src/hooks/useInvitations.ts`
22. Create `src/hooks/useRateLimit.ts`

### Phase 5: UI Component Updates

23. Update permission-related components to use `permission_key`
24. Update user-related components to use `principal_id` only
25. Update role assignment dialogs for app-scoped grants
26. Add invitation management UI
27. Add rate limiting status UI (if needed)

---

## 6. Files Requiring Changes

### Type Files

| File                      | Priority | Changes                                           |
| ------------------------- | -------- | ------------------------------------------------- |
| `src/types/role.ts`       | 🔴 HIGH  | Permission schema overhaul, role assignment types |
| `src/types/user.ts`       | 🔴 HIGH  | Remove `id`, add new fields to create/update      |
| `src/types/tenant.ts`     | 🟡 MED   | Add `ListTenantsParams`                           |
| `src/types/auth.ts`       | 🟡 MED   | Add `sub` field                                   |
| `src/types/audit.ts`      | 🟡 MED   | Update verify response                            |
| `src/types/invitation.ts` | 🟢 NEW   | Create entire file                                |
| `src/types/rate-limit.ts` | 🟢 NEW   | Create entire file                                |

### API Service Files

| File                              | Priority | Changes                            |
| --------------------------------- | -------- | ---------------------------------- |
| `src/services/api/permissions.ts` | 🔴 HIGH  | Major rewrite for `permission_key` |
| `src/services/api/users.ts`       | 🔴 HIGH  | Schema + query param updates       |
| `src/services/api/roles.ts`       | 🟡 MED   | Assignment model + query params    |
| `src/services/api/tenants.ts`     | 🟢 LOW   | Query params + return types        |
| `src/services/api/auth.ts`        | 🟡 MED   | Introspect + refresh changes       |
| `src/services/api/authz.ts`       | 🟡 MED   | Bulk check request body            |
| `src/services/api/audit.ts`       | 🟢 LOW   | Verify response                    |
| `src/services/api/invitations.ts` | 🟢 NEW   | Create entire file                 |
| `src/services/api/rate-limit.ts`  | 🟢 NEW   | Create entire file                 |

### Hook Files

| File                          | Priority | Changes                  |
| ----------------------------- | -------- | ------------------------ |
| `src/hooks/usePermissions.ts` | 🔴 HIGH  | New hooks + type changes |
| `src/hooks/useUsers.ts`       | 🟡 MED   | Query param updates      |
| `src/hooks/useRoles.ts`       | 🟡 MED   | Assignment updates       |
| `src/hooks/useTenants.ts`     | 🟢 LOW   | Query param updates      |
| `src/hooks/useAuthz.ts`       | 🟡 MED   | Bulk check fix           |
| `src/hooks/useAudit.ts`       | 🟢 LOW   | Verify type update       |
| `src/hooks/useInvitations.ts` | 🟢 NEW   | Create entire file       |
| `src/hooks/useRateLimit.ts`   | 🟢 NEW   | Create entire file       |

---

## 7. Considerations

1. **Permission key migration**: update all UI components atomically

2. **App-scoped role assignments**: the new `app_id`, `is_tenant_wide`, `grant_reason` fields should be added to the existing `RoleFormDialog.tsx`

3. **User `id` removal**: perform a full search-and-replace across all components

4. **Soft-delete handling**: The new `deleted_at`/`deleted_by` fields on roles suggest soft-delete support. we filter these out by default, add a filteration option to get deleted roles, and show them with a "deleted" badge
