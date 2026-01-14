import { useState, useEffect, useCallback, Fragment, useMemo } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  VisibilityState,
  getPaginationRowModel,
  RowSelectionState,
  getExpandedRowModel,
  PaginationState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useTableSearch } from './data-table/hooks/useTableSearch'
import { useTablePersistence } from './data-table/hooks/useTablePersistence'
import { useTableExport } from './data-table/hooks/useTableExport'
import { DataTableToolbar, type BulkAction } from './data-table/DataTableToolbar'
import { DataTablePagination } from './data-table/DataTablePagination'
import { DataTableLoading, DataTableFetchingOverlay } from './data-table/DataTableLoading'
import { DataTableEmptyState, type EmptyStateConfig } from './data-table/DataTableEmptyState'
import { DataTableViewModal } from './data-table/DataTableViewModal'

// =============================================================================
// Types
// =============================================================================

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  pagination?: boolean
  pageSize?: number
  totalItems?: number
  paginationState?: PaginationState
  enableRowSelection?: boolean
  enableRowExpansion?: boolean
  enableColumnPinning?: boolean
  enableColumnResizing?: boolean
  enableMultiSort?: boolean
  enableColumnHiding?: boolean
  isLoading?: boolean
  isFetching?: boolean
  emptyState?: EmptyStateConfig
  enableRowClick?: boolean
  onRowClick?: (row: TData) => void
  onRowDoubleClick?: (row: TData) => void
  renderRowDetails?: (row: TData) => React.ReactNode
  renderViewModal?: (row: TData, onClose: () => void) => React.ReactNode
  bulkActions?: BulkAction<TData>[]
  exportToCSV?: boolean
  fileName?: string
  onRefresh?: () => void
  stickyHeader?: boolean
  stickyFirstColumn?: boolean
  persistedStateKey?: string
  onPaginationChange?: (state: PaginationState) => void
  variant?: 'default' | 'striped' | 'bordered' | 'compact'
}

// =============================================================================
// Component
// =============================================================================

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  pagination = true,
  pageSize = 10,
  totalItems,
  paginationState: controlledPaginationState,
  enableRowSelection = false,
  enableRowExpansion = false,
  enableColumnPinning = true,
  enableColumnResizing = true,
  enableMultiSort = false,
  enableColumnHiding = true,
  isLoading = false,
  isFetching = false,
  emptyState,
  enableRowClick = false,
  onRowClick,
  onRowDoubleClick,
  renderRowDetails,
  renderViewModal,
  bulkActions = [],
  exportToCSV = false,
  fileName = 'export',
  onRefresh,
  stickyHeader = true,
  stickyFirstColumn = true,
  persistedStateKey,
  onPaginationChange,
  variant = 'default',
}: DataTableProps<TData, TValue>) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [viewModal, setViewModal] = useState<{ open: boolean; row?: TData }>({
    open: false,
  })

  // Pagination state
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  // Keep internal pageSize in sync with prop when uncontrolled
  useEffect(() => {
    if (controlledPaginationState) return
    setInternalPagination((prev) =>
      prev.pageSize === pageSize ? prev : { ...prev, pageSize, pageIndex: 0 }
    )
  }, [controlledPaginationState, pageSize])

  const effectivePaginationState = controlledPaginationState ?? internalPagination

  // If totalItems is provided and pagination changes are handled externally,
  // assume server-side pagination (the provided `data` is already paginated).
  const isServerPagination =
    pagination && typeof totalItems === 'number' && typeof onPaginationChange === 'function'

  const handlePaginationChange = useCallback(
    (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => {
      const newState =
        typeof updater === 'function' ? updater(effectivePaginationState) : updater

      if (!controlledPaginationState) {
        setInternalPagination(newState)
      }
      onPaginationChange?.(newState)
    },
    [controlledPaginationState, effectivePaginationState, onPaginationChange]
  )

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const { value: searchValue, debouncedValue, setValue: setSearchValue } = useTableSearch({
    delay: 300,
  })

  const { initialState: persistedState, saveState } = useTablePersistence({
    key: persistedStateKey,
  })

  // Initialize persisted state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    persistedState.columnVisibility || {}
  )
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    persistedState.columnPinning || {}
  )
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    persistedState.columnSizing || {}
  )

  // Persist state changes
  useEffect(() => {
    saveState({ columnVisibility, columnPinning, columnSizing })
  }, [columnVisibility, columnPinning, columnSizing, saveState])

  // ---------------------------------------------------------------------------
  // Auto-inject selection column when enableRowSelection is true
  // ---------------------------------------------------------------------------
  const effectiveColumns = useMemo(() => {
    if (!enableRowSelection) return columns

    // Check if select column already exists
    const hasSelectColumn = columns.some((col) => 'id' in col && col.id === 'select')
    if (hasSelectColumn) return columns

    const selectColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }

    return [selectColumn, ...columns]
  }, [columns, enableRowSelection])

  // ---------------------------------------------------------------------------
  // Table Instance
  // ---------------------------------------------------------------------------
  const table = useReactTable({
    data,
    columns: effectiveColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel:
      pagination && !isServerPagination ? getPaginationRowModel() : undefined,
    getExpandedRowModel: enableRowExpansion ? getExpandedRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onGlobalFilterChange: () => {}, // Handled by debounced search
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: effectivePaginationState,
      rowSelection,
      expanded,
      columnPinning,
      columnSizing,
      globalFilter: debouncedValue,
    },
    manualPagination: isServerPagination,
    pageCount:
      isServerPagination && typeof totalItems === 'number'
        ? Math.max(1, Math.ceil(totalItems / effectivePaginationState.pageSize))
        : undefined,
    enableMultiSort,
    enablePinning: enableColumnPinning,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    enableRowSelection,
    enableSubRowSelection: true,
  })

  // Export hook
  const { exportToCSV: handleExport } = useTableExport({
    table,
    defaultFilename: fileName,
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSelectAll = useCallback(() => {
    if (table.getIsAllPageRowsSelected()) {
      table.resetRowSelection()
    } else {
      table.getFilteredRowModel().rows.forEach((row) => {
        row.toggleSelected(true)
      })
    }
  }, [table])

  const handleRowClick = useCallback(
    (row: TData) => {
      if (enableRowClick && !enableRowExpansion) {
        if (renderViewModal) {
          setViewModal({ open: true, row })
        } else if (onRowClick) {
          onRowClick(row)
        }
      }
    },
    [enableRowClick, enableRowExpansion, renderViewModal, onRowClick]
  )

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const allSelected =
    selectedRows.length > 0 &&
    selectedRows.length === table.getFilteredRowModel().rows.length
  const someSelected =
    selectedRows.length > 0 &&
    selectedRows.length < table.getFilteredRowModel().rows.length

  const getColumnPinState = (colIndex: number) => {
    if (!stickyFirstColumn) return 'none'
    return colIndex === 0 ? 'left' : 'none'
  }

  const tableVariantClass =
    variant === 'striped'
      ? '[&_tbody_tr:nth-child(even)]:bg-muted/30'
      : variant === 'bordered'
      ? '[&_td]:border [&_th]:border'
      : variant === 'compact'
      ? '[&_td]:py-2 [&_th]:py-2'
      : ''

  // ---------------------------------------------------------------------------
  // Render States
  // ---------------------------------------------------------------------------
  
  // Initial loading state - show skeleton (no data yet)
  if (isLoading && data.length === 0) {
    return <DataTableLoading rows={pageSize} columns={columns.length} />
  }

  // Empty state - no data after loading complete
  if (!isLoading && !isFetching && data.length === 0) {
    return <DataTableEmptyState config={emptyState} variant="no-data" />
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder={searchPlaceholder}
        isFetching={isFetching}
        bulkActions={bulkActions}
        enableExport={exportToCSV}
        onExport={handleExport}
        enableColumnVisibility={enableColumnHiding}
        onRefresh={onRefresh}
      />

      {/* Table */}
      <div className={cn('rounded-xl border bg-card shadow-sm relative', tableVariantClass)}>
        {/* Fetching overlay - shown when loading new page or refetching */}
        {isFetching && data.length > 0 && <DataTableFetchingOverlay />}
        
        <div className={cn(
          'overflow-x-auto',
          isFetching && 'pointer-events-none select-none'
        )}>
          <Table className="min-w-[600px]">
            <TableHeader sticky={stickyHeader}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header, colIndex) => (
                    <TableHead
                      key={header.id}
                      pinned={getColumnPinState(colIndex) as 'left' | 'right' | 'none'}
                      sortable={header.column.getCanSort()}
                      sorted={header.column.getIsSorted()}
                      onClick={header.column.getToggleSortingHandler()}
                      colSpan={header.colSpan}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {enableRowSelection && header.id === 'select' && (
                            <Checkbox
                              checked={allSelected || someSelected}
                              onCheckedChange={handleSelectAll}
                              aria-label="Select all"
                            />
                          )}
                          <span className="truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                        </div>
                      )}
                    </TableHead>
                  ))}
                  {enableRowExpansion && <TableHead className="w-12" />}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      state={
                        row.getIsSelected()
                          ? 'selected'
                          : row.getIsExpanded()
                          ? 'expanded'
                          : enableRowClick && !enableRowExpansion
                          ? 'clickable'
                          : 'default'
                      }
                      onClick={() => handleRowClick(row.original)}
                      onDoubleClick={() =>
                        onRowDoubleClick && !enableRowExpansion
                          ? onRowDoubleClick(row.original)
                          : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell, colIndex) => (
                        <TableCell
                          key={cell.id}
                          pinned={getColumnPinState(colIndex) as 'left' | 'right' | 'none'}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                      {enableRowExpansion && (
                        <TableCell className="w-12">
                          {row.getCanExpand() && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                row.toggleExpanded()
                              }}
                              className="h-8 w-8"
                              aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
                            >
                              {row.getIsExpanded() ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>

                    {/* Expanded Row Details */}
                    {row.getIsExpanded() && renderRowDetails && (
                      <TableRow>
                        <TableCell
                          colSpan={
                            columns.length +
                            (enableRowSelection ? 1 : 0) +
                            (enableRowExpansion ? 1 : 0)
                          }
                          className="p-0"
                        >
                          <div className="border-t bg-muted/30 p-4">
                            {renderRowDetails(row.original)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={
                      columns.length +
                      (enableRowSelection ? 1 : 0) +
                      (enableRowExpansion ? 1 : 0)
                    }
                    className="h-24 text-center"
                  >
                    <DataTableEmptyState variant="no-results" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <DataTablePagination
          table={table}
          pagination={effectivePaginationState}
          onPaginationChange={handlePaginationChange}
          totalItems={totalItems}
          isLoading={isLoading}
          isFetching={isFetching}
        />
      )}

      {/* View Modal */}
      {renderViewModal && (
        <DataTableViewModal
          open={viewModal.open}
          onOpenChange={(open) =>
            setViewModal({ open, row: open ? viewModal.row : undefined })
          }
          data={viewModal.row ?? null}
          renderContent={renderViewModal}
        />
      )}
    </div>
  )
}

export type { DataTableProps, BulkAction }
