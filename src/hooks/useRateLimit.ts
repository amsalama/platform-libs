import { useQuery, useMutation, type UseQueryResult } from '@tanstack/react-query'
import { getRateLimitStatus, checkRateLimit, resetRateLimit } from '@/services/api/rate-limit'
import type {
  RateLimitCheckRequest,
  RateLimitStatusResponse,
} from '@/types/rate-limit'

export function useRateLimitStatus(bucket: string): UseQueryResult<RateLimitStatusResponse, Error> {
  return useQuery({
    queryKey: ['rate-limit', bucket],
    queryFn: () => getRateLimitStatus(bucket),
    enabled: !!bucket,
    staleTime: 60 * 1000,
  })
}

export function useCheckRateLimit() {
  return useMutation({
    mutationFn: (request: RateLimitCheckRequest) => checkRateLimit(request),
  })
}

export function useResetRateLimit() {
  return useMutation({
    mutationFn: (bucket: string) => resetRateLimit(bucket),
  })
}
