import { useQuery, useMutation, useQueryClient, keepPreviousData, type UseQueryResult } from '@tanstack/react-query'
import {
  listPermissions,
  listPermissionsPaginated,
  getPermissionsGrouped,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionRoles,
  bulkCreatePermissions,
} from '@/services/api/permissions'
import type {
  PermissionResponse,
  PermissionCreate,
  PermissionGroupResponse,
  PermissionUpdate,
  PermissionRolesResponse,
  ListPermissionsParams,
} from '@/types/role'
import type { PaginationParams, PaginatedResponse } from '@/types/pagination'

export function usePermissions(
  params?: ListPermissionsParams,
): UseQueryResult<PermissionResponse[], Error> {
  return useQuery({
    queryKey: ['permissions', params],
    queryFn: () => listPermissions(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePermissionsPaginated(
  params?: ListPermissionsParams & PaginationParams,
): UseQueryResult<PaginatedResponse<PermissionResponse>, Error> {
  return useQuery({
    queryKey: ['permissions', 'paginated', params],
    queryFn: () => listPermissionsPaginated(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePermissionsGrouped(): UseQueryResult<PermissionGroupResponse[], Error> {
  return useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: getPermissionsGrouped,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePermission(permissionId: string, tenantId?: string): UseQueryResult<PermissionResponse, Error> {
  return useQuery({
    queryKey: ['permissions', permissionId, { tenantId }],
    queryFn: () => getPermission(permissionId, tenantId),
    enabled: !!permissionId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, tenantId }: { data: PermissionCreate; tenantId?: string }) =>
      createPermission(data, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['permissions', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: ['permissions', 'grouped'] })
    },
  })
}

export function useUpdatePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ permissionId, data, tenantId }: { permissionId: string; data: PermissionUpdate; tenantId?: string }) =>
      updatePermission(permissionId, data, tenantId),
    onSuccess: (_, { permissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['permissions', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: ['permissions', permissionId] })
    },
  })
}

export function useDeletePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ permissionId, force, tenantId }: { permissionId: string; force?: boolean; tenantId?: string }) =>
      deletePermission(permissionId, force, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['permissions', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: ['permissions', 'grouped'] })
    },
  })
}

export function usePermissionRoles(permissionId: string, tenantId?: string): UseQueryResult<PermissionRolesResponse, Error> {
  return useQuery({
    queryKey: ['permissions', permissionId, 'roles', { tenantId }],
    queryFn: () => getPermissionRoles(permissionId, tenantId),
    enabled: !!permissionId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBulkCreatePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (permissions: PermissionCreate[]) => bulkCreatePermissions(permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['permissions', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: ['permissions', 'grouped'] })
    },
  })
}
