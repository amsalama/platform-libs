import { ReactNode } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface AdminDataTableProps<TData> {
  // Data
  data: TData[]
  columns: ColumnDef<TData>[]
  columnWidths: Record<string, string>
  
  // State
  isLoading: boolean
  isFetching?: boolean
  
  // Pagination
  pagination: { pageIndex: number; pageSize: number }
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void
  totalItems: number
  
  // Row click
  onRowClick?: (row: TData) => void
  getRowKey: (row: TData) => string
  
  // Empty state
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  onEmptyAction?: () => void
  emptyActionLabel?: string
}

export function AdminDataTable<TData>({
  data,
  columns,
  columnWidths,
  isLoading,
  isFetching = false,
  pagination,
  onPaginationChange,
  totalItems,
  onRowClick,
  getRowKey,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription = 'Get started by adding your first item.',
  onEmptyAction,
  emptyActionLabel = 'Add Item',
}: AdminDataTableProps<TData>) {
  const totalPages = Math.ceil(totalItems / pagination.pageSize)
  const startItem = pagination.pageIndex * pagination.pageSize + 1
  const endItem = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalItems)

  // Generate colgroup from columnWidths
  const colWidthEntries = Object.entries(columnWidths)

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden relative">
        {/* Loading overlay for pagination */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="flex items-center gap-3 bg-card px-6 py-3 rounded-lg border border-border shadow-lg">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading...</span>
            </div>
          </div>
        )}
        
        {/* Table Header */}
        <div className="table-header overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              {colWidthEntries.map(([key, width]) => (
                <col key={key} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.id || index}
                    className={cn(
                      'px-4 py-4 text-left text-sm font-semibold uppercase text-foreground',
                      column.id === 'select' && 'w-12',
                      column.id === 'actions' && 'text-center'
                    )}
                  >
                    {typeof column.header === 'function'
                      ? column.header({ column: column as any, header: null as any, table: null as any })
                      : column.header}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Table Body */}
        <div className="bg-secondary">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              {emptyIcon}
              <p className="text-lg mt-4">{emptyTitle}</p>
              <p className="text-sm">{emptyDescription}</p>
              {onEmptyAction && (
                <Button className="mt-4" onClick={onEmptyAction}>
                  <Plus className="mr-2 h-4 w-4" />
                  {emptyActionLabel}
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full table-fixed">
              <colgroup>
                {colWidthEntries.map(([key, width]) => (
                  <col key={key} style={{ width }} />
                ))}
              </colgroup>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className="border-t border-border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={column.id || colIndex}
                        className={cn(
                          'px-4 py-4 overflow-hidden',
                          column.id === 'actions' && 'text-center'
                        )}
                      >
                        {typeof column.cell === 'function' && column.cell({
                          row: { original: row, getValue: (key: string) => (row as unknown as Record<string, unknown>)[key] },
                          getValue: () => null,
                          column: column,
                          table: null!,
                          cell: null!,
                          renderValue: () => null,
                        } as any)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <AdminDataTablePagination
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          totalItems={totalItems}
          totalPages={totalPages}
          startItem={startItem}
          endItem={endItem}
        />
      )}
    </div>
  )
}

interface AdminDataTablePaginationProps {
  pagination: { pageIndex: number; pageSize: number }
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void
  totalItems: number
  totalPages: number
  startItem: number
  endItem: number
}

export function AdminDataTablePagination({
  pagination,
  onPaginationChange,
  totalItems,
  totalPages,
  startItem,
  endItem,
}: AdminDataTablePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Results Info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalItems} results
        </span>
        <div className="flex items-center gap-2">
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => onPaginationChange({ ...pagination, pageSize: Number(value), pageIndex: 0 })}
          >
            <SelectTrigger className="w-16 h-8 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">page</span>
        </div>
      </div>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <button
          onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })}
          disabled={pagination.pageIndex === 0}
          className={cn(
            'w-8 h-8 rounded-md border flex items-center justify-center text-sm',
            pagination.pageIndex === 0
              ? 'border-border text-muted-foreground cursor-not-allowed'
              : 'border-muted-foreground text-muted-foreground hover:bg-muted'
          )}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.25 2.81264L7.175 6.88763C6.69375 7.36888 6.69375 8.15638 7.175 8.63763L11.25 12.7126" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.5 2.81264L3.425 6.88763C2.94375 7.36888 2.94375 8.15638 3.425 8.63763L7.5 12.7126" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        </button>
        {/* Previous */}
        <button
          onClick={() => onPaginationChange({ ...pagination, pageIndex: Math.max(0, pagination.pageIndex - 1) })}
          disabled={pagination.pageIndex === 0}
          className={cn(
            'w-8 h-8 rounded-md border flex items-center justify-center text-sm',
            pagination.pageIndex === 0
              ? 'border-border text-muted-foreground cursor-not-allowed'
              : 'border-muted-foreground text-muted-foreground hover:bg-muted'
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.0332 2.72002L5.68654 7.06668C5.1732 7.58002 5.1732 8.42002 5.68654 8.93335L10.0332 13.28" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        </button>
        
        

        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 5) {
            pageNum = i
          } else if (pagination.pageIndex < 3) {
            pageNum = i
          } else if (pagination.pageIndex > totalPages - 4) {
            pageNum = totalPages - 5 + i
          } else {
            pageNum = pagination.pageIndex - 2 + i
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => onPaginationChange({ ...pagination, pageIndex: pageNum })}
              className={cn(
                'w-8 h-8 rounded-md border flex items-center justify-center text-sm font-medium',
                pagination.pageIndex === pageNum
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground text-muted-foreground hover:bg-muted'
              )}
            >
              {pageNum + 1}
            </button>
          )
        })}

        {totalPages > 5 && pagination.pageIndex < totalPages - 3 && (
          <>
            <span className="text-muted-foreground">...</span>
            <button
              onClick={() => onPaginationChange({ ...pagination, pageIndex: totalPages - 1 })}
              className="w-8 h-8 rounded-md border border-muted-foreground flex items-center justify-center text-sm text-muted-foreground hover:bg-muted"
            >
              {totalPages}
            </button>
          </>
        )}

        

        {/* Next */}
        <button
          onClick={() => onPaginationChange({ ...pagination, pageIndex: Math.min(totalPages - 1, pagination.pageIndex + 1) })}
          disabled={pagination.pageIndex === totalPages - 1 || totalPages === 0}
          className={cn(
            'w-8 h-8 rounded-md border flex items-center justify-center text-sm',
            pagination.pageIndex === totalPages - 1 || totalPages === 0
              ? 'border-border text-muted-foreground cursor-not-allowed'
              : 'border-muted-foreground text-muted-foreground hover:bg-muted'
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.9668 2.72002L10.3135 7.06668C10.8268 7.58002 10.8268 8.42002 10.3135 8.93335L5.9668 13.28" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        </button>

        {/* Last page */}
        <button
          onClick={() => onPaginationChange({ ...pagination, pageIndex: totalPages - 1 })}
          disabled={pagination.pageIndex === totalPages - 1 || totalPages === 0}
          className={cn(
            'w-8 h-8 rounded-md border flex items-center justify-center text-sm',
            pagination.pageIndex === totalPages - 1 || totalPages === 0
              ? 'border-border text-muted-foreground cursor-not-allowed'
              : 'border-muted-foreground text-muted-foreground hover:bg-muted'
          )}
        >
         <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.75 2.81264L7.825 6.88763C8.30625 7.36888 8.30625 8.15638 7.825 8.63763L3.75 12.7126" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.5 2.81264L11.575 6.88763C12.0562 7.36888 12.0562 8.15638 11.575 8.63763L7.5 12.7126" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        </button>
      </div>

      {/* Go To Page */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Go To Page</span>
        <Select
          value={String(pagination.pageIndex + 1)}
          onValueChange={(value) => onPaginationChange({ ...pagination, pageIndex: Number(value) - 1 })}
          disabled={totalPages === 0}
        >
          <SelectTrigger className="w-16 h-8 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: totalPages || 1 }, (_, i) => (
              <SelectItem key={i} value={String(i + 1)}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
