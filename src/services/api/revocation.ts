import { apiClient } from './client'
import type {
  TokenRevokeRequest,
  RevocationResponse,
  UserRevokeRequest,
  SessionRevokeRequest,
  RevocationCheckRequest,
  RevocationCheckResponse,
} from '@/types/revocation'

export async function revokeToken(data: TokenRevokeRequest): Promise<RevocationResponse> {
  const response = await apiClient.post<RevocationResponse>('/api/v1/revocation/token', data)
  return response.data
}

export async function revokeUserTokens(data: UserRevokeRequest): Promise<RevocationResponse> {
  const response = await apiClient.post<RevocationResponse>('/api/v1/revocation/user', data)
  return response.data
}

export async function revokeSession(data: SessionRevokeRequest): Promise<RevocationResponse> {
  const response = await apiClient.post<RevocationResponse>('/api/v1/revocation/session', data)
  return response.data
}

export async function checkRevocation(data: RevocationCheckRequest): Promise<RevocationCheckResponse> {
  const response = await apiClient.post<RevocationCheckResponse>('/api/v1/revocation/check', data)
  return response.data
}
