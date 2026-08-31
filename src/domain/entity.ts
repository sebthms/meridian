import type { Attribute } from './attribute'
import { isPrimaryIdentifier, type Identifier } from './identifier'

export type Entity = {
  id: string
  name: string
  attributes: Attribute[]
  identifiers: Identifier[]
  position: {
    x: number
    y: number
  }
}

export function isEntity(value: unknown): value is Entity {
  if (!value || typeof value !== 'object') return false
  const e = value as {
    id?: unknown
    name?: unknown
    attributes?: unknown
    identifiers?: unknown
    position?: unknown
  }
  return (
    typeof e.id === 'string' &&
    typeof e.name === 'string' &&
    Array.isArray(e.attributes) &&
    Array.isArray(e.identifiers) &&
    typeof e.position === 'object' &&
    e.position !== null
  )
}

export function createEntity(id: string, name = '', position = { x: 0, y: 0 }): Entity {
  return { id, name, attributes: [], identifiers: [], position }
}

export function getEntityAttributesInIdentifiers(entity: Entity): Attribute[] {
  const ids = new Set(entity.identifiers.flatMap((i) => i.attributeIds))
  return entity.attributes.filter((a) => ids.has(a.id))
}

export function getPrimaryIdentifier(entity: Entity): Identifier | undefined {
  return entity.identifiers.find((identifier, index, identifiers) => isPrimaryIdentifier(identifier, index, identifiers))
}

export function getAlternateIdentifiers(entity: Entity): Identifier[] {
  return entity.identifiers.filter((identifier, index, identifiers) => !isPrimaryIdentifier(identifier, index, identifiers))
}

export function isIdentifierAttribute(entity: Entity, attributeId: string): boolean {
  return entity.identifiers.some((i) => i.attributeIds.includes(attributeId))
}
