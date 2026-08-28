import type { Association } from './association'
import type { Entity } from './entity'

export type Project = {
  version: 1
  name: string
  entities: Entity[]
  associations: Association[]
  ignoredRules: string[]
  ignoredIssueIds: string[]
}

export function createProject(name = 'Nouveau projet'): Project {
  return {
    version: 1,
    name,
    entities: [],
    associations: [],
    ignoredRules: [],
    ignoredIssueIds: [],
  }
}

export function findEntity(project: Project, entityId: string): Entity | undefined {
  return project.entities.find((e) => e.id === entityId)
}

export function findAssociation(project: Project, associationId: string): Association | undefined {
  return project.associations.find((a) => a.id === associationId)
}