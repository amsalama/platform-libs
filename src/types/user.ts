import type { RoleResponse } from './role'

/**
 * User Management Types
 * Based on OpenAPI spec at http://172.174.47.198:8007/openapi.json
 */

/**
 * Request for POST /api/v1/users
 */
export interface UserCreate {
  email: string
  username?: string | null
  password?: string | null
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  idp_issuer?: string | null
  idp_subject?: string | null
  role_id?: string | null
}

/**
 * Request for PATCH /api/v1/users/{principal_id}
 */
export interface UserUpdate {
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  enabled?: boolean | null
}

/**
 * Response from POST /api/v1/users or PATCH /api/v1/users/{principal_id}
 * Note: roles is RoleResponse[] from role.ts
 */
export interface UserDetailResponse {
  readonly principal_id: string
  readonly email: string | null
  readonly name: string | null
  readonly idp_issuer: string
  readonly idp_subject: string
  readonly created_at: string
  readonly last_seen_at: string | null
  readonly roles: RoleResponse[]
  readonly tenant_ids: string[]
}

/**
 * Response from GET /api/v1/users (paginated)
 */
export interface PaginatedUsersResponse {
  readonly items: UserResponse[]
  readonly total: number
  readonly limit: number
  readonly offset: number
  readonly has_more: boolean
}

/**
 * Full user response from backend
 */
export interface UserResponse {
  readonly principal_id: string
  readonly email: string | null
  readonly name: string | null
  readonly idp_issuer: string
  readonly idp_subject: string
  readonly created_at: string
  readonly last_seen_at: string | null
}

/**
 * User role info
 */
export interface UserRole {
  readonly id: string
  readonly name: string
  readonly tenant_id: string
}

/**
 * List users query params
 */
export interface ListUsersParams {
  limit?: number
  offset?: number
  search?: string | null
  email?: string | null
  name?: string | null
  sort_by?: 'email' | 'name' | 'created_at' | 'last_seen_at'
  sort_order?: 'asc' | 'desc'
  tenant_id?: string | null
}

/**
 * Get user by principal ID response
 */
export interface GetUserResponse {
  readonly principal_id: string
  readonly email: string | null
  readonly name: string | null
  readonly idp_issuer: string
  readonly idp_subject: string
  readonly created_at: string
  readonly last_seen_at: string | null
}

/**
 * Get user roles response
 */
export interface UserRolesResponse {
  readonly principal_id: string
  readonly roles: RoleResponse[]
  readonly count: number
}

/**
 * User display info for tables
 */
export interface UserDisplayInfo {
  readonly principal_id: string
  readonly email: string
  readonly name?: string
  readonly idp_issuer: string
  readonly idp_subject: string
  readonly created_at: string
  readonly last_seen_at?: string
}
