import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * TanStack Query Configuration
 * 
 * - staleTime: 5 minutes (300,000ms)
 * - cacheTime: 10 minutes (600,000ms)
 * - retry: 3 times for failed queries
 * - retryDelay: Exponential backoff
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (cleanup)
      retry: (failureCount, error) => {
        // Retry on server errors (500, 503, 504) and network errors
        if (error instanceof Error || failureCount < 3) {
          return true
        }
        return false
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Max 30s
    },
    mutations: {
      retry: 0, // Don't retry mutations (not idempotent)
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
