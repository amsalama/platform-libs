import { useMutation } from '@tanstack/react-query'
import { revokeToken, revokeUserTokens, revokeSession, checkRevocation } from '@/services/api/revocation'
import type { TokenRevokeRequest, UserRevokeRequest, SessionRevokeRequest, RevocationCheckRequest } from '@/types/revocation'

export function useRevokeToken() {
  return useMutation({
    mutationFn: (data: TokenRevokeRequest) => revokeToken(data),
  })
}

export function useRevokeUserTokens() {
  return useMutation({
    mutationFn: (data: UserRevokeRequest) => revokeUserTokens(data),
  })
}

export function useRevokeSession() {
  return useMutation({
    mutationFn: (data: SessionRevokeRequest) => revokeSession(data),
  })
}

export function useCheckRevocation() {
  return useMutation({
    mutationFn: (data: RevocationCheckRequest) => checkRevocation(data),
  })
}
