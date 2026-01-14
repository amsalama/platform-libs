import { apiClient } from './client'

export interface LoginResponse {
  readonly access_token: string
  readonly refresh_token?: string
  readonly id_token?: string
  readonly expires_in?: number
  readonly token_type?: string
  readonly sub: string
  readonly email: string
  readonly email_verified: boolean
  readonly name: string
  readonly given_name: string
  readonly family_name: string
  readonly preferred_username: string
  readonly principal_id: string
  readonly tenant_id: string | null
  readonly roles: string[]
  readonly permissions: string[]
  readonly authenticated_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_in?: number
  token_type?: string
}

export interface LoginRequest {
  username: string
  password: string
  scope?: string | null
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  first_name?: string | null
  last_name?: string | null
  tenant_id?: string | null
  invitation_code?: string | null
}

export interface RefreshTokenRequest {
  refresh_token: string
  grant_type?: string
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}

export interface RegisterResponse {
  success: boolean
  message: string
  user_id: string
  email: string
  username: string
  email_verification_required: boolean
}

export interface UserProfileResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  id_token?: string
  sub: string
  email?: string | null
  email_verified: boolean
  name?: string | null
  given_name?: string | null
  family_name?: string | null
  preferred_username?: string | null
  principal_id: string
  tenant_id?: string | null
  roles: string[]
  permissions: string[]
  authenticated_at: string
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', request)
  return response.data
}

export async function register(request: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', request)
  return response.data
}

export async function refreshAccessToken(request: RefreshTokenRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/api/v1/auth/refresh', {
    refresh_token: request.refresh_token,
  })

  return response.data
}

export async function logout(refreshToken?: string): Promise<void> {
  await apiClient.post('/api/v1/auth/logout', {
    refresh_token: refreshToken,
  })
}

export interface IntrospectionResponse {
  active: boolean
  exp?: number | null
  tenant_id?: string | null
  email?: string | null
  roles: string[]
  subject?: string | null
}

export async function introspectToken(): Promise<IntrospectionResponse> {
  const response = await apiClient.post<IntrospectionResponse>('/api/v1/auth/introspect')
  return response.data
}

export interface UserInfoResponse {
  sub: string
  email?: string | null
  email_verified: boolean
  name?: string | null
  given_name?: string | null
  family_name?: string | null
  preferred_username?: string | null
  tenant_id?: string | null
  roles: string[]
}

export async function getUserInfo(): Promise<UserInfoResponse> {
  const response = await apiClient.get<UserInfoResponse>('/api/v1/auth/userinfo')
  return response.data
}

export async function getCurrentUser(): Promise<UserProfileResponse> {
  const response = await apiClient.get<UserProfileResponse>('/api/v1/auth/me')
  return response.data
}
