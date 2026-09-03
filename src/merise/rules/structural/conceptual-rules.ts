import type { Project } from '@/domain'
import { findFunctionalAssociation, normalizeProject } from '@/domain'
import { makeIssue } from '../../types'
import {
  RULE_BR001,
  RULE_E020,
  RULE_E021,
  RULE_E022,
  RULE_E023,
  RULE_E024,
  RULE_E025,
  RULE_E026,
  RULE_E027,
  RULE_E028,
  type StructuralRule,
} from './definitions'

function hasDuplicateIds(ids: string[]): boolean {
  return new Set(ids).size !== ids.length
}

export { findFunctionalAssociation }

export function inheritanceCycleIds(project: Project): Set<string> {
  const childrenOf = new Map<string, string[]>()
  for (const inheritance of normalizeProject(project).inheritances) {
    if (!inheritance.parentEntityId) continue
    childrenOf.set(inheritance.parentEntityId, [
      ...(childrenOf.get(inheritance.parentEntityId) ?? []),
      ...inheritance.childEntityIds,
    ])
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const cyclic = new Set<string>()

  const visit = (entityId: string): boolean => {
    if (visiting.has(entityId)) return true
    if (visited.has(entityId)) return false
    visiting.add(entityId)
    for (const childId of childrenOf.get(entityId) ?? []) {
      if (visit(childId)) {
        cyclic.add(entityId)
        cyclic.add(childId)
        return true
      }
    }
    visiting.delete(entityId)
    visited.add(entityId)
    return false
  }

  for (const parentId of childrenOf.keys()) visit(parentId)
  return cyclic
}

export const inheritanceReferencesAreValid: StructuralRule = (project, issues) => {
  const next = normalizeProject(project)
  const entityIds = new Set(next.entities.map((entity) => entity.id))
  for (const inheritance of next.inheritances) {
    const parentOk = inheritance.parentEntityId.length > 0 && entityIds.has(inheritance.parentEntityId)
    if (!parentOk || inheritance.childEntityIds.includes(inheritance.parentEntityId)) {
      issues.push(makeIssue(RULE_E020, [inheritance.id], !parentOk
        ? 'L’héritage n’a pas d’entité parente existante.'
        : 'L’entité parente ne peut pas être aussi enfant de cet héritage.'))
    }
    if (inheritance.childEntityIds.length === 0) {
      issues.push(makeIssue(RULE_E021, [inheritance.id], 'L’héritage ne référence aucune entité enfant.'))
    }
    if (hasDuplicateIds(inheritance.childEntityIds)) {
      issues.push(makeIssue(RULE_E021, [inheritance.id], 'L’héritage référence plusieurs fois la même entité enfant.'))
    }
    for (const childId of new Set(inheritance.childEntityIds)) {
      if (!entityIds.has(childId)) {
        issues.push(makeIssue(RULE_E021, [inheritance.id, childId], 'Un enfant référence une entité absente.'))
      }
    }
  }
}

export const inheritanceHasNoCycle: StructuralRule = (project, issues) => {
  const cyclic = inheritanceCycleIds(project)
  if (cyclic.size === 0) return
  const next = normalizeProject(project)
  for (const inheritance of next.inheritances) {
    if (cyclic.has(inheritance.parentEntityId) || inheritance.childEntityIds.some((id) => cyclic.has(id))) {
      issues.push(makeIssue(RULE_E022, [inheritance.id, inheritance.parentEntityId, ...inheritance.childEntityIds]))
    }
  }
}

export const constraintReferencesAreValid: StructuralRule = (project, issues) => {
  const next = normalizeProject(project)
  const allowed = new Set([...next.entities.map((entity) => entity.id), ...next.associations.map((association) => association.id)])
  for (const constraint of next.constraints) {
    if (constraint.name.trim().length === 0) {
      issues.push(makeIssue(RULE_E024, [constraint.id]))
    }
    if (hasDuplicateIds(constraint.targetIds)) {
      issues.push(makeIssue(RULE_E023, [constraint.id], 'La contrainte référence plusieurs fois le même objet.'))
    }
    for (const targetId of new Set(constraint.targetIds)) {
      if (!allowed.has(targetId)) {
        issues.push(makeIssue(RULE_E023, [constraint.id, targetId], 'La contrainte référence une entité ou une association absente.'))
      }
    }
  }
}

export const cifReferencesAreValid: StructuralRule = (project, issues) => {
  const next = normalizeProject(project)
  const entityIds = new Set(next.entities.map((entity) => entity.id))
  for (const cif of next.cifs) {
    const sourceOk = cif.sourceEntityId.length > 0 && entityIds.has(cif.sourceEntityId)
    const targetOk = cif.targetEntityId.length > 0 && entityIds.has(cif.targetEntityId)
    if (!sourceOk || !targetOk || cif.sourceEntityId === cif.targetEntityId) {
      issues.push(makeIssue(RULE_E025, [cif.id], cif.sourceEntityId === cif.targetEntityId && sourceOk
        ? 'La CIF doit relier deux entités distinctes.'
        : 'La CIF référence une entité source ou cible absente.'))
      continue
    }
    const association = findFunctionalAssociation(next, cif.sourceEntityId, cif.targetEntityId, cif.associationId)
    if (!association) {
      const linked = next.associations.some((item) => {
        const ids = item.participants.map((participant) => participant.entityId)
        return ids.includes(cif.sourceEntityId) && ids.includes(cif.targetEntityId)
      })
      issues.push(makeIssue(
        RULE_E026,
        [cif.id, cif.sourceEntityId, cif.targetEntityId],
        linked
          ? 'Les entités sont reliées, mais aucune association n’exprime une dépendance fonctionnelle (cardinalité cible maximale 1).'
          : 'Aucune association du MCD ne relie ces deux entités : la CIF ne crée pas la dépendance.',
      ))
    } else if (cif.associationId && cif.associationId !== association.id) {
      issues.push(makeIssue(RULE_E026, [cif.id, cif.associationId], 'L’association indiquée n’exprime pas une dépendance fonctionnelle entre ces entités.'))
    }
  }
}

export const businessRulesAreValid: StructuralRule = (project, issues) => {
  const next = normalizeProject(project)
  const allowed = new Set([
    ...next.entities.map((entity) => entity.id),
    ...next.associations.map((association) => association.id),
    ...next.inheritances.map((item) => item.id),
    ...next.constraints.map((item) => item.id),
    ...next.cifs.map((item) => item.id),
  ])
  for (const rule of next.businessRules) {
    if (rule.name.trim().length === 0 || rule.description.trim().length === 0) {
      issues.push(makeIssue(RULE_E027, [rule.id], rule.name.trim().length === 0
        ? 'La règle métier n’a pas de nom.'
        : 'La règle métier n’a pas de description.'))
    }
    if (hasDuplicateIds(rule.targetIds)) {
      issues.push(makeIssue(RULE_E028, [rule.id], 'La règle métier référence plusieurs fois le même objet.'))
    }
    for (const targetId of new Set(rule.targetIds)) {
      if (!allowed.has(targetId)) {
        issues.push(makeIssue(RULE_E028, [rule.id, targetId], 'La règle métier référence un objet absent du diagramme.'))
      }
    }
    if (rule.name.trim() && rule.description.trim()) {
      issues.push({
        ...makeIssue(RULE_BR001, [rule.id, ...rule.targetIds], rule.description.trim()),
        severity: rule.level,
        title: rule.name.trim(),
      })
    }
  }
}
