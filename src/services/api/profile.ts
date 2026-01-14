import { apiClient } from './client'
import type { TokenResponse } from './auth'
import type { ProfileUpdateRequest } from '@/types/profile'

export async function getCurrentUser(): Promise<TokenResponse & {
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
}> {
  const response = await apiClient.get('/api/v1/auth/me')
  return response.data
}

export async function getUserInfo(): Promise<Record<string, unknown>> {
  const response = await apiClient.get('/api/v1/auth/userinfo')
  return response.data
}

export async function updateProfile(data: ProfileUpdateRequest): Promise<void> {
  await apiClient.patch('/api/v1/user/profile', data)
}
