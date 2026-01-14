import { keepPreviousData, useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { listUsers, listUsersPaginated, createUser, getUser, updateUser, getUserRoles, deleteUser } from '@/services/api/users'
import { useTenantStore } from '@/stores/tenantStore'
import type { UserResponse, UserUpdate, ListUsersParams, UserRolesResponse } from '@/types/user'
import type { PaginationParams, PaginatedResponse } from '@/types/pagination'

export function useUsers(params?: ListUsersParams): UseQueryResult<UserResponse[], Error> {
  const currentTenantId = useTenantStore((state) => state.currentTenantId)

  return useQuery({
    queryKey: ['users', params, currentTenantId],
    queryFn: () => listUsers({ ...params, tenant_id: currentTenantId || undefined }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUsersPaginated(params?: ListUsersParams & PaginationParams): UseQueryResult<PaginatedResponse<UserResponse>, Error> {
  const currentTenantId = useTenantStore((state) => state.currentTenantId)

  return useQuery({
    queryKey: ['users', 'paginated', params, currentTenantId] as const,
    queryFn: () => listUsersPaginated({ ...params, tenant_id: currentTenantId || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'paginated'] })
    },
  })
}

export function useUser(principalId: string): UseQueryResult<UserResponse, Error> {
  return useQuery({
    queryKey: ['users', principalId],
    queryFn: () => getUser(principalId),
    enabled: !!principalId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ principalId, data }: { principalId: string; data: UserUpdate }) =>
      updateUser(principalId, data),
    onSuccess: (_, { principalId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: ['users', principalId] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ principalId, hardDelete }: { principalId: string; hardDelete?: boolean }) =>
      deleteUser(principalId, hardDelete ?? false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'paginated'] })
    },
  })
}

export function useUserRoles(principalId: string): UseQueryResult<UserRolesResponse, Error> {
  return useQuery({
    queryKey: ['users', principalId, 'roles'],
    queryFn: () => getUserRoles(principalId),
    enabled: !!principalId,
    staleTime: 5 * 60 * 1000,
  })
}
