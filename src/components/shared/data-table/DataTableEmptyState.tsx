import { Search, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateConfig {
  /**
   * Icon to display
   */
  icon?: React.ReactNode
  /**
   * Title text
   */
  title: string
  /**
   * Description text
   */
  description?: string
  /**
   * Primary action button
   */
  action?: {
    label: string
    onClick: () => void
  }
}

interface DataTableEmptyStateProps {
  /**
   * Configuration for empty state display
   */
  config?: EmptyStateConfig
  /**
   * Whether this is a "no results" state (filtered) vs "no data" state
   */
  variant?: 'no-data' | 'no-results'
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Empty state component for DataTable
 *
 * Shows when table has no data or when filters produce no results
 */
export function DataTableEmptyState({
  config,
  variant = 'no-data',
  className,
}: DataTableEmptyStateProps) {
  const defaultIcon =
    variant === 'no-results' ? (
      <Search className="h-10 w-10 text-muted-foreground" />
    ) : (
      <FileX className="h-10 w-10 text-muted-foreground" />
    )

  const defaultTitle =
    variant === 'no-results' ? 'No results found' : 'No data available'

  const defaultDescription =
    variant === 'no-results'
      ? 'Try adjusting your search or filter criteria'
      : 'Get started by adding your first item'

  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        {config?.icon || defaultIcon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {config?.title || defaultTitle}
      </h3>
      {(config?.description || defaultDescription) && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {config?.description || defaultDescription}
        </p>
      )}
      {config?.action && (
        <Button onClick={config.action.onClick} className="mt-6">
          {config.action.label}
        </Button>
      )}
    </div>
  )
}

export type { EmptyStateConfig, DataTableEmptyStateProps }
