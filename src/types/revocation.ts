/**
 * Token Revocation Types
 * Based on OpenAPI spec at /api/v1/revocation
 */

/**
 * Request for POST /api/v1/revocation/token
 */
export interface TokenRevokeRequest {
  token_or_jti: string
  reason?: string
  expires_in?: number
  user_id?: string | null
}

/**
 * Response for revocation endpoints
 */
export interface RevocationResponse {
  readonly success: boolean
  readonly message: string
  readonly revoked_key: string
}

/**
 * Request for POST /api/v1/revocation/user
 */
export interface UserRevokeRequest {
  user_id: string
  reason?: string
  expires_in?: number
}

/**
 * Request for POST /api/v1/revocation/session
 */
export interface SessionRevokeRequest {
  session_id: string
  user_id?: string | null
  reason?: string
  expires_in?: number
}

/**
 * Request for POST /api/v1/revocation/check
 */
export interface RevocationCheckRequest {
  token_or_jti: string
}

/**
 * Response for POST /api/v1/revocation/check
 */
export interface RevocationCheckResponse {
  readonly is_revoked: boolean
  readonly reason?: string
  readonly revoked_at?: string
}
