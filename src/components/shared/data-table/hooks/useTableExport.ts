import { useCallback } from 'react'
import type { Table, Column, Row } from '@tanstack/react-table'

interface ExportOptions {
  /**
   * Only export selected rows
   * @default false
   */
  selectedOnly?: boolean
  /**
   * Custom filename (without extension)
   */
  filename?: string
  /**
   * Include headers in export
   * @default true
   */
  includeHeaders?: boolean
  /**
   * Column IDs to exclude from export
   * @default ['select', 'actions']
   */
  excludeColumns?: string[]
}

interface UseTableExportOptions<TData> {
  /**
   * TanStack Table instance
   */
  table: Table<TData>
  /**
   * Default filename for exports
   * @default 'export'
   */
  defaultFilename?: string
}

interface UseTableExportReturn {
  /**
   * Export table data to CSV format
   */
  exportToCSV: (options?: ExportOptions) => void
  /**
   * Export table data to JSON format
   */
  exportToJSON: (options?: ExportOptions) => void
  /**
   * Get export data as array (for custom export formats)
   */
  getExportData: (options?: ExportOptions) => {
    headers: string[]
    rows: string[][]
  }
}

const DEFAULT_EXCLUDE_COLUMNS = ['select', 'actions', 'expand']

/**
 * Properly escape a value for CSV format
 * Handles commas, quotes, and newlines
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // If contains comma, quote, newline, or carriage return, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape existing quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Format a value for export, handling special types
 */
function formatExportValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString()
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(formatExportValue).join(', ')
  }

  // Handle objects
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[Object]'
    }
  }

  return String(value)
}

/**
 * Get column header text from column definition
 */
function getColumnHeader<TData>(column: Column<TData, unknown>): string {
  const header = column.columnDef.header

  if (typeof header === 'string') {
    return header
  }

  // Fall back to column ID, converted from snake_case to Title Case
  return column.id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Hook for exporting table data to various formats
 *
 * @example
 * ```tsx
 * const { exportToCSV, exportToJSON } = useTableExport({
 *   table,
 *   defaultFilename: 'users'
 * })
 *
 * return (
 *   <>
 *     <Button onClick={() => exportToCSV()}>Export CSV</Button>
 *     <Button onClick={() => exportToCSV({ selectedOnly: true })}>
 *       Export Selected
 *     </Button>
 *   </>
 * )
 * ```
 */
export function useTableExport<TData>({
  table,
  defaultFilename = 'export',
}: UseTableExportOptions<TData>): UseTableExportReturn {
  const getExportData = useCallback(
    (options: ExportOptions = {}) => {
      const {
        selectedOnly = false,
        excludeColumns = DEFAULT_EXCLUDE_COLUMNS,
      } = options

      // Get rows to export
      const rows: Row<TData>[] = selectedOnly
        ? table.getFilteredSelectedRowModel().rows
        : table.getFilteredRowModel().rows

      // Get columns to export (excluding specified columns)
      const columns = table
        .getAllLeafColumns()
        .filter((col) => !excludeColumns.includes(col.id) && col.getIsVisible())

      // Build headers
      const headers = columns.map((col) => getColumnHeader(col))

      // Build rows
      const exportRows = rows.map((row) =>
        columns.map((col) => {
          const value = row.getValue(col.id)

          // Check for custom export formatter in column meta
          const meta = col.columnDef.meta as { exportFormatter?: (value: unknown) => string } | undefined
          if (meta?.exportFormatter) {
            return meta.exportFormatter(value)
          }

          return formatExportValue(value)
        })
      )

      return { headers, rows: exportRows }
    },
    [table]
  )

  const exportToCSV = useCallback(
    (options: ExportOptions = {}) => {
      const {
        filename = defaultFilename,
        includeHeaders = true,
      } = options

      const { headers, rows } = getExportData(options)

      // Build CSV content
      const csvLines: string[] = []

      if (includeHeaders) {
        csvLines.push(headers.map(escapeCSV).join(','))
      }

      for (const row of rows) {
        csvLines.push(row.map(escapeCSV).join(','))
      }

      const csvContent = csvLines.join('\n')

      // Create and trigger download
      const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [getExportData, defaultFilename]
  )

  const exportToJSON = useCallback(
    (options: ExportOptions = {}) => {
      const {
        filename = defaultFilename,
        selectedOnly = false,
        excludeColumns = DEFAULT_EXCLUDE_COLUMNS,
      } = options

      // Get rows to export
      const rows: Row<TData>[] = selectedOnly
        ? table.getFilteredSelectedRowModel().rows
        : table.getFilteredRowModel().rows

      // Get columns to export
      const columnIds = table
        .getAllLeafColumns()
        .filter((col) => !excludeColumns.includes(col.id) && col.getIsVisible())
        .map((col) => col.id)

      // Build JSON data
      const jsonData = rows.map((row) => {
        const obj: Record<string, unknown> = {}
        for (const colId of columnIds) {
          obj[colId] = row.getValue(colId)
        }
        return obj
      })

      // Create and trigger download
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: 'application/json;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [table, defaultFilename]
  )

  return {
    exportToCSV,
    exportToJSON,
    getExportData,
  }
}

export type { ExportOptions, UseTableExportOptions, UseTableExportReturn }
