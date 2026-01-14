import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logAuditEvent, verifyAuditEvent, queryAuditEvents } from '@/services/api/audit'
import type { AuditEventRequest, AuditVerifyRequest, AuditQueryRequest } from '@/types/audit'

export function useLogAudit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AuditEventRequest) => logAuditEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useVerifyAudit() {
  return useMutation({
    mutationFn: (data: AuditVerifyRequest) => verifyAuditEvent(data),
  })
}

export function useQueryAudit() {
  return useMutation({
    mutationFn: (data: AuditQueryRequest) => queryAuditEvents(data),
  })
}
