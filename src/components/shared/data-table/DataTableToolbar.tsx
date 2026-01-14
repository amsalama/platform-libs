import type { Table } from '@tanstack/react-table'
import {
  Search,
  X,
  Download,
  Settings2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DataTableFetchingIndicator } from './DataTableLoading'

interface BulkAction<TData> {
  /**
   * Button label
   */
  label: string
  /**
   * Callback when action is triggered
   */
  onClick: (selectedRows: TData[]) => void
  /**
   * Button variant
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  /**
   * Icon to display before label
   */
  icon?: React.ReactNode
  /**
   * Whether action is disabled
   */
  disabled?: boolean
}

interface DataTableToolbarProps<TData> {
  /**
   * TanStack Table instance
   */
  table: Table<TData>
  /**
   * Current search value
   */
  searchValue: string
  /**
   * Callback when search value changes
   */
  onSearchChange: (value: string) => void
  /**
   * Search input placeholder
   * @default 'Search...'
   */
  searchPlaceholder?: string
  /**
   * Whether data is currently being fetched
   */
  isFetching?: boolean
  /**
   * Bulk actions for selected rows
   */
  bulkActions?: BulkAction<TData>[]
  /**
   * Enable CSV export
   */
  enableExport?: boolean
  /**
   * Callback for export action
   */
  onExport?: () => void
  /**
   * Enable column visibility toggle
   */
  enableColumnVisibility?: boolean
  /**
   * Callback for refresh action
   */
  onRefresh?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Custom toolbar content (rendered after bulk actions)
   */
  children?: React.ReactNode
}

/**
 * Toolbar component for DataTable
 *
 * Includes search, bulk actions, export, column visibility, and refresh
 */
export function DataTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  isFetching = false,
  bulkActions = [],
  enableExport = false,
  onExport,
  enableColumnVisibility = true,
  onRefresh,
  className,
  children,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)
  const hasSelection = selectedRows.length > 0

  const handleClearSearch = () => {
    onSearchChange('')
    table.resetGlobalFilter()
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      {/* Left side: Search */}
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearSearch}
            className="h-9 w-9 shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
        {isFetching && <DataTableFetchingIndicator />}
      </div>

      {/* Right side: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Selection indicator */}
        {hasSelection && (
          <Badge variant="secondary" className="px-3 py-1.5">
            {selectedRows.length} selected
          </Badge>
        )}

        {/* Bulk actions */}
        {bulkActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'default'}
            size="sm"
            onClick={() => action.onClick(selectedRows)}
            disabled={!hasSelection || action.disabled}
            className="h-9"
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        ))}

        {/* Custom toolbar content */}
        {children}

        {/* Export button */}
        {enableExport && onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}

        {/* Column visibility */}
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Settings2 className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    column.getCanHide() &&
                    !['select', 'actions', 'expand'].includes(column.id)
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}
                  >
                    {column.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            className="h-9 w-9"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            <span className="sr-only">Refresh</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export type { BulkAction, DataTableToolbarProps }
