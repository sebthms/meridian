export type ConceptualType = 'TEXT' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'BOOLEAN'
export type SqlType = 'TEXT' | 'INTEGER' | 'NUMERIC' | 'DATE' | 'BOOLEAN'

const CONCEPTUAL_TO_SQL: Record<ConceptualType, SqlType> = {
  TEXT: 'TEXT',
  INTEGER: 'INTEGER',
  DECIMAL: 'NUMERIC',
  DATE: 'DATE',
  BOOLEAN: 'BOOLEAN',
}

export function conceptualToSql(type: ConceptualType): SqlType {
  return CONCEPTUAL_TO_SQL[type]
}