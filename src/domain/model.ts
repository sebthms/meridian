import type { Association } from './association'
import type { BusinessRule } from './business-rule'
import type { FunctionalDependencyConstraint } from './cif'
import type { ModelConstraint } from './constraint'
import type { Entity } from './entity'
import type { Inheritance } from './inheritance'

export type Project = {
  version: 1
  name: string
  entities: Entity[]
  associations: Association[]
  inheritances: Inheritance[]
  constraints: ModelConstraint[]
  cifs: FunctionalDependencyConstraint[]
  businessRules: BusinessRule[]
  ignoredRules: string[]
  ignoredIssueIds: string[]
}

export function createProject(name = 'Nouveau projet'): Project {
  return {
    version: 1,
    name,
    entities: [],
    associations: [],
    inheritances: [],
    constraints: [],
    cifs: [],
    businessRules: [],
    ignoredRules: [],
    ignoredIssueIds: [],
  }
}

export function normalizeProject(project: Project): Project {
  return {
    ...project,
    entities: project.entities ?? [],
    associations: project.associations ?? [],
    inheritances: project.inheritances ?? [],
    constraints: project.constraints ?? [],
    cifs: project.cifs ?? [],
    businessRules: project.businessRules ?? [],
    ignoredRules: project.ignoredRules ?? [],
    ignoredIssueIds: project.ignoredIssueIds ?? [],
  }
}

export function findEntity(project: Project, entityId: string): Entity | undefined {
  return project.entities.find((e) => e.id === entityId)
}

export function findAssociation(project: Project, associationId: string): Association | undefined {
  return project.associations.find((a) => a.id === associationId)
}

export function findInheritance(project: Project, inheritanceId: string): Inheritance | undefined {
  return (project.inheritances ?? []).find((item) => item.id === inheritanceId)
}

export function findConstraint(project: Project, constraintId: string): ModelConstraint | undefined {
  return (project.constraints ?? []).find((item) => item.id === constraintId)
}

export function findCif(project: Project, cifId: string): FunctionalDependencyConstraint | undefined {
  return (project.cifs ?? []).find((item) => item.id === cifId)
}

export function findBusinessRule(project: Project, ruleId: string): BusinessRule | undefined {
  return (project.businessRules ?? []).find((item) => item.id === ruleId)
}

export function projectElementIds(project: Project): Set<string> {
  const ids = new Set<string>()
  for (const entity of project.entities) ids.add(entity.id)
  for (const association of project.associations) ids.add(association.id)
  for (const inheritance of project.inheritances ?? []) ids.add(inheritance.id)
  for (const constraint of project.constraints ?? []) ids.add(constraint.id)
  for (const cif of project.cifs ?? []) ids.add(cif.id)
  for (const rule of project.businessRules ?? []) ids.add(rule.id)
  return ids
}

export function projectElementLabel(project: Project, id: string): string {
  const entity = findEntity(project, id)
  if (entity) return entity.name.trim() || 'Sans nom'
  const association = findAssociation(project, id)
  if (association) return association.name.trim() || 'Association'
  const inheritance = findInheritance(project, id)
  if (inheritance) return inheritance.name.trim() || 'Héritage'
  const constraint = findConstraint(project, id)
  if (constraint) return constraint.name.trim() || 'Contrainte'
  const cif = findCif(project, id)
  if (cif) return cif.name.trim() || 'CIF'
  const rule = findBusinessRule(project, id)
  if (rule) return rule.name.trim() || 'Règle métier'
  return id
}
