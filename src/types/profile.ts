/**
 * Profile Management Types
 * Based on OpenAPI spec at /api/v1/user/profile
 */

/**
 * Request for PATCH /api/v1/user/profile
 */
export interface ProfileUpdateRequest {
  name: string | null
}
