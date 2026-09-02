export type ConceptualType = 'TEXT' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'BOOLEAN'

export type TextCharset = 'ASCII' | 'UNICODE' | 'BINARY'
export type TextStorage = 'VARIABLE' | 'FIXED' | 'LARGE'
export type NumericKind = 'INTEGER' | 'DECIMAL' | 'REAL' | 'MONEY' | 'COUNTER'
export type NumericBits = 8 | 16 | 32 | 64
export type DateTimeKind = 'DATE' | 'TIME' | 'DATETIME'
export type OtherKind = 'BOOLEAN' | 'XML' | 'GEOMETRIC' | 'GEOGRAPHIC' | 'FREE'

export type AttributeTypeConfig = {
  text?: {
    charset: TextCharset
    storage: TextStorage
    length?: number
    collation?: string
  }
  numeric?: {
    kind: NumericKind
    bits?: NumericBits
    precision?: number
    scale?: number
    floating?: 'SINGLE' | 'DOUBLE'
  }
  dateTime?: {
    kind: DateTimeKind
    timezone?: boolean
  }
  other?: {
    kind: OtherKind
    freeType?: string
  }
}

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
  logicalName?: string
  conceptualType: ConceptualType
  nullable?: boolean
  unique?: boolean
  description?: string
  /** Paramètres avancés du type, absents dans les anciens projets. */
  typeConfig?: AttributeTypeConfig
  /** Position de la propriété dans l’identifiant composé, si applicable. */
  identifierOrder?: number
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
