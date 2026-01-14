import { apiClient } from './client'
import type {
  TenantResponse,
  TenantCreate,
  TenantUpdate,
  ListTenantsParams,
} from '@/types/tenant'
import type { PaginationParams, PaginatedResponse } from '@/types/pagination'
import { normalizePaginatedResponse } from './normalize'

export async function listTenants(params?: ListTenantsParams): Promise<TenantResponse[]> {
  const response = await apiClient.get('/api/v1/tenants', {
    params,
  })
  return normalizePaginatedResponse<TenantResponse>(response.data, params).items
}

export async function listTenantsPaginated(
  params?: ListTenantsParams & PaginationParams,
): Promise<PaginatedResponse<TenantResponse>> {
  const response = await apiClient.get('/api/v1/tenants', { params })

  return normalizePaginatedResponse<TenantResponse>(response.data, params)
}

export async function getTenant(tenantId: string): Promise<TenantResponse> {
  const response = await apiClient.get<TenantResponse>(`/api/v1/tenants/${tenantId}`)
  return response.data
}

export async function createTenant(data: TenantCreate): Promise<TenantResponse> {
  const response = await apiClient.post<TenantResponse>('/api/v1/tenants', data)
  return response.data
}

export async function updateTenant(tenantId: string, data: TenantUpdate): Promise<TenantResponse> {
  const response = await apiClient.patch<TenantResponse>(`/api/v1/tenants/${tenantId}`, data)
  return response.data
}

export async function deleteTenant(tenantId: string): Promise<void> {
  await apiClient.delete(`/api/v1/tenants/${tenantId}`)
}

export async function suspendTenant(tenantId: string): Promise<TenantResponse> {
  const response = await apiClient.post<TenantResponse>(`/api/v1/tenants/${tenantId}/suspend`)
  return response.data
}

export async function activateTenant(tenantId: string): Promise<TenantResponse> {
  const response = await apiClient.post<TenantResponse>(`/api/v1/tenants/${tenantId}/activate`)
  return response.data
}
