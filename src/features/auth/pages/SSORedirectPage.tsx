import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { env } from '@/config/env'
import { Loader2 } from 'lucide-react'

function isHostAllowed(hostname: string, allowedDomain: string): boolean {
  const host = hostname.toLowerCase()
  const domain = allowedDomain.toLowerCase().trim()

  if (!domain) return false

  // Exact host match
  if (!domain.startsWith('*.')) {
    return host === domain
  }

  // Wildcard subdomain match: '*.example.com' matches 'a.example.com' but not 'example.com'
  const base = domain.slice(2)
  if (!base) return false

  return host.endsWith(`.${base}`)
}

function cleanupSsoSessions(nowMs: number): void {
  const timeoutMs = env.externalAuth.sessionTimeout * 1000
  const maxConcurrent = env.externalAuth.maxConcurrent

  const activeSessions = JSON.parse(sessionStorage.getItem('active_sso_sessions') || '[]') as string[]
  const uniqueSessions = Array.from(new Set(activeSessions)).filter(Boolean)

  const sessionsWithTimestamps = uniqueSessions
    .map((sessionId) => {
      const raw = sessionStorage.getItem(`sso_context_${sessionId}`)
      if (!raw) return { sessionId, timestamp: 0, keep: false }

      try {
        const parsed = JSON.parse(raw) as { timestamp?: number }
        const timestamp = typeof parsed.timestamp === 'number' ? parsed.timestamp : 0
        const keep = timestamp > 0 && nowMs - timestamp <= timeoutMs
        return { sessionId, timestamp, keep }
      } catch {
        return { sessionId, timestamp: 0, keep: false }
      }
    })

  // Remove stale/invalid
  for (const session of sessionsWithTimestamps) {
    if (!session.keep) {
      sessionStorage.removeItem(`sso_context_${session.sessionId}`)
    }
  }

  const kept = sessionsWithTimestamps
    .filter((s) => s.keep)
    .sort((a, b) => a.timestamp - b.timestamp) // oldest first

  // Enforce max concurrent sessions by evicting oldest
  const overflow = kept.length - maxConcurrent
  if (overflow > 0) {
    for (const evicted of kept.slice(0, overflow)) {
      sessionStorage.removeItem(`sso_context_${evicted.sessionId}`)
    }
  }

  const finalKept = kept.slice(Math.max(0, overflow)).map((s) => s.sessionId)
  sessionStorage.setItem('active_sso_sessions', JSON.stringify(finalKept))
}

export default function SSORedirectPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!env.externalAuth.enabled) {
      navigate('/', { replace: true })
      return
    }

    const redirectUri = searchParams.get('redirect_uri')
    const clientId = searchParams.get('client_id')
    const state = searchParams.get('state')
    const responseType = searchParams.get('response_type') || 'code'
    const codeChallenge = searchParams.get('code_challenge')

    if (!redirectUri || !clientId) {
      console.error('[SSO] Missing required parameters')
      navigate('/', { replace: true })
      return
    }

    let redirectUrl: URL
    try {
      redirectUrl = new URL(redirectUri)
    } catch {
      console.error('[SSO] Invalid redirect_uri:', redirectUri)
      navigate('/', { replace: true })
      return
    }

    if (redirectUrl.protocol !== 'https:' && redirectUrl.protocol !== 'http:') {
      console.error('[SSO] Unsupported redirect_uri protocol:', redirectUrl.protocol)
      navigate('/', { replace: true })
      return
    }

    const allowedDomains = env.externalAuth.allowedRedirectDomains
    const isAllowed = allowedDomains.some((domain) => isHostAllowed(redirectUrl.hostname, domain))

    if (!isAllowed) {
      console.error('[SSO] Redirect URI not in allowlist:', redirectUri)
      navigate('/', { replace: true })
      return
    }

    const nowMs = Date.now()
    cleanupSsoSessions(nowMs)

    const ssoContext = {
      redirectUri: redirectUrl.toString(),
      clientId,
      state,
      responseType,
      codeChallenge,
      timestamp: nowMs,
    }

    const sessionId = `sso_${crypto.randomUUID()}`
    sessionStorage.setItem(`sso_context_${sessionId}`, JSON.stringify(ssoContext))

    const activeSessions = JSON.parse(sessionStorage.getItem('active_sso_sessions') || '[]') as string[]
    const nextSessions = Array.from(new Set([...activeSessions, sessionId]))
    sessionStorage.setItem('active_sso_sessions', JSON.stringify(nextSessions))

    console.log('[SSO] Initiated SSO flow:', { clientId, redirectUri: redirectUrl.toString(), sessionId })

    navigate('/', { state: { ssoInitiated: true, sessionId } })
  }, [searchParams, navigate])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">Initiating SSO flow...</p>
    </div>
  )
}
