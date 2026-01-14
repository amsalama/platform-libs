/**
 * Audit Log Types
 * Based on OpenAPI spec at /api/v1/audit
 */

/**
 * Request for POST /api/v1/audit
 */
export interface AuditEventRequest {
  event_type: string
  resource_type: string
  resource_id: string | null
  action: string
  outcome?: string
  details?: Record<string, unknown>
}

/**
 * Response for POST /api/v1/audit
 */
export interface AuditEventResponse {
  readonly success: boolean
  readonly event_id: string
  readonly timestamp: string
  readonly message: string
}

/**
 * Request for POST /api/v1/audit/verify
 */
export interface AuditVerifyRequest {
  event_id: string
}

/**
 * Response for POST /api/v1/audit/verify
 */
export interface AuditVerifyResponse {
  readonly valid: boolean
  readonly event_id: string
  readonly message: string
  readonly verified_at: string
}

/**
 * Request for POST /api/v1/audit/query
 */
export interface AuditQueryRequest {
  tenant_id?: string | null
  principal_id?: string | null
  event_type?: string | null
  resource_type?: string | null
  start_time?: string | null
  end_time?: string | null
  limit?: number
  offset?: number
}

/**
 * Audit event info
 */
export interface AuditEventInfo {
  readonly event_id: string
  readonly event_type: string
  readonly timestamp: string
  readonly tenant_id: string | null
  readonly principal_id: string | null
  readonly resource_type: string
  readonly resource_id: string | null
  readonly action: string
  readonly outcome: string
  readonly details: Record<string, unknown>
}

/**
 * Response for POST /api/v1/audit/query
 */
export interface AuditQueryResponse {
  readonly events: AuditEventInfo[]
  readonly total: number
  readonly limit: number
  readonly offset: number
}
