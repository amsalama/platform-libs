/**
 * Environment Configuration
 *
 * Centralized loading and validation of environment variables.
 * All environment variables must be prefixed with VITE_ for Vite.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000

const EXTERNAL_AUTH_ENABLED = import.meta.env.VITE_EXTERNAL_AUTH_ENABLED === 'true'
const EXTERNAL_AUTH_RESPONSE_MODE = import.meta.env.VITE_EXTERNAL_AUTH_RESPONSE_MODE || 'code'
const ALLOWED_REDIRECT_DOMAINS = (import.meta.env.VITE_ALLOWED_REDIRECT_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean)
const SSO_SESSION_TIMEOUT = Number(import.meta.env.VITE_SSO_SESSION_TIMEOUT) || 1800
const SSO_MAX_CONCURRENT = Number(import.meta.env.VITE_SSO_MAX_CONCURRENT) || 5

const ENABLE_MOCK_API = import.meta.env.VITE_ENABLE_MOCK_API === 'true'

export const env = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: API_TIMEOUT,
  },
  externalAuth: {
    enabled: EXTERNAL_AUTH_ENABLED,
    responseMode: EXTERNAL_AUTH_RESPONSE_MODE,
    allowedRedirectDomains: ALLOWED_REDIRECT_DOMAINS,
    sessionTimeout: SSO_SESSION_TIMEOUT,
    maxConcurrent: SSO_MAX_CONCURRENT,
  },
  dev: {
    enableMockApi: ENABLE_MOCK_API,
  },
}
