import { apiClient } from './client'
import type {
  AuditEventRequest,
  AuditEventResponse,
  AuditVerifyRequest,
  AuditVerifyResponse,
  AuditQueryRequest,
  AuditQueryResponse,
} from '@/types/audit'

export async function logAuditEvent(data: AuditEventRequest): Promise<AuditEventResponse> {
  const response = await apiClient.post<AuditEventResponse>('/api/v1/audit', data)
  return response.data
}

export async function verifyAuditEvent(data: AuditVerifyRequest): Promise<AuditVerifyResponse> {
  const response = await apiClient.post<AuditVerifyResponse>('/api/v1/audit/verify', data)
  return response.data
}

export async function queryAuditEvents(data: AuditQueryRequest): Promise<AuditQueryResponse> {
  const response = await apiClient.post<AuditQueryResponse>('/api/v1/audit/query', data)
  return response.data
}
