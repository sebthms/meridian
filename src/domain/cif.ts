import type { Association } from './association'

export type FunctionalDependencyConstraint = {
  id: string
  name: string
  sourceEntityId: string
  targetEntityId: string
  description: string
  associationId?: string
  position: { x: number; y: number }
}

export function isFunctionalDependencyConstraint(value: unknown): value is FunctionalDependencyConstraint {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<FunctionalDependencyConstraint>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.sourceEntityId === 'string' &&
    typeof item.targetEntityId === 'string' &&
    typeof item.description === 'string' &&
    (item.associationId === undefined || typeof item.associationId === 'string') &&
    typeof item.position === 'object' &&
    item.position !== null
  )
}

export function createFunctionalDependencyConstraint(
  id: string,
  name = 'CIF',
  position = { x: 0, y: 0 },
): FunctionalDependencyConstraint {
  return {
    id,
    name,
    sourceEntityId: '',
    targetEntityId: '',
    description: '',
    position,
  }
}

/** Association déjà présente dans le MCD qui porte source → cible (max cible = 1). */
export function findFunctionalAssociation(
  project: { associations: Association[] },
  sourceEntityId: string,
  targetEntityId: string,
  associationId?: string,
): Association | undefined {
  if (!sourceEntityId || !targetEntityId || sourceEntityId === targetEntityId) return undefined
  const candidates = project.associations.filter((association) => {
    if (association.participants.length !== 2) return false
    const source = association.participants.find((participant) => participant.entityId === sourceEntityId)
    const target = association.participants.find((participant) => participant.entityId === targetEntityId)
    return Boolean(source && target && target.cardinality.max === 1)
  })
  if (associationId) return candidates.find((association) => association.id === associationId)
  return candidates[0]
}
