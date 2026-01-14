import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTableLoadingProps {
  /**
   * Loading message to display
   * @default 'Loading data...'
   */
  message?: string
  /**
   * Number of skeleton rows to display
   * @default 5
   */
  rows?: number
  /**
   * Number of skeleton columns to display
   * @default 5
   */
  columns?: number
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Skeleton row component for initial loading state
 */
function SkeletonRow({ columns }: { columns: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded-md bg-muted animate-pulse',
            i === 0 ? 'w-8' : i === 1 ? 'w-48' : i === columns - 1 ? 'w-10' : 'w-24'
          )}
        />
      ))}
    </div>
  )
}

/**
 * Loading state component for DataTable - Initial Load
 *
 * Shows skeleton rows that mimic the table structure
 */
export function DataTableLoading({
  message = 'Loading data...',
  rows = 5,
  columns = 5,
  className,
}: DataTableLoadingProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-64 rounded-md bg-muted animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/60 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-3 rounded bg-muted-foreground/20',
                i === 0 ? 'w-6' : i === 1 ? 'w-32' : i === columns - 1 ? 'w-8' : 'w-20'
              )}
            />
          ))}
        </div>

        {/* Body skeleton */}
        <div className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} columns={columns} />
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-1">
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded bg-muted animate-pulse" />
          <div className="h-9 w-48 rounded bg-muted animate-pulse" />
        </div>
      </div>

      {/* Subtle loading indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  )
}

/**
 * Overlay component for fetching state (page changes, refetching)
 *
 * Dims the existing content and shows a loading indicator
 */
export function DataTableFetchingOverlay({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center',
        'bg-background/60 backdrop-blur-[1px]',
        'transition-opacity duration-200',
        className
      )}
    >
      <div className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 shadow-lg border">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  )
}

/**
 * Inline loading indicator for fetching state
 *
 * Shows a small spinner, typically used in toolbar
 */
export function DataTableFetchingIndicator({
  className,
}: {
  className?: string
}) {
  return (
    <Loader2
      className={cn('h-5 w-5 animate-spin text-muted-foreground', className)}
    />
  )
}

export type { DataTableLoadingProps }
