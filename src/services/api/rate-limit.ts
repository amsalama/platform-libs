import { apiClient } from './client'
import type {
  RateLimitCheckRequest,
  RateLimitStatusResponse,
  RateLimitResetRequest,
  RateLimitResetResponse,
} from '@/types/rate-limit'

export async function getRateLimitStatus(bucket: string): Promise<RateLimitStatusResponse> {
  const response = await apiClient.get<RateLimitStatusResponse>(`/api/v1/rate-limit/${bucket}`)
  return response.data
}

export async function checkRateLimit(request: RateLimitCheckRequest): Promise<RateLimitStatusResponse> {
  const response = await apiClient.post<RateLimitStatusResponse>(
    '/api/v1/rate-limit/check',
    request,
  )
  return response.data
}

export async function resetRateLimit(bucket: string): Promise<RateLimitResetResponse> {
  const request: RateLimitResetRequest = { bucket }
  const response = await apiClient.post<RateLimitResetResponse>(
    '/api/v1/rate-limit/reset',
    request,
  )
  return response.data
}
