import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LogoutPage() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
      } catch (error) {
        console.error('Logout failed', error)
      } finally {
        navigate('/login', { replace: true })
      }
    }

    performLogout()
  }, [logout, navigate])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">Logging out...</p>
    </div>
  )
}
