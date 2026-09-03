import type {
  BusinessRule,
  BusinessRuleLevel,
  FunctionalDependencyConstraint,
  Inheritance,
  InheritanceCoverage,
  InheritanceExclusivity,
  ModelConstraint,
  ModelConstraintKind,
  Project,
} from '@/domain'
import {
  createBusinessRule,
  createFunctionalDependencyConstraint,
  createInheritance,
  createModelConstraint,
  isValidModelName,
  normalizeProject,
} from '@/domain'

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function uniqueName(used: Iterable<string>, base: string): string {
  const taken = new Set([...used].map((name) => name.trim().toLowerCase()))
  if (!taken.has(base.toLowerCase())) return base
  let index = 2
  while (taken.has(`${base}_${index}`.toLowerCase())) index += 1
  return `${base}_${index}`
}

function nextPosition(project: Project): { x: number; y: number } {
  const count =
    project.entities.length +
    project.associations.length +
    (project.inheritances?.length ?? 0) +
    (project.constraints?.length ?? 0) +
    (project.cifs?.length ?? 0) +
    (project.businessRules?.length ?? 0)
  return { x: 180 + count * 36, y: 220 }
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => id.trim().length > 0))]
}

export function stripDeletedReferences(project: Project, deletedIds: Set<string>): Project {
  const next = normalizeProject(project)
  const keep = (ids: string[]) => uniqueIds(ids.filter((id) => !deletedIds.has(id)))
  return {
    ...next,
    inheritances: next.inheritances
      .filter((item) => !deletedIds.has(item.id) && (item.parentEntityId === '' || !deletedIds.has(item.parentEntityId)))
      .map((item) => ({
        ...item,
        parentEntityId: deletedIds.has(item.parentEntityId) ? '' : item.parentEntityId,
        childEntityIds: keep(item.childEntityIds),
      })),
    constraints: next.constraints
      .filter((item) => !deletedIds.has(item.id))
      .map((item) => ({ ...item, targetIds: keep(item.targetIds) })),
    cifs: next.cifs
      .filter((item) => !deletedIds.has(item.id) && !deletedIds.has(item.sourceEntityId) && !deletedIds.has(item.targetEntityId))
      .map((item) => (item.associationId && deletedIds.has(item.associationId) ? { ...item, associationId: undefined } : item)),
    businessRules: next.businessRules
      .filter((item) => !deletedIds.has(item.id))
      .map((item) => ({ ...item, targetIds: keep(item.targetIds) })),
  }
}

export function createInheritanceCommand(project: Project): Project {
  const next = normalizeProject(project)
  const inheritance = createInheritance(
    uid('inh'),
    uniqueName(next.inheritances.map((item) => item.name), 'HERITAGE'),
    nextPosition(next),
  )
  return { ...next, inheritances: [...next.inheritances, inheritance] }
}

export function updateInheritance(
  project: Project,
  inheritanceId: string,
  patch: Partial<Pick<Inheritance, 'name' | 'parentEntityId' | 'childEntityIds' | 'coverage' | 'exclusivity'>>,
): Project {
  const next = normalizeProject(project)
  const current = next.inheritances.find((item) => item.id === inheritanceId)
  if (!current) return project
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim()
    if (trimmed.length === 0 || !isValidModelName(trimmed)) return project
    if (next.inheritances.some((item) => item.id !== inheritanceId && item.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return project
    }
    patch = { ...patch, name: trimmed }
  }
  if (patch.childEntityIds) {
    patch = { ...patch, childEntityIds: uniqueIds(patch.childEntityIds) }
  }
  return {
    ...next,
    inheritances: next.inheritances.map((item) => (item.id === inheritanceId ? { ...item, ...patch } : item)),
  }
}

export function setInheritanceParent(project: Project, inheritanceId: string, parentEntityId: string): Project {
  return updateInheritance(project, inheritanceId, { parentEntityId })
}

export function addInheritanceChild(project: Project, inheritanceId: string, childEntityId: string): Project {
  const next = normalizeProject(project)
  const current = next.inheritances.find((item) => item.id === inheritanceId)
  if (!current || current.parentEntityId === childEntityId || current.childEntityIds.includes(childEntityId)) return project
  return updateInheritance(next, inheritanceId, { childEntityIds: [...current.childEntityIds, childEntityId] })
}

export function removeInheritanceChild(project: Project, inheritanceId: string, childEntityId: string): Project {
  const next = normalizeProject(project)
  const current = next.inheritances.find((item) => item.id === inheritanceId)
  if (!current) return project
  return updateInheritance(next, inheritanceId, {
    childEntityIds: current.childEntityIds.filter((id) => id !== childEntityId),
  })
}

export function setInheritanceCoverage(project: Project, inheritanceId: string, coverage: InheritanceCoverage): Project {
  return updateInheritance(project, inheritanceId, { coverage })
}

export function setInheritanceExclusivity(
  project: Project,
  inheritanceId: string,
  exclusivity: InheritanceExclusivity,
): Project {
  return updateInheritance(project, inheritanceId, { exclusivity })
}

export function moveInheritance(project: Project, inheritanceId: string, position: { x: number; y: number }): Project {
  const next = normalizeProject(project)
  return {
    ...next,
    inheritances: next.inheritances.map((item) => (item.id === inheritanceId ? { ...item, position } : item)),
  }
}

export function deleteInheritance(project: Project, inheritanceId: string): Project {
  const next = normalizeProject(project)
  return stripDeletedReferences(
    { ...next, inheritances: next.inheritances.filter((item) => item.id !== inheritanceId) },
    new Set([inheritanceId]),
  )
}

export function createConstraintCommand(project: Project): Project {
  const next = normalizeProject(project)
  const constraint = createModelConstraint(
    uid('cst'),
    uniqueName(next.constraints.map((item) => item.name), 'CONTRAINTE'),
    nextPosition(next),
  )
  return { ...next, constraints: [...next.constraints, constraint] }
}

export function updateConstraint(
  project: Project,
  constraintId: string,
  patch: Partial<Pick<ModelConstraint, 'name' | 'description' | 'kind' | 'targetIds'>>,
): Project {
  const next = normalizeProject(project)
  const current = next.constraints.find((item) => item.id === constraintId)
  if (!current) return project
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim()
    if (trimmed.length === 0 || !isValidModelName(trimmed)) return project
    if (next.constraints.some((item) => item.id !== constraintId && item.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return project
    }
    patch = { ...patch, name: trimmed }
  }
  if (patch.description !== undefined) {
    patch = { ...patch, description: patch.description.trim() }
  }
  if (patch.targetIds) {
    patch = { ...patch, targetIds: uniqueIds(patch.targetIds) }
  }
  if (patch.kind !== undefined && !['exclusion', 'totality', 'partition', 'inclusion', 'simultaneity', 'custom'].includes(patch.kind)) {
    return project
  }
  return {
    ...next,
    constraints: next.constraints.map((item) => (item.id === constraintId ? { ...item, ...patch } : item)),
  }
}

export function setConstraintKind(project: Project, constraintId: string, kind: ModelConstraintKind): Project {
  return updateConstraint(project, constraintId, { kind })
}

export function addConstraintTarget(project: Project, constraintId: string, targetId: string): Project {
  const next = normalizeProject(project)
  const current = next.constraints.find((item) => item.id === constraintId)
  if (!current || current.id === targetId || current.targetIds.includes(targetId)) return project
  return updateConstraint(next, constraintId, { targetIds: [...current.targetIds, targetId] })
}

export function moveConstraint(project: Project, constraintId: string, position: { x: number; y: number }): Project {
  const next = normalizeProject(project)
  return {
    ...next,
    constraints: next.constraints.map((item) => (item.id === constraintId ? { ...item, position } : item)),
  }
}

export function deleteConstraint(project: Project, constraintId: string): Project {
  const next = normalizeProject(project)
  return stripDeletedReferences(
    { ...next, constraints: next.constraints.filter((item) => item.id !== constraintId) },
    new Set([constraintId]),
  )
}

export function createCifCommand(project: Project): Project {
  const next = normalizeProject(project)
  const cif = createFunctionalDependencyConstraint(
    uid('cif'),
    uniqueName(next.cifs.map((item) => item.name), 'CIF'),
    nextPosition(next),
  )
  return { ...next, cifs: [...next.cifs, cif] }
}

export function updateCif(
  project: Project,
  cifId: string,
  patch: Partial<Pick<FunctionalDependencyConstraint, 'name' | 'sourceEntityId' | 'targetEntityId' | 'description' | 'associationId'>>,
): Project {
  const next = normalizeProject(project)
  const current = next.cifs.find((item) => item.id === cifId)
  if (!current) return project
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim()
    if (trimmed.length === 0 || !isValidModelName(trimmed)) return project
    if (next.cifs.some((item) => item.id !== cifId && item.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return project
    }
    patch = { ...patch, name: trimmed }
  }
  if (patch.description !== undefined) {
    patch = { ...patch, description: patch.description.trim() }
  }
  if (patch.associationId === '') {
    patch = { ...patch, associationId: undefined }
  }
  return {
    ...next,
    cifs: next.cifs.map((item) => {
      if (item.id !== cifId) return item
      const merged = { ...item, ...patch }
      if (patch.associationId === undefined && 'associationId' in patch) {
        const { associationId: _removed, ...rest } = merged
        return rest
      }
      return merged
    }),
  }
}

export function setCifSource(project: Project, cifId: string, sourceEntityId: string): Project {
  const next = normalizeProject(project)
  const current = next.cifs.find((item) => item.id === cifId)
  if (!current || current.targetEntityId === sourceEntityId) return project
  return updateCif(next, cifId, { sourceEntityId })
}

export function setCifTarget(project: Project, cifId: string, targetEntityId: string): Project {
  const next = normalizeProject(project)
  const current = next.cifs.find((item) => item.id === cifId)
  if (!current || current.sourceEntityId === targetEntityId) return project
  return updateCif(next, cifId, { targetEntityId })
}

export function attachCifEntity(project: Project, cifId: string, entityId: string): Project {
  const next = normalizeProject(project)
  const current = next.cifs.find((item) => item.id === cifId)
  if (!current) return project
  if (!current.sourceEntityId) return setCifSource(next, cifId, entityId)
  if (!current.targetEntityId) return setCifTarget(next, cifId, entityId)
  return project
}

export function moveCif(project: Project, cifId: string, position: { x: number; y: number }): Project {
  const next = normalizeProject(project)
  return {
    ...next,
    cifs: next.cifs.map((item) => (item.id === cifId ? { ...item, position } : item)),
  }
}

export function deleteCif(project: Project, cifId: string): Project {
  const next = normalizeProject(project)
  return stripDeletedReferences(
    { ...next, cifs: next.cifs.filter((item) => item.id !== cifId) },
    new Set([cifId]),
  )
}

export function createBusinessRuleCommand(project: Project): Project {
  const next = normalizeProject(project)
  const rule = createBusinessRule(
    uid('br'),
    uniqueName(next.businessRules.map((item) => item.name), 'REGLE'),
    nextPosition(next),
  )
  return { ...next, businessRules: [...next.businessRules, rule] }
}

export function updateBusinessRule(
  project: Project,
  ruleId: string,
  patch: Partial<Pick<BusinessRule, 'name' | 'description' | 'level' | 'targetIds'>>,
): Project {
  const next = normalizeProject(project)
  const current = next.businessRules.find((item) => item.id === ruleId)
  if (!current) return project
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim()
    if (trimmed.length === 0 || !isValidModelName(trimmed)) return project
    if (next.businessRules.some((item) => item.id !== ruleId && item.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return project
    }
    patch = { ...patch, name: trimmed }
  }
  if (patch.description !== undefined) {
    patch = { ...patch, description: patch.description.trim() }
  }
  if (patch.targetIds) {
    patch = { ...patch, targetIds: uniqueIds(patch.targetIds) }
  }
  return {
    ...next,
    businessRules: next.businessRules.map((item) => (item.id === ruleId ? { ...item, ...patch } : item)),
  }
}

export function setBusinessRuleLevel(project: Project, ruleId: string, level: BusinessRuleLevel): Project {
  return updateBusinessRule(project, ruleId, { level })
}

export function addBusinessRuleTarget(project: Project, ruleId: string, targetId: string): Project {
  const next = normalizeProject(project)
  const current = next.businessRules.find((item) => item.id === ruleId)
  if (!current || current.id === targetId || current.targetIds.includes(targetId)) return project
  return updateBusinessRule(next, ruleId, { targetIds: [...current.targetIds, targetId] })
}

export function moveBusinessRule(project: Project, ruleId: string, position: { x: number; y: number }): Project {
  const next = normalizeProject(project)
  return {
    ...next,
    businessRules: next.businessRules.map((item) => (item.id === ruleId ? { ...item, position } : item)),
  }
}

export function deleteBusinessRule(project: Project, ruleId: string): Project {
  const next = normalizeProject(project)
  return stripDeletedReferences(
    { ...next, businessRules: next.businessRules.filter((item) => item.id !== ruleId) },
    new Set([ruleId]),
  )
}
