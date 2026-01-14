import { QueryProvider } from '@/lib/react-query'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useThemeStore } from '@/stores/themeStore'
import { StrictMode } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from '@/components/ui/toaster'
import { router } from './routes'

export default function App() {
  const { theme } = useThemeStore()

  return (
    <StrictMode>
      <ErrorBoundary fallback={<div>Error loading app...</div>}>
        <NextThemesProvider attribute="class" defaultTheme={theme} enableSystem>
          <QueryProvider>
            <RouterProvider router={router} />
            <Toaster />
          </QueryProvider>
        </NextThemesProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
