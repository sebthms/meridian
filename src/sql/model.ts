export type ConceptualType = 'TEXT' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'BOOLEAN'
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

function safeFreeType(value: string | undefined): string {
  const type = value?.trim() ?? ''
  return /^[A-Za-z][A-Za-z0-9_]*(?:\s*\(\s*[0-9]+(?:\s*,\s*[0-9]+)?\s*\))?$/.test(type) ? type : 'TEXT'
}

import type { Attribute } from '@/domain'

/** Traduit les paramètres avancés du formulaire en type PostgreSQL concret. */
export function attributeToSql(attribute: Pick<Attribute, 'conceptualType'> & Partial<Pick<Attribute, 'typeConfig'>>): SqlType {
  const config = attribute.typeConfig
  if (config?.text) {
    const { charset, storage, length, collation } = config.text
    let type = storage === 'LARGE' ? 'TEXT' : storage === 'FIXED' ? `CHAR(${length ?? 50})` : `VARCHAR(${length ?? 50})`
    if (charset === 'BINARY') type = storage === 'LARGE' ? 'BYTEA' : `BYTEA /* longueur ${length ?? 50} */`
    return collation && type !== 'BYTEA' ? `${type} COLLATE "${collation.replace(/"/g, '')}"` : type
  }
  if (config?.numeric) {
    const { kind, bits, precision, scale, floating } = config.numeric
    if (kind === 'INTEGER') return bits === 8 || bits === 16 ? 'SMALLINT' : bits === 64 ? 'BIGINT' : 'INTEGER'
    if (kind === 'DECIMAL') return `NUMERIC(${precision ?? 15},${scale ?? 2})`
    if (kind === 'REAL') return floating === 'DOUBLE' ? 'DOUBLE PRECISION' : 'REAL'
    if (kind === 'MONEY') return 'MONEY'
    if (kind === 'COUNTER') return 'BIGSERIAL'
  }
  if (config?.dateTime) {
    if (config.dateTime.kind === 'TIME') return `TIME${config.dateTime.timezone ? ' WITH TIME ZONE' : ''}`
    if (config.dateTime.kind === 'DATETIME') return `TIMESTAMP${config.dateTime.timezone ? ' WITH TIME ZONE' : ''}`
    return 'DATE'
  }
  if (config?.other) {
    if (config.other.kind === 'XML') return 'XML'
    if (config.other.kind === 'GEOMETRIC') return 'POINT'
    if (config.other.kind === 'GEOGRAPHIC') return 'INET'
    if (config.other.kind === 'FREE') return safeFreeType(config.other.freeType)
  }
  return conceptualToSql(attribute.conceptualType)
}
