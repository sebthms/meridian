import type { Project } from '@/domain'
import { normalizeProject } from '@/domain'
import {
  addAssociationParticipant,
  createAssociationBetween,
  deleteAssociation,
  deleteEntity,
  moveAssociation,
  moveEntity,
} from './commands'
import {
  addBusinessRuleTarget,
  addConstraintTarget,
  addInheritanceChild,
  attachCifEntity,
  deleteBusinessRule,
  deleteCif,
  deleteConstraint,
  deleteInheritance,
  moveBusinessRule,
  moveCif,
  moveConstraint,
  moveInheritance,
  setInheritanceParent,
} from './conceptual-commands'

function byId<T extends { id: string }>(items: T[] | undefined, id: string): T | undefined {
  return items?.find((item) => item.id === id)
}

/** Relie deux nœuds du canvas selon le modèle métier (jamais via React Flow). */
export function applyCanvasConnection(project: Project, sourceId: string, targetId: string): Project {
  const next = normalizeProject(project)
  const sourceEntity = byId(next.entities, sourceId)
  const targetEntity = byId(next.entities, targetId)
  const sourceAssoc = byId(next.associations, sourceId)
  const targetAssoc = byId(next.associations, targetId)

  if (sourceEntity && targetAssoc) return addAssociationParticipant(next, targetAssoc.id, sourceEntity.id)
  if (sourceAssoc && targetEntity) return addAssociationParticipant(next, sourceAssoc.id, targetEntity.id)
  if (sourceEntity && targetEntity) return createAssociationBetween(next, sourceEntity.id, targetEntity.id, 'N:N')

  const sourceInh = byId(next.inheritances, sourceId)
  const targetInh = byId(next.inheritances, targetId)
  const inheritance = sourceInh ?? targetInh
  const entityForInheritance = sourceInh ? targetEntity : sourceEntity
  if (inheritance && entityForInheritance) {
    return inheritance.parentEntityId
      ? addInheritanceChild(next, inheritance.id, entityForInheritance.id)
      : setInheritanceParent(next, inheritance.id, entityForInheritance.id)
  }

  const sourceCst = byId(next.constraints, sourceId)
  const targetCst = byId(next.constraints, targetId)
  const constraint = sourceCst ?? targetCst
  const constraintTarget = sourceCst ? (targetEntity ?? targetAssoc) : (sourceEntity ?? sourceAssoc)
  if (constraint && constraintTarget) return addConstraintTarget(next, constraint.id, constraintTarget.id)

  const sourceCif = byId(next.cifs, sourceId)
  const targetCif = byId(next.cifs, targetId)
  const cif = sourceCif ?? targetCif
  const cifEntity = sourceCif ? targetEntity : sourceEntity
  if (cif && cifEntity) return attachCifEntity(next, cif.id, cifEntity.id)

  const sourceRule = byId(next.businessRules, sourceId)
  const targetRule = byId(next.businessRules, targetId)
  const rule = sourceRule ?? targetRule
  const ruleTarget = sourceRule
    ? (targetEntity ?? targetAssoc ?? targetInh ?? targetCst ?? targetCif)
    : (sourceEntity ?? sourceAssoc ?? sourceInh ?? sourceCst ?? sourceCif)
  if (rule && ruleTarget) return addBusinessRuleTarget(next, rule.id, ruleTarget.id)

  return next
}

export function applyNodeMove(
  project: Project,
  node: { id: string; type?: string; position: { x: number; y: number } },
): Project {
  switch (node.type) {
    case 'entity': return moveEntity(project, node.id, node.position)
    case 'association': return moveAssociation(project, node.id, node.position)
    case 'inheritance': return moveInheritance(project, node.id, node.position)
    case 'constraint': return moveConstraint(project, node.id, node.position)
    case 'cif': return moveCif(project, node.id, node.position)
    case 'businessRule': return moveBusinessRule(project, node.id, node.position)
    default: return project
  }
}

export function deleteCanvasNode(project: Project, node: { id: string; type?: string }): Project {
  switch (node.type) {
    case 'entity': return deleteEntity(project, node.id)
    case 'association': return deleteAssociation(project, node.id)
    case 'inheritance': return deleteInheritance(project, node.id)
    case 'constraint': return deleteConstraint(project, node.id)
    case 'cif': return deleteCif(project, node.id)
    case 'businessRule': return deleteBusinessRule(project, node.id)
    default: return project
  }
}
