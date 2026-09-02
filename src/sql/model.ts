import { parseAttributeTypeConfig, type Attribute, type ConceptualType } from '@/domain'
export type { ConceptualType } from '@/domain'
export type SqlType = string

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

/** Traduit les paramètres avancés du formulaire en type PostgreSQL concret. */
export function attributeToSql(attribute: Pick<Attribute, 'conceptualType'> & Partial<Pick<Attribute, 'typeConfig'>>, options: { foreignKey?: boolean } = {}): SqlType {
  const config = parseAttributeTypeConfig(attribute.typeConfig)
  if (config?.text) {
    const { charset, storage, length, collation } = config.text
    let type = storage === 'LARGE' ? 'TEXT' : storage === 'FIXED' ? `CHAR(${length ?? 50})` : `VARCHAR(${length ?? 50})`
    if (charset === 'BINARY') type = storage === 'LARGE' ? 'BYTEA' : `BYTEA /* longueur ${length ?? 50} */`
    return collation && charset !== 'BINARY' ? `${type} COLLATE "${collation.replace(/"/g, '""')}"` : type
  }
  if (config?.numeric) {
    const { kind, bits, precision, scale, floating } = config.numeric
    if (kind === 'INTEGER') return bits === 8 || bits === 16 ? 'SMALLINT' : bits === 64 ? 'BIGINT' : 'INTEGER'
    if (kind === 'DECIMAL') return `NUMERIC(${precision ?? 15},${scale ?? Math.min(2, precision ?? 15)})`
    if (kind === 'REAL') return floating !== 'SINGLE' ? 'DOUBLE PRECISION' : 'REAL'
    if (kind === 'MONEY') return 'MONEY'
    if (kind === 'COUNTER') return options.foreignKey ? 'BIGINT' : 'BIGSERIAL'
  }
  if (config?.dateTime) {
    if (config.dateTime.kind === 'TIME') return `TIME${config.dateTime.timezone ? ' WITH TIME ZONE' : ''}`
    if (config.dateTime.kind === 'DATETIME') return `TIMESTAMP${config.dateTime.timezone ? ' WITH TIME ZONE' : ''}`
    return 'DATE'
  }
  if (config?.other) {
    if (config.other.kind === 'BOOLEAN') return 'BOOLEAN'
    if (config.other.kind === 'XML') return 'XML'
    if (config.other.kind === 'GEOMETRIC') return 'GEOMETRY'
    if (config.other.kind === 'GEOGRAPHIC') return 'GEOGRAPHY'
    if (config.other.kind === 'FREE') {
      const type = config.other.freeType!
      if (options.foreignKey && /^(smallserial|serial2)$/i.test(type)) return 'SMALLINT'
      if (options.foreignKey && /^(serial|serial4)$/i.test(type)) return 'INTEGER'
      if (options.foreignKey && /^(bigserial|serial8)$/i.test(type)) return 'BIGINT'
      return type
    }
  }
  return conceptualToSql(attribute.conceptualType)
}
