import { apiClient } from './client'
import type {
  UserResponse,
  UserCreate,
  UserUpdate,
  UserDetailResponse,
  ListUsersParams,
  UserRolesResponse,
} from '@/types/user'
import type { PaginationParams, PaginatedResponse } from '@/types/pagination'
import { normalizePaginatedResponse } from './normalize'

export async function listUsers(params?: ListUsersParams): Promise<UserResponse[]> {
  const response = await apiClient.get('/api/v1/users', { params })

  return normalizePaginatedResponse<UserResponse>(response.data, params).items
}

export async function listUsersPaginated(
  params?: ListUsersParams & PaginationParams,
): Promise<PaginatedResponse<UserResponse>> {
  const response = await apiClient.get('/api/v1/users', { params })

  return normalizePaginatedResponse<UserResponse>(response.data, params)
}

export async function createUser(data: UserCreate): Promise<UserDetailResponse> {
  const response = await apiClient.post<UserDetailResponse>('/api/v1/users', data)
  return response.data
}

export async function getUser(principalId: string): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>(`/api/v1/users/${principalId}`)
  return response.data
}

export async function updateUser(principalId: string, data: UserUpdate): Promise<UserDetailResponse> {
  const response = await apiClient.patch<UserDetailResponse>(`/api/v1/users/${principalId}`, data)
  return response.data
}

export async function deleteUser(principalId: string, hardDelete = false): Promise<void> {
  await apiClient.delete(`/api/v1/users/${principalId}`, {
    params: {
      hard_delete: hardDelete,
    },
  })
}

export async function getUserRoles(principalId: string): Promise<UserRolesResponse> {
  const response = await apiClient.get<UserRolesResponse>(`/api/v1/users/${principalId}/roles`)
  return response.data
}
