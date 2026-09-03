import type { Project } from '@/domain'
import { createEntity, createAttribute, createIdentifier, createAssociation } from '@/domain'

export function buildProject(partial: Partial<Project> = {}): Project {
  return {
    version: 1,
    name: 'Test',
    entities: [],
    associations: [],
    inheritances: [],
    constraints: [],
    cifs: [],
    businessRules: [],
    ignoredRules: [],
    ignoredIssueIds: [],
    ...partial,
  }
}

export function makeEntity(
  name: string,
  opts: {
    attrs?: Array<[string, string]>
    identifierAttrNames?: string[]
    id?: string
  } = {},
): Project['entities'][number] {
  const id = opts.id ?? `e_${name.toLowerCase()}`
  const attributes = (opts.attrs ?? []).map(([attrName, type], i) =>
    createAttribute(`a_${name.toLowerCase()}_${i}`, attrName, type as never),
  )
  const entity = createEntity(id, name, { x: 0, y: 0 })
  entity.attributes = attributes
  if (opts.identifierAttrNames && opts.identifierAttrNames.length > 0) {
    const ids = opts.identifierAttrNames
      .map((an) => attributes.find((a) => a.name === an))
      .filter((a) => a !== undefined)
    entity.identifiers = [
      createIdentifier(`id_${id}`, ids.map((a) => a!.id)),
    ]
  }
  return entity
}

export function makeAssociation(
  name: string,
  participantA: { entityId: string; role?: string; cardinality: Project['associations'][number]['participants'][0]['cardinality'] },
  participantB: { entityId: string; role?: string; cardinality: Project['associations'][number]['participants'][0]['cardinality'] },
  opts: { id?: string } = {},
): Project['associations'][number] {
  const association = createAssociation(opts.id ?? `a_${name.toLowerCase()}`, name, [
    { entityId: participantA.entityId, role: participantA.role, cardinality: participantA.cardinality },
    { entityId: participantB.entityId, role: participantB.role, cardinality: participantB.cardinality },
  ])
  return association
}