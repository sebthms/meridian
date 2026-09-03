import {
  findFunctionalAssociation,
  isValidModelName,
  modelNameError,
  type BusinessRuleLevel,
  type ConceptualKind,
  type InheritanceCoverage,
  type InheritanceExclusivity,
  type ModelConstraintKind,
  type Project,
} from '@/domain/index'
import { updateBusinessRule, updateCif, updateConstraint, updateInheritance } from '@/editor/index'

export type ConceptualSaveInput = {
  project: Project
  target: { kind: ConceptualKind; id: string }
  name: string
  description: string
  parentEntityId: string
  childEntityIds: string[]
  coverage: InheritanceCoverage
  exclusivity: InheritanceExclusivity
  kind: ModelConstraintKind
  targetIds: string[]
  sourceEntityId: string
  targetEntityId: string
  associationId: string
  level: BusinessRuleLevel
}

export type ConceptualSaveResult =
  | { ok: true; project: Project }
  | { ok: false; error: string }

export function applyConceptualSave(input: ConceptualSaveInput): ConceptualSaveResult {
  const trimmedName = input.name.trim()
  if (!trimmedName) return { ok: false, error: 'Le nom est obligatoire.' }
  if (!isValidModelName(trimmedName)) return { ok: false, error: modelNameError('Le nom') }

  const { project, target } = input
  const inheritance = target.kind === 'inheritance' ? project.inheritances.find((item) => item.id === target.id) : undefined
  const constraint = target.kind === 'constraint' ? project.constraints.find((item) => item.id === target.id) : undefined
  const cif = target.kind === 'cif' ? project.cifs.find((item) => item.id === target.id) : undefined
  const rule = target.kind === 'businessRule' ? project.businessRules.find((item) => item.id === target.id) : undefined

  let next: Project
  if (target.kind === 'inheritance') {
    next = updateInheritance(project, target.id, {
      name: trimmedName,
      parentEntityId: input.parentEntityId,
      childEntityIds: input.childEntityIds.filter((id) => id !== input.parentEntityId),
      coverage: input.coverage,
      exclusivity: input.exclusivity,
    })
  } else if (target.kind === 'constraint') {
    next = updateConstraint(project, target.id, {
      name: trimmedName,
      description: input.description.trim(),
      kind: input.kind,
      targetIds: input.targetIds,
    })
  } else if (target.kind === 'cif') {
    const functionalAssociation = findFunctionalAssociation(project, input.sourceEntityId, input.targetEntityId)
    next = updateCif(project, target.id, {
      name: trimmedName,
      description: input.description.trim(),
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      associationId: input.associationId || functionalAssociation?.id,
    })
  } else {
    if (!input.description.trim()) return { ok: false, error: 'La description est obligatoire.' }
    next = updateBusinessRule(project, target.id, {
      name: trimmedName,
      description: input.description.trim(),
      level: input.level,
      targetIds: input.targetIds,
    })
  }
  if (next === project && trimmedName !== (inheritance ?? constraint ?? cif ?? rule)?.name) {
    return { ok: false, error: 'Un objet du même type porte déjà ce nom.' }
  }
  return { ok: true, project: next }
}
