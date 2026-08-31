export type Identifier = {
  id: string
  attributeIds: string[]
  name?: string
  /** Les anciens projets omettent ce champ : le premier identifiant reste principal. */
  isPrimary?: boolean
}

export function isIdentifier(value: unknown): value is Identifier {
  if (!value || typeof value !== 'object') return false
  const id = value as { id?: unknown; attributeIds?: unknown }
  return (
    typeof id.id === 'string' &&
    Array.isArray(id.attributeIds) &&
    id.attributeIds.every((a) => typeof a === 'string')
  )
}

export function createIdentifier(id: string, attributeIds: string[] = [], name?: string): Identifier {
  return { id, attributeIds, name }
}

export function isPrimaryIdentifier(identifier: Identifier, index: number, identifiers: Identifier[]): boolean {
  return identifier.isPrimary === true || (identifier.isPrimary === undefined && index === 0 && !identifiers.some((item) => item.isPrimary === true))
}
