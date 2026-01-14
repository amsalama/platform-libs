import type { PaginationParams, PaginatedResponse } from '@/types/pagination'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function pickNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function pickBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function unwrapContainer(raw: unknown): unknown {
  if (!isRecord(raw)) return raw

  // Common API wrappers
  if ('data' in raw) {
    const data = (raw as UnknownRecord).data
    // If the wrapper contains another object, unwrap recursively.
    return unwrapContainer(data)
  }

  if ('result' in raw) {
    return unwrapContainer((raw as UnknownRecord).result)
  }

  return raw
}

function extractItems<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (!isRecord(raw)) return []

  const items = (raw as UnknownRecord).items
  if (Array.isArray(items)) return items as T[]

  const results = (raw as UnknownRecord).results
  if (Array.isArray(results)) return results as T[]

  // Some APIs use `data` as the list itself.
  const data = (raw as UnknownRecord).data
  if (Array.isArray(data)) return data as T[]

  return []
}

function extractTotal(raw: unknown): number | undefined {
  if (!isRecord(raw)) return undefined

  return (
    pickNumber(raw.total) ??
    pickNumber(raw.count) ??
    pickNumber((raw as UnknownRecord).total_count) ??
    pickNumber((raw as UnknownRecord).totalCount)
  )
}

function extractLimit(raw: unknown): number | undefined {
  if (!isRecord(raw)) return undefined
  return pickNumber(raw.limit) ?? pickNumber((raw as UnknownRecord).page_size) ?? pickNumber((raw as UnknownRecord).pageSize)
}

function extractOffset(raw: unknown): number | undefined {
  if (!isRecord(raw)) return undefined
  return pickNumber(raw.offset) ?? pickNumber((raw as UnknownRecord).skip)
}

function extractHasMore(raw: unknown): boolean | undefined {
  if (!isRecord(raw)) return undefined
  return pickBoolean((raw as UnknownRecord).has_more) ?? pickBoolean((raw as UnknownRecord).hasMore)
}

export function normalizePaginatedResponse<T>(
  rawInput: unknown,
  params?: PaginationParams,
): PaginatedResponse<T> {
  const raw = unwrapContainer(rawInput)
  const items = extractItems<T>(raw)

  const limit = extractLimit(raw) ?? params?.limit ?? 10
  const offset = extractOffset(raw) ?? params?.offset ?? 0
  const total = extractTotal(raw) ?? items.length

  const hasMore = extractHasMore(raw) ?? items.length + offset < total

  return {
    items,
    total,
    limit,
    offset,
    has_more: hasMore,
  }
}
