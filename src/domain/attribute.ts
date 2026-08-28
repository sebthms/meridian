export type ConceptualType = 'TEXT' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'BOOLEAN'

export const CONCEPTUAL_TYPES: readonly ConceptualType[] = [
  'TEXT',
  'INTEGER',
  'DECIMAL',
  'DATE',
  'BOOLEAN',
] as const

export type Attribute = {
  id: string
  name: string
  conceptualType: ConceptualType
  nullable?: boolean
  unique?: boolean
  description?: string
}

export function isAttribute(value: unknown): value is Attribute {
  if (!value || typeof value !== 'object') return false
  const a = value as { id?: unknown; name?: unknown; conceptualType?: unknown }
  return (
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    CONCEPTUAL_TYPES.includes(a.conceptualType as ConceptualType)
  )
}

export function createAttribute(
  id: string,
  name = '',
  conceptualType: ConceptualType = 'TEXT',
): Attribute {
  return { id, name, conceptualType, nullable: false }
}