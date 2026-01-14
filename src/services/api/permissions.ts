import { apiClient } from './client'
import type {
  PermissionResponse,
  PermissionCreate,
  PermissionUpdate,
  PermissionGroupResponse,
  PermissionRolesResponse,
  BulkPermissionCreateRequest,
  BulkPermissionCreateResponse,
  ListPermissionsParams,
} from '@/types/role'
import type { PaginatedResponse } from '@/types/pagination'
import { normalizePaginatedResponse } from './normalize'

export async function listPermissions(
  params?: ListPermissionsParams,
): Promise<PermissionResponse[]> {
  const response = await apiClient.get('/api/v1/permissions', {
    params,
  })
  return normalizePaginatedResponse<PermissionResponse>(response.data, params).items
}

export async function listPermissionsPaginated(
  params?: ListPermissionsParams,
): Promise<PaginatedResponse<PermissionResponse>> {
  const response = await apiClient.get('/api/v1/permissions', { params })

  return normalizePaginatedResponse<PermissionResponse>(response.data, params)
}

export async function getPermission(permissionId: string, tenantId?: string): Promise<PermissionResponse> {
  const response = await apiClient.get<PermissionResponse>(`/api/v1/permissions/${permissionId}`, {
    params: tenantId ? { tenant_id: tenantId } : undefined,
  })
  return response.data
}

export async function createPermission(data: PermissionCreate, tenantId?: string): Promise<PermissionResponse> {
  const response = await apiClient.post<PermissionResponse>('/api/v1/permissions', data, {
    params: tenantId ? { tenant_id: tenantId } : undefined,
  })
  return response.data
}

export async function updatePermission(
  permissionId: string,
  data: PermissionUpdate,
  tenantId?: string,
): Promise<PermissionResponse> {
  const response = await apiClient.patch<PermissionResponse>(
    `/api/v1/permissions/${permissionId}`,
    data,
    { params: tenantId ? { tenant_id: tenantId } : undefined },
  )
  return response.data
}

export async function deletePermission(permissionId: string, force?: boolean, tenantId?: string): Promise<void> {
  await apiClient.delete(`/api/v1/permissions/${permissionId}`, {
    params: { ...(force ? { force } : {}), ...(tenantId ? { tenant_id: tenantId } : {}) },
  })
}

export async function getPermissionsGrouped(): Promise<PermissionGroupResponse[]> {
  const response = await apiClient.get<PermissionGroupResponse[]>('/api/v1/permissions/groups')
  return response.data
}

export async function getPermissionRoles(permissionId: string, tenantId?: string): Promise<PermissionRolesResponse> {
  const response = await apiClient.get<PermissionRolesResponse>(
    `/api/v1/permissions/${permissionId}/roles`,
    { params: tenantId ? { tenant_id: tenantId } : undefined },
  )
  return response.data
}

export async function bulkCreatePermissions(
  permissions: PermissionCreate[],
): Promise<BulkPermissionCreateResponse> {
  const request: BulkPermissionCreateRequest = { permissions }
  const response = await apiClient.post<BulkPermissionCreateResponse>(
    '/api/v1/permissions/bulk',
    request,
  )
  return response.data
}
