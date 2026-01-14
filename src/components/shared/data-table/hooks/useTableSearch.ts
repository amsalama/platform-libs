import { useState, useEffect, useCallback } from 'react'

interface UseTableSearchOptions {
  /**
   * Initial search value
   */
  initialValue?: string
  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  delay?: number
  /**
   * Minimum characters required before searching
   * @default 0
   */
  minChars?: number
  /**
   * Callback when debounced value changes
   */
  onSearch?: (value: string) => void
}

interface UseTableSearchReturn {
  /**
   * Current input value (updates immediately)
   */
  value: string
  /**
   * Debounced value (updates after delay)
   */
  debouncedValue: string
  /**
   * Update the search value
   */
  setValue: (value: string) => void
  /**
   * Clear the search
   */
  clear: () => void
  /**
   * Whether search is active (has value)
   */
  isActive: boolean
  /**
   * Whether currently debouncing (value !== debouncedValue)
   */
  isPending: boolean
}

/**
 * Hook for debounced table search with pending state
 *
 * @example
 * ```tsx
 * const { value, debouncedValue, setValue, clear, isPending } = useTableSearch({
 *   delay: 300,
 *   onSearch: (value) => console.log('Searching:', value)
 * })
 *
 * return (
 *   <Input
 *     value={value}
 *     onChange={(e) => setValue(e.target.value)}
 *     placeholder="Search..."
 *   />
 * )
 * ```
 */
export function useTableSearch(options: UseTableSearchOptions = {}): UseTableSearchReturn {
  const {
    initialValue = '',
    delay = 300,
    minChars = 0,
    onSearch,
  } = options

  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  // Debounce effect
  useEffect(() => {
    // Don't debounce if value is too short
    if (value.length > 0 && value.length < minChars) {
      return
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value)
      onSearch?.(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay, minChars, onSearch])

  const clear = useCallback(() => {
    setValue('')
    setDebouncedValue('')
    onSearch?.('')
  }, [onSearch])

  const isActive = debouncedValue.length > 0
  const isPending = value !== debouncedValue

  return {
    value,
    debouncedValue,
    setValue,
    clear,
    isActive,
    isPending,
  }
}

export type { UseTableSearchOptions, UseTableSearchReturn }
