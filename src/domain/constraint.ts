export const CONSTRAINT_KINDS = [
  'exclusion',
  'totality',
  'partition',
  'inclusion',
  'simultaneity',
  'custom',
] as const

export type ModelConstraintKind = (typeof CONSTRAINT_KINDS)[number]

export type ModelConstraint = {
  id: string
  name: string
  description: string
  kind: ModelConstraintKind
  targetIds: string[]
  position: { x: number; y: number }
}

export function isModelConstraintKind(value: unknown): value is ModelConstraintKind {
  return CONSTRAINT_KINDS.includes(value as ModelConstraintKind)
}

export function isModelConstraint(value: unknown): value is ModelConstraint {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ModelConstraint>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    isModelConstraintKind(item.kind) &&
    Array.isArray(item.targetIds) &&
    item.targetIds.every((id) => typeof id === 'string') &&
    typeof item.position === 'object' &&
    item.position !== null
  )
}

export function createModelConstraint(
  id: string,
  name = 'CONTRAINTE',
  position = { x: 0, y: 0 },
): ModelConstraint {
  return {
    id,
    name,
    description: '',
    kind: 'exclusion',
    targetIds: [],
    position,
  }
}

export const CONSTRAINT_KIND_META: Record<ModelConstraintKind, { mark: string; label: string }> = {
  exclusion: { mark: 'X', label: 'Exclusion' },
  totality: { mark: 'T', label: 'Totalité' },
  partition: { mark: 'XT', label: 'Partition' },
  inclusion: { mark: 'I', label: 'Inclusion' },
  simultaneity: { mark: 'S', label: 'Simultanéité' },
  custom: { mark: 'C', label: 'Libre' },
}
