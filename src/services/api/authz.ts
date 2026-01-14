import { apiClient } from './client'

export interface AuthzCheckRequest {
  resource_type: string
  resource_id?: string
  action: string
  context?: Record<string, unknown>
}

export interface AuthzCheckResponse {
  allowed: boolean
  decision_type: 'ALLOW' | 'DENY' | 'ALLOW_WITH_OBLIGATIONS'
  reason_codes: string[]
  decision_id?: string
  cached: boolean
  obligations: Record<string, unknown>[]
}

export interface MyPermissionsResponse {
  principal_id: string
  tenant_id: string
  realm_roles: string[]
  roles: Array<{
    id: string
    name: string
    description: string
    is_system: boolean
  }>
  permissions: Array<{
    resource: string
    action: string
    description: string
  }>
}

export async function checkAuthorization(request: AuthzCheckRequest): Promise<AuthzCheckResponse> {
  const response = await apiClient.post<AuthzCheckResponse>('/api/v1/authz/check', request)
  return response.data
}

export async function bulkCheckAuthorization(checks: AuthzCheckRequest[]): Promise<AuthzCheckResponse[]> {
  const response = await apiClient.post<AuthzCheckResponse[]>('/api/v1/authz/check/bulk', { checks })
  return response.data
}

export async function getMyPermissions(): Promise<MyPermissionsResponse> {
  const response = await apiClient.get<MyPermissionsResponse>('/api/v1/authz/me/permissions')
  return response.data
}
