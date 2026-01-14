import type { Column } from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * TanStack Table column instance
   */
  column: Column<TData, TValue>
  /**
   * Header title
   */
  title: string
}

/**
 * Column header component with sorting controls
 *
 * Use this in column definitions for sortable columns:
 *
 * @example
 * ```tsx
 * const columns = [
 *   {
 *     accessorKey: 'email',
 *     header: ({ column }) => (
 *       <DataTableColumnHeader column={column} title="Email" />
 *     ),
 *   },
 * ]
 * ```
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const sorted = column.getIsSorted()

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent hover:bg-transparent"
        onClick={() => {
          // Cycle through: none -> asc -> desc -> none
          if (sorted === false) {
            column.toggleSorting(false) // asc
          } else if (sorted === 'asc') {
            column.toggleSorting(true) // desc
          } else {
            column.clearSorting() // none
          }
        }}
      >
        <span>{title}</span>
        {sorted === 'desc' ? (
          <ChevronDown className="ml-2 h-4 w-4" />
        ) : sorted === 'asc' ? (
          <ChevronUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    </div>
  )
}

/**
 * Simple column header without sorting (for non-sortable columns)
 */
export function DataTableSimpleHeader({
  title,
  className,
}: {
  title: string
  className?: string
}) {
  return <div className={cn('font-medium', className)}>{title}</div>
}

export type { DataTableColumnHeaderProps }
