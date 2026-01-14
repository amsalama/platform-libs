import { useQuery, useMutation, useQueryClient, type UseQueryResult, keepPreviousData } from '@tanstack/react-query'
import {
  listRoles,
  listRolesPaginated,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getRoleHierarchy,
  getRoleWithPermissions,
  bulkGrantPermissions,
  revokePermissionFromRole,
  grantPermissionToRole,
  assignRoleToUser,
  revokeRoleFromUser as revokeRoleFromUserApi,
  getRolePermissions,
} from '@/services/api/roles'
import type {
  RoleResponse,
  RoleCreate,
  PermissionResponse,
  ListRolesParams,
  RoleHierarchyNode,
  RoleWithPermissionsResponse,
  BulkPermissionGrantRequest,
  RoleAssignmentCreate,
} from '@/types/role'
import type { PaginationParams, PaginatedResponse } from '@/types/pagination'

export function useRoles(params?: ListRolesParams): UseQueryResult<RoleResponse[], Error> {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => listRoles(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRolesPaginated(
  params?: ListRolesParams & PaginationParams,
): UseQueryResult<PaginatedResponse<RoleResponse>, Error> {
  return useQuery({
    queryKey: ['roles', 'paginated', params] as const,
    queryFn: () => listRolesPaginated(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRole(roleId: string, tenantId?: string): UseQueryResult<RoleResponse, Error> {
  return useQuery({
    queryKey: ['roles', roleId, { tenantId }],
    queryFn: () => getRole(roleId, tenantId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, tenantId }: { data: RoleCreate; tenantId?: string }) =>
      createRole(data, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, data, tenantId }: { roleId: string; data: Partial<RoleCreate>; tenantId?: string }) =>
      updateRole(roleId, data, tenantId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['roles', roleId] })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, force, tenantId }: { roleId: string; force?: boolean; tenantId?: string }) =>
      deleteRole(roleId, force, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useRoleHierarchy(): UseQueryResult<RoleHierarchyNode[], Error> {
  return useQuery({
    queryKey: ['roles', 'hierarchy'],
    queryFn: getRoleHierarchy,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRoleWithPermissions(roleId: string, tenantId?: string): UseQueryResult<RoleWithPermissionsResponse, Error> {
  return useQuery({
    queryKey: ['roles', roleId, 'with-permissions', { tenantId }],
    queryFn: () => getRoleWithPermissions(roleId, tenantId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBulkGrantPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, data, tenantId }: { roleId: string; data: BulkPermissionGrantRequest; tenantId?: string }) =>
      bulkGrantPermissions(roleId, data, tenantId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] })
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'with-permissions'] })
    },
  })
}

export function useAssignRoleToUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, data, tenantId }: { roleId: string; data: RoleAssignmentCreate; tenantId?: string }) =>
      assignRoleToUser(roleId, data, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useRevokeRoleFromUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, principalId, tenantId, params }: { roleId: string; principalId: string; tenantId?: string; params?: { app_id?: string; tenant_wide_only?: boolean } }) =>
      revokeRoleFromUserApi(roleId, principalId, tenantId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useRolePermissions(roleId: string, tenantId?: string): UseQueryResult<PermissionResponse[], Error> {
  return useQuery({
    queryKey: ['roles', roleId, 'permissions', { tenantId }],
    queryFn: () => getRolePermissions(roleId, tenantId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGrantPermissionToRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, permissionId, tenantId }: { roleId: string; permissionId: string; tenantId?: string }) =>
      grantPermissionToRole(roleId, permissionId, tenantId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] })
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'with-permissions'] })
    },
  })
}

export function useRevokePermissionFromRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, permissionId, tenantId }: { roleId: string; permissionId: string; tenantId?: string }) =>
      revokePermissionFromRole(roleId, permissionId, tenantId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'permissions'] })
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'with-permissions'] })
    },
  })
}
