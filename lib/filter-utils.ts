export function sanitizeFilterValue<T extends string>(value: T | undefined | null): T | undefined {
  if (!value) return undefined
  if (value === 'any') return undefined
  if (value.startsWith('__')) return undefined
  return value
}

export interface PillSearchFilters {
  imprint?: string
  shape?: string
  color?: string
}

export function buildSearchQuery(filters: PillSearchFilters): PillSearchFilters {
  return {
    imprint: filters.imprint?.trim() || undefined,
    shape: sanitizeFilterValue(filters.shape),
    color: sanitizeFilterValue(filters.color),
  }
}
