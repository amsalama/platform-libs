import { useQuery, useMutation, type UseQueryResult } from '@tanstack/react-query'
import {
  checkAuthorization,
  bulkCheckAuthorization,
  getMyPermissions,
} from '@/services/api/authz'
import type { AuthzCheckRequest, MyPermissionsResponse } from '@/services/api/authz'

export function useCheckAuthorization() {
  return useMutation({
    mutationFn: (request: AuthzCheckRequest) => checkAuthorization(request),
  })
}

export function useBulkCheckAuthorization() {
  return useMutation({
    mutationFn: (checks: AuthzCheckRequest[]) => bulkCheckAuthorization(checks),
  })
}

export function useMyPermissions(): UseQueryResult<MyPermissionsResponse, Error> {
  return useQuery({
    queryKey: ['authz', 'my-permissions'],
    queryFn: getMyPermissions,
    staleTime: 5 * 60 * 1000,
  })
}
