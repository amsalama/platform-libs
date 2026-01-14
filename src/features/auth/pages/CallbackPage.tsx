import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

export default function CallbackPage() {
  const { initializeFromStorage, isAuthenticated } = useAuthStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      console.error('[Callback] OAuth error:', error, errorDescription)
      navigate('/login', { replace: true })
      return
    }

    if (!code || !state) {
      console.error('[Callback] Missing required parameters')
      navigate('/login', { replace: true })
      return
    }

    if (isAuthenticated) {
      navigate('/', { replace: true })
      return
    }

    const activeSessions = JSON.parse(sessionStorage.getItem('active_sso_sessions') || '[]')
    let validSession = false

    for (const sessionId of activeSessions) {
      const contextStr = sessionStorage.getItem(`sso_context_${sessionId}`)
      if (contextStr) {
        try {
          const context = JSON.parse(contextStr)
          if (context.state === state) {
            validSession = true
            break
          }
        } catch (e) {
          console.error('[Callback] Failed to parse SSO context:', e)
        }
      }
    }

    if (!validSession) {
      console.error('[Callback] Invalid OAuth state parameter - potential CSRF attack')
      navigate('/login', { replace: true })
      return
    }

    initializeFromStorage()
    navigate('/', { replace: true })
  }, [searchParams, navigate, initializeFromStorage, isAuthenticated])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">Completing sign-in...</p>
    </div>
  )
}
