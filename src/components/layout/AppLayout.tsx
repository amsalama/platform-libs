import { Outlet } from 'react-router-dom'
import Header from './Header'
import { SSOHandler } from '@/features/auth/components/SSOHandler'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SSOHandler />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
