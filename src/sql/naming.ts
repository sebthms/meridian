const MAX_IDENTIFIER_BYTES = 63

// PostgreSQL réserve notamment les mots-clés SQL ; le préfixe évite de générer
// un identifiant ambigu tout en conservant une convention lisible.
const RESERVED_WORDS = new Set([
  'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'authorization',
  'binary', 'both', 'case', 'cast', 'check', 'collate', 'column', 'constraint',
  'create', 'current_catalog', 'current_date', 'current_role', 'current_time',
  'current_timestamp', 'current_user', 'default', 'deferrable', 'desc', 'distinct',
  'do', 'else', 'end', 'except', 'false', 'for', 'foreign', 'freeze', 'from',
  'full', 'grant', 'group', 'having', 'ilike', 'in', 'initially', 'inner', 'intersect',
  'into', 'is', 'isnull', 'join', 'lateral', 'leading', 'left', 'like', 'limit',
  'localtime', 'localtimestamp', 'natural', 'not', 'notnull', 'null', 'offset',
  'on', 'only', 'or', 'order', 'outer', 'overlaps', 'placing', 'primary', 'references',
  'returning', 'right', 'select', 'session_user', 'similar', 'some', 'symmetric',
  'table', 'then', 'to', 'trailing', 'true', 'union', 'unique', 'user', 'using',
  'variadic', 'verbose', 'when', 'where', 'window', 'with',
])

function truncateIdentifier(value: string): string {
  // La normalisation ci-dessous produit uniquement de l'ASCII : la limite en
  // octets est donc identique à la limite en caractères.
  return value.slice(0, MAX_IDENTIFIER_BYTES)
}

/** Convertit un nom métier en identifiant SQL PostgreSQL stable et sûr. */
export function physicalIdentifier(name: string, fallback = 'unnamed'): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()

  let result = normalized || fallback
  if (/^\d/.test(result)) result = `n_${result}`
  if (RESERVED_WORDS.has(result)) result = `n_${result}`
  return truncateIdentifier(result)
}

export function constraintIdentifier(name: string): string {
  return physicalIdentifier(name, 'constraint')
}
