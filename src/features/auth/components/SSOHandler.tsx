import { useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'

interface SSOContext {
  redirectUri: string
  clientId: string
  state: string | null
  responseType: string
  codeChallenge: string | null
  timestamp: number
}

/**
 * SSOHandler - Handles SSO completion after user authentication
 * 
 * This component runs on every page load to check if there's a pending SSO flow
 * that needs to be completed. After the user authenticates, this handler:
 * 
 * 1. Checks for pending SSO sessions (from ssoInitiated state or active sessions)
 * 2. Validates the user is authenticated
 * 3. Generates the appropriate response (authorization code or direct token)
 * 4. Redirects back to the external application with the response
 */
export function SSOHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, accessToken, user } = useAuthStore()

  /**
   * Generate a one-time authorization code for the external app
   * The external app will exchange this code for tokens via backend
   */
  const generateAuthorizationCode = useCallback(async (context: SSOContext): Promise<string> => {
    // In a real implementation, this would call the backend to generate a code
    // For now, we create a temporary code stored in sessionStorage
    // The backend should have an endpoint like POST /api/v1/auth/authorize
    
    const code = crypto.randomUUID()
    const codeData = {
      code,
      clientId: context.clientId,
      redirectUri: context.redirectUri,
      userId: user?.principal_id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      codeChallenge: context.codeChallenge,
      used: false,
    }
    
    // Store the code for backend verification
    // In production, this should be stored server-side
    sessionStorage.setItem(`auth_code_${code}`, JSON.stringify(codeData))
    
    return code
  }, [user?.principal_id])

  /**
   * Complete the SSO flow by redirecting back to the external application
   */
  const completeSSOFlow = useCallback(async (sessionId: string, context: SSOContext) => {
    console.log('[SSOHandler] Completing SSO flow:', { sessionId, clientId: context.clientId })

    const redirectUrl = new URL(context.redirectUri)
    
    // Add state parameter for CSRF protection
    if (context.state) {
      redirectUrl.searchParams.set('state', context.state)
    }

    const responseMode = env.externalAuth.responseMode

    try {
      if (context.responseType === 'token' || responseMode === 'token') {
        // Direct token pass mode (for trusted partners)
        if (accessToken) {
          redirectUrl.searchParams.set('access_token', accessToken)
          redirectUrl.searchParams.set('token_type', 'Bearer')
          
          const tokenExpiry = sessionStorage.getItem('token_expiry')
          if (tokenExpiry) {
            const expiresIn = Math.floor((Number(tokenExpiry) - Date.now()) / 1000)
            if (expiresIn > 0) {
              redirectUrl.searchParams.set('expires_in', expiresIn.toString())
            }
          }
        }
      } else {
        // Authorization code flow (recommended)
        const code = await generateAuthorizationCode(context)
        redirectUrl.searchParams.set('code', code)
      }

      // Clean up the SSO session
      sessionStorage.removeItem(`sso_context_${sessionId}`)
      const activeSessions = JSON.parse(sessionStorage.getItem('active_sso_sessions') || '[]') as string[]
      const updatedSessions = activeSessions.filter(id => id !== sessionId)
      sessionStorage.setItem('active_sso_sessions', JSON.stringify(updatedSessions))

      console.log('[SSOHandler] Redirecting to:', redirectUrl.origin + redirectUrl.pathname)
      
      // Redirect to external app
      window.location.href = redirectUrl.toString()
    } catch (error) {
      console.error('[SSOHandler] Failed to complete SSO flow:', error)
      
      // Redirect with error
      redirectUrl.searchParams.set('error', 'server_error')
      redirectUrl.searchParams.set('error_description', 'Failed to generate authorization response')
      if (context.state) {
        redirectUrl.searchParams.set('state', context.state)
      }
      window.location.href = redirectUrl.toString()
    }
  }, [accessToken, generateAuthorizationCode])

  useEffect(() => {
    // Don't process if external auth is disabled
    if (!env.externalAuth.enabled) {
      return
    }

    // Don't process if user is not authenticated
    if (!isAuthenticated) {
      return
    }

    // Check if we were initiated from an SSO flow
    const locationState = location.state as { ssoInitiated?: boolean; sessionId?: string } | null
    
    if (locationState?.ssoInitiated && locationState?.sessionId) {
      const sessionId = locationState.sessionId
      const contextStr = sessionStorage.getItem(`sso_context_${sessionId}`)
      
      if (contextStr) {
        try {
          const context = JSON.parse(contextStr) as SSOContext
          completeSSOFlow(sessionId, context)
          
          // Clear the location state to prevent re-processing
          navigate(location.pathname, { replace: true, state: {} })
        } catch (error) {
          console.error('[SSOHandler] Failed to parse SSO context:', error)
        }
      }
      return
    }

    // Also check for any pending SSO sessions (e.g., user navigated away and came back)
    const activeSessions = JSON.parse(sessionStorage.getItem('active_sso_sessions') || '[]') as string[]
    
    if (activeSessions.length > 0) {
      // Process the oldest pending session
      const pendingSessionId = activeSessions[0]
      if (!pendingSessionId) return
      
      const contextStr = sessionStorage.getItem(`sso_context_${pendingSessionId}`)
      
      if (contextStr) {
        try {
          const context = JSON.parse(contextStr) as SSOContext
          
          // Check if session is not expired
          const sessionAge = Date.now() - context.timestamp
          const maxAge = env.externalAuth.sessionTimeout * 1000
          
          if (sessionAge <= maxAge) {
            completeSSOFlow(pendingSessionId, context)
          } else {
            // Clean up expired session
            sessionStorage.removeItem(`sso_context_${pendingSessionId}`)
            const updatedSessions = activeSessions.filter(id => id !== pendingSessionId)
            sessionStorage.setItem('active_sso_sessions', JSON.stringify(updatedSessions))
          }
        } catch (error) {
          console.error('[SSOHandler] Failed to process pending SSO session:', error)
        }
      }
    }
  }, [isAuthenticated, location.state, location.pathname, navigate, completeSSOFlow])

  // This component doesn't render anything
  return null
}
