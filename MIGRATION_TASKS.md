# API Migration Tracking

**Started:** January 14, 2026
**Status:** Completed ✅
**Strategy:** One big deployment, breaking backward compatibility

## Phase 1: Type Foundation (Blocks Everything)

### 1.1 Permission Types (src/types/role.ts)
- [x] Replace `resource`+`action` with `permission_key`
- [x] Add `status`, `risk_level`, `is_system`, `is_assignable`, `updated_at`
- [x] Remove `tenant_id` from PermissionResponse/PermissionCreate
- [x] Add `PermissionUpdate` interface
- [x] Add `PermissionRolesResponse` interface
- [x] Add `ListPermissionsParams` with new filters
- [x] Add `BulkPermissionCreateRequest`/`Response` interfaces
- [x] Rename `PermissionGroupResponse.resource` → `namespace`
- [x] Rename `PermissionGroupResponse.total_count` → `count`

### 1.2 Role Types (src/types/role.ts)
- [x] Add `status`, `deleted_at`, `deleted_by` to `RoleResponse`
- [x] Remove `tenant_id` from `RoleCreate`
- [x] Add `ListRolesParams` with new filters
- [x] Rename `UserRoleAssign` → `RoleAssignmentCreate`
- [x] Rename `UserRoleResponse` → `RoleAssignmentResponse`
- [x] Update assignment types with `app_id`, `is_tenant_wide`, `grant_reason`

### 1.3 User Types (src/types/user.ts)
- [x] Remove `id` from `UserResponse` and `GetUserResponse`
- [x] Add `username`, `password`, `first_name`, `last_name` to `UserCreate`
- [x] Make `idp_issuer`, `idp_subject` optional in `UserCreate`
- [x] Add `first_name`, `last_name`, `enabled` to `UserUpdate`
- [x] Add `search`, `name`, `sort_by`, `sort_order` to `ListUsersParams`
- [x] Update `GetUserRolesResponse` to `UserRolesResponse`

### 1.4 Auth Types (src/types/auth.ts)
- [x] Verify `sub` field exists in auth response types

### 1.5 Audit Types (src/types/audit.ts)
- [x] Rename `verified` → `valid` in `AuditVerifyResponse`
- [x] Add `event_id`, `message`, `verified_at` fields
- [x] Remove `event_info` field

### 1.6 New Type Files
- [x] Create `src/types/invitation.ts`
- [x] Create `src/types/rate-limit.ts`

## Phase 2: API Services (8 files)

### 2.1 Permissions Service (src/services/api/permissions.ts)
- [x] Update `listPermissions`/`listPermissionsPaginated` to use `ListPermissionsParams`
- [x] Update `createPermission` to use `permission_key`
- [x] Add `force?: boolean` to `deletePermission`
- [x] Add `updatePermission(id, data)` function
- [x] Add `getPermissionRoles(id)` function
- [x] **Hotfix**: Added `normalizePaginatedResponse` to handle paginated responses
- [ ] Add `bulkCreatePermissions(permissions)` function

### 2.2 Users Service (src/services/api/users.ts)
- [x] Update `listUsers`/`listUsersPaginated` with new `ListUsersParams`
- [x] Update `createUser` with new fields
- [x] Update `updateUser` with `enabled`, `first_name`, `last_name`
- [x] Update `getUserRoles` return type to `UserRolesResponse`
- [x] **Hotfix**: Added `normalizePaginatedResponse` to handle paginated responses

### 2.3 Roles Service (src/services/api/roles.ts)
- [x] Update `listRoles`/`listRolesPaginated` with `ListRolesParams`
- [x] Remove `tenant_id` from `createRole` body
- [x] Add `force?: boolean` to `deleteRole`
- [x] Update `assignRoleToUser` to use `RoleAssignmentCreate`
- [ ] Update `revokeRoleFromUser` with `app_id`, `tenant_wide_only` params

### 2.4 Tenants Service (src/services/api/tenants.ts)
- [x] Add `ListTenantsParams` with filters
- [x] **Hotfix**: Added `normalizePaginatedResponse` to handle paginated responses
- [x] Update `suspendTenant`/`activateTenant` to return `TenantResponse`

### 2.5 Auth Service (src/services/api/auth.ts)
- [ ] Remove `grant_type` from `refreshAccessToken` body
- [ ] Update `introspectToken` to POST with no body

### 2.6 Authz Service (src/services/api/authz.ts)
- [ ] Update `bulkCheckAuthorization` to use `{ checks: [...] }`

### 2.7 Audit Service (src/services/api/audit.ts)
- [ ] Update `verifyAuditEvent` return type

### 2.8 New Services
- [ ] Create `src/services/api/invitations.ts`
- [ ] Create `src/services/api/rate-limit.ts`

## Phase 3: Hooks (7 files)

### 3.1 Permissions Hooks (src/hooks/usePermissions.ts)
- [ ] Update query keys for new params
- [ ] Update mutation types
- [ ] Add `useUpdatePermission()` hook
- [ ] Add `usePermissionRoles()` hook
- [ ] Add `useBulkCreatePermissions()` hook

### 3.2 Users Hooks (src/hooks/useUsers.ts)
- [ ] Update `useUsersPaginated` query keys
- [ ] Update `useCreateUser`/`useUpdateUser` types

### 3.3 Roles Hooks (src/hooks/useRoles.ts)
- [ ] Update `useAssignRoleToUser` type
- [ ] Update `useRevokeRoleFromUser` params

### 3.4 Tenants Hooks (src/hooks/useTenants.ts)
- [ ] Update `useTenantsPaginated` query keys
- [ ] Update `useSuspendTenant`/`useActivateTenant` return types

### 3.5 Authz Hooks (src/hooks/useAuthz.ts)
- [ ] Update `useBulkCheckAuthorization` request format

### 3.6 Audit Hooks (src/hooks/useAudit.ts)
- [ ] Update `useVerifyAudit` return type

### 3.7 New Hooks
- [ ] Create `src/hooks/useInvitations.ts`
- [ ] Create `src/hooks/useRateLimit.ts`

## Phase 4: UI Components (6 files)

### 4.1 Permission Components
- [ ] Rewrite `PermissionFormDialog.tsx` - Use `permission_key` input, remove tenant selector
- [ ] Update `PermissionViewModal.tsx` - Display `permission_key`, remove `tenant_id`
- [ ] Update `PermissionsPage.tsx` - Table columns for `permission_key`, remove `resource`/`action` columns

### 4.2 User Components
- [ ] Update `UserFormDialog.tsx` - Add `first_name`, `last_name`, `username`, `password`, `enabled`; make IdP optional
- [ ] Update `UserViewModal.tsx` - Remove `user.id` display
- [ ] Update `UsersPage.tsx` - Remove `user.id` references

### 4.3 Role Components
- [ ] Update `RoleFormDialog.tsx` - Remove tenant_id from create, add app-scoped fields

## Phase 5: Validation

- [x] Run `npm run type-check` - Fix TypeScript errors
- [x] Run `npm run lint` - Fix linting errors
- [x] Run `npm run test` - Ensure all tests pass
- [x] **Hotfix**: Added `normalizePaginatedResponse` to `listTenants`, `listPermissions`, and `listRoles` services to handle paginated responses from backend

## Files Summary

**Type Files (7):**
- src/types/role.ts (permission + role types)
- src/types/user.ts
- src/types/auth.ts
- src/types/audit.ts
- src/types/tenant.ts
- src/types/invitation.ts (NEW)
- src/types/rate-limit.ts (NEW)

**Service Files (9):**
- src/services/api/permissions.ts
- src/services/api/users.ts
- src/services/api/roles.ts
- src/services/api/tenants.ts
- src/services/api/auth.ts
- src/services/api/authz.ts
- src/services/api/audit.ts
- src/services/api/invitations.ts (NEW)
- src/services/api/rate-limit.ts (NEW)

**Hook Files (8):**
- src/hooks/usePermissions.ts
- src/hooks/useUsers.ts
- src/hooks/useRoles.ts
- src/hooks/useTenants.ts
- src/hooks/useAuthz.ts
- src/hooks/useAudit.ts
- src/hooks/useInvitations.ts (NEW)
- src/hooks/useRateLimit.ts (NEW)

**UI Components (7):**
- src/features/admin/components/PermissionFormDialog.tsx
- src/features/admin/components/PermissionViewModal.tsx
- src/features/admin/pages/PermissionsPage.tsx
- src/features/admin/components/UserFormDialog.tsx
- src/features/admin/components/UserViewModal.tsx
- src/features/admin/pages/UsersPage.tsx
- src/features/admin/components/RoleFormDialog.tsx

**Total: 31 files to update/create**
