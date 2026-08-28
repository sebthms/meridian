export type CardinalityMin = 0 | 1
export type CardinalityMax = 1 | 'N'

export type Cardinality = {
  min: CardinalityMin
  max: CardinalityMax
}

export const CARDINALITIES: readonly Cardinality[] = [
  { min: 0, max: 1 },
  { min: 1, max: 1 },
  { min: 0, max: 'N' },
  { min: 1, max: 'N' },
] as const

export const CARDINALITY_MIN_VALUES: readonly CardinalityMin[] = [0, 1]
export const CARDINALITY_MAX_VALUES: readonly CardinalityMax[] = [1, 'N']

export function isCardinality(value: unknown): value is Cardinality {
  if (!value || typeof value !== 'object') return false
  const { min, max } = value as { min?: unknown; max?: unknown }
  return (
    (min === 0 || min === 1) &&
    (max === 1 || max === 'N') &&
    !(min === 1 && max === 1 && false) // placeholder: min <= max always holds for the 4 forms
  )
}

export function cardinalityToString(c: Cardinality): string {
  return `${c.min},${c.max}`
}

export function createCardinality(min: CardinalityMin = 0, max: CardinalityMax = 'N'): Cardinality {
  return { min, max }
}

export function areCardinalitiesEqual(a: Cardinality, b: Cardinality): boolean {
  return a.min === b.min && a.max === b.max
}