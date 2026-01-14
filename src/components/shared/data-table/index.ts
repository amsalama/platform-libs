// Main DataTable component (will be updated in Phase 4)
export { DataTable } from '../DataTable'

// Subcomponents
export { DataTableEmptyState } from './DataTableEmptyState'
export type { EmptyStateConfig, DataTableEmptyStateProps } from './DataTableEmptyState'

export { DataTableLoading, DataTableFetchingIndicator, DataTableFetchingOverlay } from './DataTableLoading'
export type { DataTableLoadingProps } from './DataTableLoading'

export { DataTableToolbar } from './DataTableToolbar'
export type { BulkAction, DataTableToolbarProps } from './DataTableToolbar'

export { DataTablePagination } from './DataTablePagination'
export type { DataTablePaginationProps } from './DataTablePagination'

export { DataTableColumnHeader, DataTableSimpleHeader } from './DataTableColumnHeader'
export type { DataTableColumnHeaderProps } from './DataTableColumnHeader'

export { DataTableViewModal } from './DataTableViewModal'
export type { DataTableViewModalProps } from './DataTableViewModal'

// Hooks
export * from './hooks'
