export const INHERITANCE_COVERAGES = ['total', 'partial'] as const
export type InheritanceCoverage = (typeof INHERITANCE_COVERAGES)[number]

export const INHERITANCE_EXCLUSIVITIES = ['exclusive', 'overlapping'] as const
export type InheritanceExclusivity = (typeof INHERITANCE_EXCLUSIVITIES)[number]

export type Inheritance = {
  id: string
  name: string
  parentEntityId: string
  childEntityIds: string[]
  coverage: InheritanceCoverage
  exclusivity: InheritanceExclusivity
  position: { x: number; y: number }
}

export function isInheritanceCoverage(value: unknown): value is InheritanceCoverage {
  return INHERITANCE_COVERAGES.includes(value as InheritanceCoverage)
}

export function isInheritanceExclusivity(value: unknown): value is InheritanceExclusivity {
  return INHERITANCE_EXCLUSIVITIES.includes(value as InheritanceExclusivity)
}

export function isInheritance(value: unknown): value is Inheritance {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Inheritance>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.parentEntityId === 'string' &&
    Array.isArray(item.childEntityIds) &&
    item.childEntityIds.every((id) => typeof id === 'string') &&
    isInheritanceCoverage(item.coverage) &&
    isInheritanceExclusivity(item.exclusivity) &&
    typeof item.position === 'object' &&
    item.position !== null
  )
}

export function createInheritance(
  id: string,
  name = 'HERITAGE',
  position = { x: 0, y: 0 },
): Inheritance {
  return {
    id,
    name,
    parentEntityId: '',
    childEntityIds: [],
    coverage: 'total',
    exclusivity: 'exclusive',
    position,
  }
}

export function inheritanceCoverageLabel(coverage: InheritanceCoverage): string {
  return coverage === 'total' ? 'Total' : 'Partiel'
}

export function inheritanceExclusivityLabel(exclusivity: InheritanceExclusivity): string {
  return exclusivity === 'exclusive' ? 'Exclusif' : 'Chevauchant'
}

export function inheritanceMark(inheritance: Pick<Inheritance, 'coverage' | 'exclusivity'>): string {
  return `${inheritance.coverage === 'total' ? 'T' : 'P'}${inheritance.exclusivity === 'exclusive' ? 'X' : '+'}`
}
