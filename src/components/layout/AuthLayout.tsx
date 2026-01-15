import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
