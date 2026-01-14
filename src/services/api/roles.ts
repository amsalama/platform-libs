import { apiClient } from './client'
import type {
  RoleResponse,
  RoleCreate,
  RoleHierarchyNode,
  RoleWithPermissionsResponse,
  BulkPermissionGrantRequest,
  BulkPermissionGrantResponse,
  PermissionResponse,
  RoleAssignmentCreate,
  RoleAssignmentResponse,
  ListRolesParams,
} from '@/types/role'
import type { PaginationParams, PaginatedResponse } from '@/types/pagination'
import { normalizePaginatedResponse } from './normalize'

export async function listRoles(params?: ListRolesParams): Promise<RoleResponse[]> {
  const response = await apiClient.get('/api/v1/roles', {
    params,
  })
  return normalizePaginatedResponse<RoleResponse>(response.data, params).items
}

export async function listRolesPaginated(
  params?: ListRolesParams & PaginationParams,
): Promise<PaginatedResponse<RoleResponse>> {
  const response = await apiClient.get('/api/v1/roles', { params })

  return normalizePaginatedResponse<RoleResponse>(response.data, params)
}

export async function getRole(roleId: string, tenantId?: string): Promise<RoleResponse> {
  const response = await apiClient.get<RoleResponse>(`/api/v1/roles/${roleId}`, {
    params: tenantId ? { tenant_id: tenantId } : undefined,
  })
  return response.data
}

export async function createRole(data: RoleCreate, tenantId?: string): Promise<RoleResponse> {
  const response = await apiClient.post<RoleResponse>('/api/v1/roles', {
    ...data,
    ...(tenantId ? { tenant_id: tenantId } : {}),
  })
  return response.data
}

export async function updateRole(roleId: string, data: Partial<RoleCreate>, tenantId?: string): Promise<RoleResponse> {
  const response = await apiClient.patch<RoleResponse>(`/api/v1/roles/${roleId}`, data, {
    params: tenantId ? { tenant_id: tenantId } : undefined,
  })
  return response.data
}

export async function deleteRole(roleId: string, force?: boolean, tenantId?: string): Promise<void> {
  await apiClient.delete(`/api/v1/roles/${roleId}`, {
    params: { ...(force ? { force } : {}), ...(tenantId ? { tenant_id: tenantId } : {}) },
  })
}

export async function getRoleHierarchy(): Promise<RoleHierarchyNode[]> {
  const response = await apiClient.get<RoleHierarchyNode[]>('/api/v1/roles/hierarchy')
  return response.data
}

export async function getRoleWithPermissions(roleId: string, tenantId?: string): Promise<RoleWithPermissionsResponse> {
  const response = await apiClient.get<RoleWithPermissionsResponse>(
    `/api/v1/roles/${roleId}/with-permissions`,
    { params: tenantId ? { tenant_id: tenantId } : undefined },
  )
  return response.data
}

export async function assignRoleToUser(
  roleId: string,
  data: RoleAssignmentCreate,
  tenantId?: string,
): Promise<RoleAssignmentResponse> {
  const response = await apiClient.post<RoleAssignmentResponse>(
    `/api/v1/roles/${roleId}/assignments`,
    { ...data, ...(tenantId ? { tenant_id: tenantId } : {}) },
  )
  return response.data
}

export async function revokeRoleFromUser(
  roleId: string,
  principalId: string,
  tenantId?: string,
  params?: { app_id?: string; tenant_wide_only?: boolean },
): Promise<void> {
  await apiClient.delete(`/api/v1/roles/${roleId}/assignments/${principalId}`, { 
    params: { ...params, ...(tenantId ? { tenant_id: tenantId } : {}) },
  })
}

export async function getRolePermissions(roleId: string, tenantId?: string): Promise<PermissionResponse[]> {
  const response = await apiClient.get<PermissionResponse[]>(
    `/api/v1/roles/${roleId}/permissions`,
    { params: tenantId ? { tenant_id: tenantId } : undefined },
  )
  return response.data
}

export async function grantPermissionToRole(roleId: string, permissionId: string, tenantId?: string): Promise<void> {
  await apiClient.post(`/api/v1/roles/${roleId}/permissions`, { 
    permission_id: permissionId,
    ...(tenantId ? { tenant_id: tenantId } : {}),
  })
}

export async function bulkGrantPermissions(
  roleId: string,
  data: BulkPermissionGrantRequest,
  tenantId?: string,
): Promise<BulkPermissionGrantResponse> {
  const response = await apiClient.post<BulkPermissionGrantResponse>(
    `/api/v1/roles/${roleId}/permissions/bulk`,
    data,
    { params: tenantId ? { tenant_id: tenantId } : undefined },
  )
  return response.data
}

export async function revokePermissionFromRole(roleId: string, permissionId: string, tenantId?: string): Promise<void> {
  await apiClient.delete(`/api/v1/roles/${roleId}/permissions/${permissionId}`, {
    params: tenantId ? { tenant_id: tenantId } : undefined,
  })
}
