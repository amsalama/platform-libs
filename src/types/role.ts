/**
 * Role & Permission Types
 * Based on OpenAPI spec at http://172.174.47.198:8007/openapi.json
 */

/**
 * Request for POST /api/v1/roles
 */
export interface RoleCreate {
  name: string
  description?: string | null
  is_system?: boolean
}

/**
 * Request for PATCH /api/v1/roles/{role_id}
 */
export interface RoleUpdate {
  name?: string | null
  description?: string | null
}

/**
 * Full role response
 */
export interface RoleResponse {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly is_system: boolean
  readonly status: string
  readonly tenant_id: string
  readonly created_at: string
  readonly updated_at: string | null
  readonly deleted_at?: string | null
  readonly deleted_by?: string | null
  // Optional - populated when include_permissions=true
  readonly permissions?: PermissionResponse[]
  readonly permission_count?: number
}

/**
 * Response for GET /api/v1/roles/hierarchy
 */
export interface RoleHierarchyNode {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly is_system: boolean
  readonly depth: number
  readonly children: RoleHierarchyNode[]
}

/**
 * Response for GET /api/v1/roles/{role_id}/with-permissions
 */
export interface RoleWithPermissionsResponse {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly is_system: boolean
  readonly status: string
  readonly tenant_id: string
  readonly created_at: string
  readonly updated_at: string | null
  readonly deleted_at?: string | null
  readonly deleted_by?: string | null
  readonly permissions: PermissionResponse[]
  readonly permission_count: number
}

/**
 * Request for POST /api/v1/roles/{role_id}/permissions/bulk
 */
export interface BulkPermissionGrantRequest {
  permission_ids: string[]
}

/**
 * Response for POST /api/v1/roles/{role_id}/permissions/bulk
 */
export interface BulkPermissionGrantResponse {
  readonly granted: number
  readonly skipped: number
  readonly errors?: string[]
}

/**
 * Permission info (lightweight)
 */
export interface PermissionInfo {
  permission_key: string
}

/**
 * Full permission response
 */
export interface PermissionResponse {
  readonly id: string
  readonly permission_key: string
  readonly description: string | null
  readonly status: string
  readonly risk_level: string
  readonly is_system: boolean
  readonly is_assignable: boolean
  readonly introduced_in_version?: string
  readonly created_at: string
  readonly updated_at: string | null
}

/**
 * Request for POST /api/v1/permissions
 */
export interface PermissionCreate {
  permission_key: string
  description?: string | null
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH'
  is_assignable?: boolean
  tenant_id?: string | null
}

/**
 * Request for PATCH /api/v1/permissions/{permission_id}
 */
export interface PermissionUpdate {
  description?: string | null
  status?: 'ACTIVE' | 'DEPRECATED' | 'DISABLED'
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH'
  is_assignable?: boolean
}

/**
 * Response for GET /api/v1/permissions/groups
 */
export interface PermissionGroupResponse {
  readonly namespace: string
  readonly permissions: PermissionResponse[]
  readonly count: number
}

/**
 * Response for GET /api/v1/permissions/{permission_id}/roles
 */
export interface PermissionRolesResponse {
  readonly permission_id: string
  readonly permission_key: string
  readonly role_count: number
  readonly roles: RoleResponse[]
}

/**
 * List permissions query params
 */
export interface ListPermissionsParams {
  limit?: number
  offset?: number
  permission_key?: string | null
  namespace?: string | null
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | null
  is_system?: boolean | null
  status?: 'ACTIVE' | 'DEPRECATED' | 'DISABLED' | null
  sort_by?: 'permission_key' | 'created_at' | 'risk_level'
  sort_order?: 'asc' | 'desc'
  tenant_id?: string | null
}

/**
 * Bulk permission create request
 */
export interface BulkPermissionCreateRequest {
  permissions: PermissionCreate[]
}

/**
 * Bulk permission create response
 */
export interface BulkPermissionCreateResponse {
  readonly created: number
  readonly skipped: number
  readonly errors?: string[]
  readonly permissions?: PermissionResponse[]
}

/**
 * User-role assignment response (renamed from UserRoleResponse)
 */
export interface RoleAssignmentResponse {
  readonly principal_id: string
  readonly role_id: string
  readonly tenant_id: string
  readonly grant_tenant_id?: string | null
  readonly app_id?: string | null
  readonly is_tenant_wide: boolean
  readonly grant_reason?: string | null
  readonly granted_at: string
  readonly granted_by?: string | null
  readonly expires_at: string | null
}

/**
 * Assign role to user request (renamed from UserRoleAssign)
 */
export interface RoleAssignmentCreate {
  principal_id: string
  app_id?: string | null
  is_tenant_wide?: boolean
  grant_reason?: string | null
  expires_at?: string | null
}

/**
 * List roles query params
 */
export interface ListRolesParams {
  limit?: number
  offset?: number
  search?: string | null
  name?: string | null
  is_system?: boolean | null
  sort_by?: 'name' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  tenant_id?: string | null
  include_permissions?: boolean
}

/**
 * ACL response
 */
export interface ACLResponse {
  id: string
  tenant_id: string
  resource_type: string
  resource_id: string
  subject_type: 'principal' | 'role' | 'group'
  subject_id: string
  permission_key: string
  effect: 'ALLOW' | 'DENY'
  priority: number
  reason: string | null
  created_at: string
  expires_at: string | null
}

/**
 * Create ACL request
 */
export interface ACLCreate {
  resource_type: string
  resource_id: string
  subject_type: 'principal' | 'role' | 'group'
  subject_id: string
  permission_key: string
  effect: 'ALLOW' | 'DENY'
  priority?: number
  reason?: string
  expires_at?: string
}

/**
 * Role hierarchy create request
 */
export interface RoleHierarchyCreate {
  parent_role_id: string
  child_role_id: string
}
