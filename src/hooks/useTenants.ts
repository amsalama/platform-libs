import { keepPreviousData, useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import axios from 'axios'
import {
  listTenants,
  listTenantsPaginated,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  suspendTenant,
  activateTenant,
} from '@/services/api/tenants'
import type { TenantResponse, TenantUpdate, ListTenantsParams } from '@/types/tenant'
import type { PaginationParams, PaginatedResponse } from '@/types/pagination'

export function useTenants(params?: ListTenantsParams): UseQueryResult<TenantResponse[], Error> {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => {
      try {
        return await listTenants(params)
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error('[useTenants] Failed to fetch tenants:', {
            status: err.response?.status,
            code: err.response?.data?.code,
            message: err.response?.data?.message || err.message,
          })
        } else {
          console.error('[useTenants] Unknown error:', err)
        }
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTenantsPaginated(params?: ListTenantsParams & PaginationParams): UseQueryResult<PaginatedResponse<TenantResponse>, Error> {
  return useQuery({
    queryKey: ['tenants', 'paginated', params] as const,
    queryFn: async () => {
      try {
        return await listTenantsPaginated(params)
      } catch (error) {
        console.error('[DEBUG useTenantsPaginated] Query function error:', error)
        throw error
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTenant(tenantId: string): UseQueryResult<TenantResponse, Error> {
  return useQuery({
    queryKey: ['tenants', tenantId],
    queryFn: () => getTenant(tenantId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', 'paginated'] })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: TenantUpdate }) =>
      updateTenant(tenantId, data),
    onSuccess: (_, { tenantId }) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId] })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', 'paginated'] })
    },
  })
}

export function useSuspendTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: suspendTenant,
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId] })
    },
  })
}

export function useActivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: activateTenant,
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId] })
    },
  })
}
