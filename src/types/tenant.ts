/**
 * Tenant Management Types
 * Based on OpenAPI spec at /api/v1/tenants
 */

/**
 * Request for POST /api/v1/tenants
 */
export interface TenantCreate {
  name: string
  slug: string
  description: string | null
  entitlements: Record<string, unknown> | null
  settings: Record<string, unknown> | null
}

/**
 * Request for PATCH /api/v1/tenants/{tenant_id}
 */
export interface TenantUpdate {
  name: string | null
  description: string | null
  entitlements: Record<string, unknown> | null
  settings: Record<string, unknown> | null
}

/**
 * Full tenant response
 */
export interface TenantResponse {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly status: string
  readonly description: string | null
  readonly entitlements: Record<string, unknown>
  readonly settings: Record<string, unknown>
  readonly created_at: string
  readonly updated_at: string | null
}

/**
 * List tenants query params
 */
export interface ListTenantsParams {
  limit?: number
  offset?: number
  search?: string | null
  status?: 'active' | 'suspended' | 'pending_deletion' | null
  sort_by?: 'name' | 'slug' | 'created_at' | 'status'
  sort_order?: 'asc' | 'desc'
}
