import type { AttributeTypeConfig } from './attribute'

// A type expression, not an arbitrary SQL fragment. Qualified/quoted names,
// numeric modifiers and arrays are allowed; constraints and statements are not.
const identifier = '(?:[A-Za-z_][A-Za-z0-9_$]*|"(?:[^"\\u0000]|"")+")'
const modifiers = '(?:\\s*\\(\\s*\\d+\\s*(?:,\\s*\\d+\\s*)?\\))?'
const namedType = `${identifier}(?:\\.${identifier})?${modifiers}`
const multiwordType = `(?:DOUBLE\\s+PRECISION|(?:CHARACTER|BIT)\\s+VARYING)${modifiers}`
const temporalType = `(?:TIMESTAMP|TIME)${modifiers}\\s+(?:WITH|WITHOUT)\\s+TIME\\s+ZONE`
const freeTypePattern = new RegExp(`^(?:${namedType}|${multiwordType}|${temporalType})(?:\\s*\\[\\s*\\])*\\s*$`, 'i')

export function isValidFreeSqlType(value: string): boolean {
  return value.trim().length <= 256 && freeTypePattern.test(value.trim())
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} doit être un objet.`)
  return value as Record<string, unknown>
}

function choice<T extends string | number>(value: unknown, values: readonly T[], field: string): T {
  const found = values.find((item) => item === value)
  if (found === undefined) throw new Error(`${field} est invalide.`)
  return found
}

function integer(value: unknown, min: number, max: number, field: string): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${field} doit être un entier entre ${min} et ${max}.`)
  }
  return value
}

/** Validation partagée par l'import, le formulaire et la génération SQL. */
export function parseAttributeTypeConfig(value: unknown): AttributeTypeConfig | undefined {
  if (value === undefined) return undefined
  const config = record(value, 'typeConfig')
  const keys = Object.keys(config)
  if (keys.length !== 1 || !['text', 'numeric', 'dateTime', 'other'].includes(keys[0])) {
    throw new Error('Choisissez une seule famille de type.')
  }
  if (config.text !== undefined) {
    const text = record(config.text, 'Texte')
    const charset = choice(text.charset, ['ASCII', 'UNICODE', 'BINARY'] as const, 'Jeu de caractères')
    const storage = choice(text.storage, ['VARIABLE', 'FIXED', 'LARGE'] as const, 'Stockage')
    const length = integer(text.length, 1, 10000, 'Longueur')
    if (text.collation !== undefined && (typeof text.collation !== 'string' || text.collation.includes('\0') || text.collation.length > 256)) {
      throw new Error('La collation doit être un nom texte valide.')
    }
    // Older versions incorrectly persisted collation for binary data.
    const collation = charset !== 'BINARY' && typeof text.collation === 'string' ? text.collation.trim() : ''
    return { text: { charset, storage, ...(storage !== 'LARGE' && length !== undefined ? { length } : {}), ...(collation ? { collation } : {}) } }
  }
  if (config.numeric !== undefined) {
    const numeric = record(config.numeric, 'Numérique')
    const kind = choice(numeric.kind, ['INTEGER', 'DECIMAL', 'REAL', 'MONEY', 'COUNTER'] as const, 'Type numérique')
    const bits = numeric.bits === undefined ? undefined : choice(numeric.bits, [8, 16, 32, 64] as const, 'Taille')
    const precision = integer(numeric.precision, 1, 1000, 'Nombre de chiffres')
    const scale = integer(numeric.scale, 0, precision ?? 15, 'Décimales')
    const floating = numeric.floating === undefined ? undefined : choice(numeric.floating, ['SINGLE', 'DOUBLE'] as const, 'Précision réelle')
    return { numeric: { kind, ...(kind === 'INTEGER' && bits !== undefined ? { bits } : {}), ...(kind === 'DECIMAL' ? { ...(precision !== undefined ? { precision } : {}), ...(scale !== undefined ? { scale } : {}) } : {}), ...(kind === 'REAL' && floating ? { floating } : {}) } }
  }
  if (config.dateTime !== undefined) {
    const date = record(config.dateTime, 'Date / Heure')
    const kind = choice(date.kind, ['DATE', 'TIME', 'DATETIME'] as const, 'Type temporel')
    if (date.timezone !== undefined && typeof date.timezone !== 'boolean') throw new Error('Fuseau horaire doit être booléen.')
    return { dateTime: { kind, ...(kind === 'DATETIME' && date.timezone !== undefined ? { timezone: date.timezone } : {}) } }
  }
  const other = record(config.other, 'Autre')
  const kind = choice(other.kind, ['BOOLEAN', 'XML', 'GEOMETRIC', 'GEOGRAPHIC', 'FREE'] as const, 'Autre type')
  if (kind === 'FREE') {
    if (typeof other.freeType !== 'string' || !isValidFreeSqlType(other.freeType)) {
      throw new Error('Saisissez un type PostgreSQL valide (ex. JSONB, DOUBLE PRECISION, public.mon_type ou TEXT[]), sans contrainte SQL.')
    }
    return { other: { kind, freeType: other.freeType.trim() } }
  }
  return { other: { kind } }
}
