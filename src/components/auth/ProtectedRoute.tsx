import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, isInitialized, initializeFromStorage } = useAuthStore()
  const location = useLocation()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initializeFromStorage()
      initialized.current = true
    }
  }, [initializeFromStorage])

  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
