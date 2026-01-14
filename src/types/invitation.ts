/**
 * Invitation Types
 * Based on OpenAPI spec at http://172.174.47.198:8007/openapi.json
 */

/**
 * Request for POST /api/v1/invitations
 */
export interface InvitationCreate {
  email?: string | null
  role_id: string
  app_ids?: string[] | null
  is_tenant_wide?: boolean
  grant_reason?: string | null
  expires_in_days?: number
}

/**
 * Response for GET /api/v1/invitations/{invitation_id} or POST /api/v1/invitations
 */
export interface InvitationResponse {
  readonly id: string
  readonly tenant_id: string
  readonly code: string
  readonly email: string | null
  readonly role_id: string
  readonly role_name: string | null
  readonly app_ids: string[] | null
  readonly is_tenant_wide: boolean
  readonly grant_reason: string | null
  readonly status: string
  readonly expires_at: string
  readonly created_by: string
  readonly created_at: string
  readonly accepted_at: string | null
  readonly accepted_by: string | null
}

/**
 * Response for GET /api/v1/invitations (paginated)
 */
export interface PaginatedInvitationsResponse {
  readonly items: InvitationResponse[]
  readonly total: number
  readonly limit: number
  readonly offset: number
  readonly has_more: boolean
}

/**
 * List invitations query params
 */
export interface ListInvitationsParams {
  limit?: number
  offset?: number
  status?: 'pending' | 'accepted' | 'expired' | 'revoked' | null
}

/**
 * Response for POST /api/v1/invitations/validate
 */
export interface InvitationValidateResponse {
  readonly valid: boolean
  readonly invitation: InvitationResponse | null
  readonly message: string
}
