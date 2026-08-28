export type Identifier = {
  id: string
  attributeIds: string[]
  name?: string
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