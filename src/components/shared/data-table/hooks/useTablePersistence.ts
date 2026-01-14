import { useState, useEffect, useCallback } from 'react'
import type {
  VisibilityState,
  ColumnPinningState,
  ColumnSizingState,
  SortingState,
} from '@tanstack/react-table'

interface PersistedTableState {
  columnVisibility?: VisibilityState
  columnPinning?: ColumnPinningState
  columnSizing?: ColumnSizingState
  sorting?: SortingState
}

interface UseTablePersistenceOptions {
  /**
   * Unique key for localStorage. If not provided, persistence is disabled.
   */
  key?: string
  /**
   * Storage prefix
   * @default 'table-state'
   */
  prefix?: string
  /**
   * Debounce delay for saving state (ms)
   * @default 500
   */
  saveDelay?: number
  /**
   * Which state properties to persist
   * @default ['columnVisibility', 'columnPinning', 'columnSizing']
   */
  persist?: Array<keyof PersistedTableState>
}

interface UseTablePersistenceReturn {
  /**
   * Initial state loaded from storage
   */
  initialState: PersistedTableState
  /**
   * Save state to storage
   */
  saveState: (state: PersistedTableState) => void
  /**
   * Clear persisted state
   */
  clearState: () => void
  /**
   * Whether persistence is enabled
   */
  isEnabled: boolean
}

const DEFAULT_PERSIST: Array<keyof PersistedTableState> = [
  'columnVisibility',
  'columnPinning',
  'columnSizing',
]

/**
 * Hook for persisting table state to localStorage
 *
 * @example
 * ```tsx
 * const { initialState, saveState } = useTablePersistence({
 *   key: 'users-table',
 *   persist: ['columnVisibility', 'sorting']
 * })
 *
 * // Pass initialState to table
 * const table = useReactTable({
 *   initialState: {
 *     columnVisibility: initialState.columnVisibility,
 *     sorting: initialState.sorting,
 *   },
 *   // ...
 * })
 *
 * // Save on state change
 * useEffect(() => {
 *   saveState({
 *     columnVisibility: table.getState().columnVisibility,
 *     sorting: table.getState().sorting,
 *   })
 * }, [table.getState().columnVisibility, table.getState().sorting])
 * ```
 */
export function useTablePersistence(
  options: UseTablePersistenceOptions = {}
): UseTablePersistenceReturn {
  const {
    key,
    prefix = 'table-state',
    saveDelay = 500,
    persist = DEFAULT_PERSIST,
  } = options

  const storageKey = key ? `${prefix}-${key}` : null
  const isEnabled = storageKey !== null

  // Load initial state from localStorage
  const [initialState] = useState<PersistedTableState>(() => {
    if (!storageKey) return {}

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedTableState
        // Filter to only include requested properties
        const filtered: PersistedTableState = {}
        for (const prop of persist) {
          if (parsed[prop] !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (filtered as any)[prop] = parsed[prop]
          }
        }
        return filtered
      }
    } catch (error) {
      console.warn(`Failed to load table state for ${storageKey}:`, error)
    }

    return {}
  })

  // Debounced save function
  const [pendingState, setPendingState] = useState<PersistedTableState | null>(null)

  useEffect(() => {
    if (!storageKey || !pendingState) return

    const timer = setTimeout(() => {
      try {
        // Filter to only save requested properties
        const toSave: PersistedTableState = {}
        for (const prop of persist) {
          if (pendingState[prop] !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (toSave as any)[prop] = pendingState[prop]
          }
        }
        localStorage.setItem(storageKey, JSON.stringify(toSave))
      } catch (error) {
        console.warn(`Failed to save table state for ${storageKey}:`, error)
      }
      setPendingState(null)
    }, saveDelay)

    return () => clearTimeout(timer)
  }, [pendingState, storageKey, saveDelay, persist])

  const saveState = useCallback((state: PersistedTableState) => {
    if (!isEnabled) return
    setPendingState(state)
  }, [isEnabled])

  const clearState = useCallback(() => {
    if (!storageKey) return
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn(`Failed to clear table state for ${storageKey}:`, error)
    }
  }, [storageKey])

  return {
    initialState,
    saveState,
    clearState,
    isEnabled,
  }
}

export type {
  PersistedTableState,
  UseTablePersistenceOptions,
  UseTablePersistenceReturn,
}
