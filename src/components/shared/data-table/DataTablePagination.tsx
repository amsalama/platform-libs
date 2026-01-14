import type { Table, PaginationState } from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface DataTablePaginationProps<TData> {
  /**
   * TanStack Table instance
   */
  table: Table<TData>
  /**
   * Current pagination state
   */
  pagination: PaginationState
  /**
   * Callback when pagination changes
   */
  onPaginationChange: (
    updater: PaginationState | ((prev: PaginationState) => PaginationState)
  ) => void
  /**
   * Total number of items (for server-side pagination)
   */
  totalItems?: number
  /**
   * Whether the table is currently loading data
   */
  isLoading?: boolean
  /**
   * Whether the table is currently fetching data (e.g., page change)
   */
  isFetching?: boolean
  /**
   * Available page size options
   * @default [10, 20, 30, 40, 50, 100]
   */
  pageSizeOptions?: number[]
  /**
   * Show selection count in pagination
   */
  showSelectionCount?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Pagination component for DataTable
 *
 * Includes page size selector, page navigation, and entry info
 */
export function DataTablePagination<TData>({
  table,
  pagination,
  onPaginationChange,
  totalItems,
  isLoading = false,
  isFetching = false,
  pageSizeOptions = [10, 20, 30, 40, 50, 100],
  showSelectionCount = true,
  className,
}: DataTablePaginationProps<TData>) {
  const isDisabled = isLoading || isFetching

  // Calculate pagination values
  const computedPageCount =
    totalItems !== undefined
      ? Math.ceil(totalItems / pagination.pageSize)
      : table.getPageCount()

  // Keep the UI stable even when there are 0 total rows.
  // (TanStack pageCount=0 can lead to negative page indexes when navigating.)
  const pageCount = Math.max(1, computedPageCount)

  const totalRows = totalItems ?? table.getFilteredRowModel().rows.length
  const from = totalRows > 0 ? pagination.pageIndex * pagination.pageSize + 1 : 0
  const to = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  // Generate page numbers to display (max 5)
  const getPageNumbers = () => {
    const maxPages = 5
    const pages: number[] = []

    if (pageCount <= maxPages) {
      for (let i = 0; i < pageCount; i++) pages.push(i)
    } else if (pagination.pageIndex <= 2) {
      for (let i = 0; i < maxPages; i++) pages.push(i)
    } else if (pagination.pageIndex >= pageCount - 3) {
      for (let i = pageCount - maxPages; i < pageCount; i++) pages.push(i)
    } else {
      for (let i = pagination.pageIndex - 2; i <= pagination.pageIndex + 2; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  const handlePageSizeChange = (value: string) => {
    onPaginationChange((prev) => ({
      ...prev,
      pageSize: Number(value),
      pageIndex: 0, // Reset to first page when changing page size
    }))
  }

  const goToPage = (pageIndex: number) => {
    onPaginationChange((prev) => ({ ...prev, pageIndex }))
  }

  const goToPreviousPage = () => {
    onPaginationChange((prev) => ({
      ...prev,
      pageIndex: Math.max(0, prev.pageIndex - 1),
    }))
  }

  const goToNextPage = () => {
    onPaginationChange((prev) => ({
      ...prev,
      pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
    }))
  }

  const goToFirstPage = () => {
    onPaginationChange((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const goToLastPage = () => {
    onPaginationChange((prev) => ({ ...prev, pageIndex: pageCount - 1 }))
  }

  const canGoPrevious = pagination.pageIndex > 0
  const canGoNext = pagination.pageIndex < pageCount - 1

  return (
    <div
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-1',
        className
      )}
    >
      {/* Entry info */}
      <div className="text-sm text-muted-foreground">
        {isFetching ? (
          <span className="flex items-center gap-2">
            <span className="relative flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
            </span>
            Loading...
          </span>
        ) : (
          <>
            Showing{' '}
            <span className="font-medium text-foreground">{from}</span> to{' '}
            <span className="font-medium text-foreground">{to}</span> of{' '}
            <span className="font-medium text-foreground">{totalRows}</span> entries
            {showSelectionCount && selectedCount > 0 && (
              <span className="ml-4">
                (<span className="font-medium text-foreground">{selectedCount}</span>{' '}
                selected)
              </span>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">
            Rows per page:
          </span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={handlePageSizeChange}
            disabled={isDisabled}
          >
            <SelectTrigger className="h-9 w-[70px]">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          {/* First page */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToFirstPage}
            disabled={!canGoPrevious || isDisabled}
            className="h-9 w-9"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>

          {/* Previous page */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousPage}
            disabled={!canGoPrevious || isDisabled}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((pageIndex) => (
              <Button
                key={pageIndex}
                variant={pagination.pageIndex === pageIndex ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => goToPage(pageIndex)}
                disabled={isDisabled}
              >
                {pageIndex + 1}
              </Button>
            ))}
          </div>

          {/* Next page */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={!canGoNext || isDisabled}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>

          {/* Last page */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToLastPage}
            disabled={!canGoNext || isDisabled}
            className="h-9 w-9"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export type { DataTablePaginationProps }
