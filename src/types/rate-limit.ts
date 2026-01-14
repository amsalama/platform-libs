/**
 * Rate Limit Types
 * Based on OpenAPI spec at http://172.174.47.198:8007/openapi.json
 */

/**
 * Request for POST /api/v1/rate-limit/check
 */
export interface RateLimitCheckRequest {
  bucket: string
  limit?: number
  window_seconds?: number
}

/**
 * Response for GET /api/v1/rate-limit/{bucket} or POST /api/v1/rate-limit/check
 */
export interface RateLimitStatusResponse {
  readonly bucket: string
  readonly allowed: boolean
  readonly remaining: number
  readonly limit: number
  readonly reset_at: number
  readonly retry_after?: number | null
}

/**
 * Request for POST /api/v1/rate-limit/reset
 */
export interface RateLimitResetRequest {
  bucket: string
}

/**
 * Response for POST /api/v1/rate-limit/reset
 */
export interface RateLimitResetResponse {
  readonly success: boolean
  readonly message: string
  readonly bucket: string
}
