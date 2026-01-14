import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { useTenantStore } from '@/stores/tenantStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_TIMEOUT = 30000

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
})

const clearAuthSession = () => {
  sessionStorage.removeItem('craftcrew_access_token')
  sessionStorage.removeItem('craftcrew_refresh_token')
  sessionStorage.removeItem('craftcrew_user')
  sessionStorage.removeItem('token_expiry')
}

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('craftcrew_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Add tenant context if a tenant is selected
  const currentTenantId = useTenantStore.getState().currentTenantId
  if (currentTenantId) {
    // Add as header (common convention)
    config.headers['X-Tenant-ID'] = currentTenantId
    
    // Also add as query parameter (explicitly documented in API spec)
    config.params = {
      ...config.params,
      tenant_id: currentTenantId,
    }
  }

  return config
})

// Auth endpoints that should NOT trigger token refresh on 401
const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh', '/api/v1/auth/logout']

const isAuthEndpoint = (url?: string): boolean => {
  if (!url) return false
  return AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint))
}

// Error codes that indicate token is INVALID (not just expired)
// These should clear session and redirect to login
const INVALID_TOKEN_CODES = [
  'AUTH_VALIDATION_FAILED',
  'AUTH_INVALID_TOKEN',
  'AUTH_MISSING_TOKEN',
]

// Error codes that indicate authentication/authorization failure (not token expiry)
// These should NOT trigger token refresh
const AUTH_FAILURE_CODES = [
  'AUTH_VALIDATION_FAILED',
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_INVALID_TOKEN',
  'AUTH_TOKEN_EXPIRED',
  'AUTH_FORBIDDEN',
  'AUTH_MISSING_TOKEN',
]

const isInvalidTokenError = (error: AxiosError): boolean => {
  const errorData = error.response?.data as { code?: string }
  const errorCode = errorData?.code
  return INVALID_TOKEN_CODES.includes(errorCode || '')
}

const isAuthFailureError = (error: AxiosError): boolean => {
  const errorData = error.response?.data as { code?: string }
  const errorCode = errorData?.code
  return AUTH_FAILURE_CODES.includes(errorCode || '')
}

let isRefreshing = false

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestUrl = error.config?.url

    // Don't try to refresh for auth endpoints - just reject with error
    if (isAuthEndpoint(requestUrl)) {
      return Promise.reject(error)
    }

    // Handle 403 Forbidden - permission errors, don't clear session
    if (error.response?.status === 403) {
      console.error('[API Client] Permission denied:', error.response?.data)
      const errorMessage = (error.response?.data as { message?: string })?.message || 'Permission denied'
      toast.error(errorMessage)
      return Promise.reject(error)
    }

    // If this is an invalid token error, clear session and redirect to login
    if (error.response?.status === 401 && isInvalidTokenError(error)) {
      const hasExistingToken = !!sessionStorage.getItem('craftcrew_access_token')

      if (hasExistingToken) {
        console.error('[API Client] Invalid token:', error.response?.data)
        const errorMessage = (error.response?.data as { message?: string })?.message || 'Authentication failed'
        clearAuthSession()
        toast.error(errorMessage)

        // Redirect to login
        window.location.href = '/login'
      }

      return Promise.reject(error)
    }

    // Only attempt refresh for 401 errors that aren't auth failures AND we have a refresh token
    if (error.response?.status === 401 && !isAuthFailureError(error)) {
      const refreshToken = sessionStorage.getItem('craftcrew_refresh_token')

      if (!refreshToken || isRefreshing) {
        clearAuthSession()
        toast.error('Session expired. Please log in again.')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      isRefreshing = true

      try {
        const response = await apiClient.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        })

        const newAccessToken = response.data.access_token
        const newRefreshToken = response.data.refresh_token

        sessionStorage.setItem('craftcrew_access_token', newAccessToken)
        if (newRefreshToken) {
          sessionStorage.setItem('craftcrew_refresh_token', newRefreshToken)
        }
        if (response.data.expires_in) {
          const expiresAt = Date.now() + response.data.expires_in * 1000
          sessionStorage.setItem('token_expiry', expiresAt.toString())
        }

        if (error.config) {
          return apiClient.request({
            ...error.config,
            headers: {
              ...error.config.headers,
              Authorization: `Bearer ${newAccessToken}`,
            } as typeof error.config.headers,
          })
        }
      } catch (refreshError) {
        console.error('[API Client] Token refresh failed', refreshError)
        clearAuthSession()
        toast.error('Session expired. Please log in again.')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)


