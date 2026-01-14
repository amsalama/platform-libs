import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import {
  createInvitation,
  listInvitations,
  getInvitation,
  revokeInvitation,
  validateInvitationCode,
} from '@/services/api/invitations'
import type {
  InvitationResponse,
  ListInvitationsParams,
} from '@/types/invitation'
import type { PaginationParams } from '@/types/pagination'

export function useInvitations(
  params?: ListInvitationsParams & PaginationParams,
): UseQueryResult<InvitationResponse[], Error> {
  return useQuery({
    queryKey: ['invitations', params],
    queryFn: async () => {
      const response = await listInvitations(params)
      return response.items
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useInvitation(invitationId: string): UseQueryResult<InvitationResponse, Error> {
  return useQuery({
    queryKey: ['invitations', invitationId],
    queryFn: () => getInvitation(invitationId),
    enabled: !!invitationId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}

export function useValidateInvitationCode() {
  return useMutation({
    mutationFn: (code: string) => validateInvitationCode(code),
  })
}
