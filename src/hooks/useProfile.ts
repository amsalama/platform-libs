import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { getCurrentUser, getUserInfo, updateProfile } from '@/services/api/profile'
import type { TokenResponse } from '@/services/api/auth'
import type { ProfileUpdateRequest } from '@/types/profile'

export function useCurrentUser(): UseQueryResult<TokenResponse & {
  sub: string
  email?: string
  email_verified: boolean
  name?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  principal_id: string
  tenant_id?: string
  roles: string[]
  permissions: string[]
  authenticated_at: string
}, Error> {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUserInfo(): UseQueryResult<Record<string, unknown>, Error> {
  return useQuery({
    queryKey: ['auth', 'userinfo'],
    queryFn: getUserInfo,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'userinfo'] })
    },
  })
}
