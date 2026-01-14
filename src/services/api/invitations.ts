import { apiClient } from './client'
import type {
  InvitationCreate,
  InvitationResponse,
  PaginatedInvitationsResponse,
  ListInvitationsParams,
} from '@/types/invitation'
import type { PaginationParams } from '@/types/pagination'
import { normalizePaginatedResponse } from './normalize'

export async function createInvitation(data: InvitationCreate): Promise<InvitationResponse> {
  const response = await apiClient.post<InvitationResponse>('/api/v1/invitations', data)
  return response.data
}

export async function listInvitations(
  params?: ListInvitationsParams & PaginationParams,
): Promise<PaginatedInvitationsResponse> {
  const response = await apiClient.get('/api/v1/invitations', { params })

  return normalizePaginatedResponse<InvitationResponse>(response.data, params) as PaginatedInvitationsResponse
}

export async function getInvitation(invitationId: string): Promise<InvitationResponse> {
  const response = await apiClient.get<InvitationResponse>(`/api/v1/invitations/${invitationId}`)
  return response.data
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  await apiClient.delete(`/api/v1/invitations/${invitationId}`)
}

export async function validateInvitationCode(code: string): Promise<InvitationResponse> {
  const response = await apiClient.get<InvitationResponse>(
    `/api/v1/invitations/validate/${encodeURIComponent(code)}`,
  )
  return response.data
}
