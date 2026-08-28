import type { Attribute } from './attribute'
import type { Cardinality } from './cardinality'

export type AssociationParticipant = {
  entityId: string
  role?: string
  cardinality: Cardinality
}

export type Association = {
  id: string
  name: string
  participants: AssociationParticipant[]
  attributes: Attribute[]
  /** Position stable sur le canvas ; absente pour les anciennes données. */
  position?: {
    x: number
    y: number
  }
}

export function isAssociation(value: unknown): value is Association {
  if (!value || typeof value !== 'object') return false
  const a = value as {
    id?: unknown
    name?: unknown
    participants?: unknown
    attributes?: unknown
  }
  return (
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    Array.isArray(a.participants) &&
    Array.isArray(a.attributes)
  )
}

export function createAssociation(
  id: string,
  name = '',
  participants: AssociationParticipant[] = [],
  position?: { x: number; y: number },
): Association {
  return { id, name, participants, attributes: [], ...(position ? { position } : {}) }
}

/** Point milieu des entités participantes (position d'ancrage par défaut). */
export function associationMidpoint(
  association: Association,
  entityPositions: Map<string, { x: number; y: number }>,
): { x: number; y: number } {
  if (association.participants.length === 0) return { x: 200, y: 200 }
  const xs = association.participants.map((p) => entityPositions.get(p.entityId)?.x ?? 0)
  const ys = association.participants.map((p) => entityPositions.get(p.entityId)?.y ?? 0)
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
}

/**
 * Garantit une position stable pour chaque association : on conserve la
 * position existante, sinon on l'ancre au point milieu des entités.
 * Évite le re-positionnement automatique quand on déplace une entité.
 */
export function ensureAssociationPositions(
  project: Pick<ProjectLike, 'entities' | 'associations'>,
): Association[] {
  const entityPositions = new Map((project.entities ?? []).map((e) => [e.id, e.position]))
  return (project.associations ?? []).map((a) => ({
    ...a,
    position: a.position ?? associationMidpoint(a, entityPositions),
  }))
}

type ProjectLike = {
  entities: Array<{ id: string; position: { x: number; y: number } }>
  associations: Association[]
}

/** MVP : les associations sont binaires, sauf réflexives (2 participations à la même entité). */
export function isReflexive(association: Association): boolean {
  if (association.participants.length !== 2) return false
  return association.participants[0].entityId === association.participants[1].entityId
}