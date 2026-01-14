import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

export default function DashboardRedirectPage() {
  const navigate = useNavigate()
  const { hasAdminAccess, hasRole, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    const userRoles = useAuthStore.getState().user?.roles || []

    if (userRoles.includes('super_admin')) {
      navigate('/admin', { replace: true })
    } else if (userRoles.includes('admin')) {
      navigate('/admin', { replace: true })
    } else if (userRoles.includes('viewer-access')) {
      navigate('/profile', { replace: true })
    } else if (userRoles.includes('pacs-access')) {
      navigate('/profile', { replace: true })
    } else {
      navigate('/profile', { replace: true })
    }
  }, [navigate, isAuthenticated, hasAdminAccess, hasRole])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">Redirecting to your dashboard...</p>
    </div>
  )
}
