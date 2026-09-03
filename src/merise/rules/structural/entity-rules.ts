import { CONCEPTUAL_TYPES, createIdentifier } from '@/domain'
import { physicalIdentifier } from '@/sql/naming'
import { associativeRelationName } from '@/mld'
import { makeIssue } from '../../types'
import {
  RULE_E001,
  RULE_E002,
  RULE_E003,
  RULE_E004,
  RULE_E005,
  RULE_E011,
  RULE_E012,
  type StructuralRule,
} from './definitions'

export const entityHasName: StructuralRule = (project, issues) => {
  for (const entity of project.entities) {
    const name = entity.name.trim()
    if (name.length === 0) {
      issues.push(makeIssue(RULE_E001, [entity.id]))
    }
  }
}

export const attributeTypeIsValid: StructuralRule = (project, issues) => {
  const check = (ownerId: string, attributes: Array<{ id: string; conceptualType: unknown }>) => {
    for (const attribute of attributes) {
      if (!CONCEPTUAL_TYPES.includes(attribute.conceptualType as never)) {
        issues.push(makeIssue(RULE_E011, [ownerId, attribute.id]))
      }
    }
  }
  for (const entity of project.entities) check(entity.id, entity.attributes)
  for (const association of project.associations) check(association.id, association.attributes)
}

export const entityHasIdentifier: StructuralRule = (project, issues) => {
  for (const entity of project.entities) {
    const validIdentifier = entity.identifiers.some((i) => i.attributeIds.length > 0)
    if (!validIdentifier) {
      issues.push(makeIssue(RULE_E002, [entity.id]))
    }
  }
}

export const attributeHasName: StructuralRule = (project, issues) => {
  for (const entity of project.entities) {
    for (const attr of entity.attributes) {
      if (attr.name.trim().length === 0) {
        issues.push(makeIssue(RULE_E003, [entity.id, attr.id]))
      }
    }
  }
  for (const association of project.associations) {
    for (const attr of association.attributes) {
      if (attr.name.trim().length === 0) {
        issues.push(makeIssue(RULE_E003, [association.id, attr.id]))
      }
    }
  }
}

export const noDuplicateAttributes: StructuralRule = (project, issues) => {
  const check = (attributes: Array<{ id: string; name: string }>, ownerId: string) => {
    const seen = new Map<string, string>()
    for (const attr of attributes) {
      const key = attr.name.trim().toLowerCase()
      if (key.length === 0) continue
      const existingId = seen.get(key)
      if (existingId && existingId !== attr.id) {
        issues.push(makeIssue(RULE_E004, [ownerId, attr.id]))
      } else if (!existingId) {
        seen.set(key, attr.id)
      }
    }
  }
  for (const entity of project.entities) {
    check(entity.attributes, entity.id)
  }
  for (const association of project.associations) {
    check(association.attributes, association.id)
  }
}

export const identifierIsValid: StructuralRule = (project, issues) => {
  for (const entity of project.entities) {
    const attributeIds = new Set(entity.attributes.map((a) => a.id))
    for (const identifier of entity.identifiers) {
      if (identifier.attributeIds.length === 0 || new Set(identifier.attributeIds).size !== identifier.attributeIds.length) {
        issues.push(makeIssue(RULE_E005, [entity.id, identifier.id]))
        continue
      }
      for (const attrId of identifier.attributeIds) {
        if (!attributeIds.has(attrId)) {
          issues.push(makeIssue(RULE_E005, [entity.id, identifier.id]))
          break
        }
      }
    }
  }
}

/** Refuse les collisions de tables après normalisation PostgreSQL. */
export const physicalNamesAreUnique: StructuralRule = (project, issues) => {
  const objects = [
    ...project.entities.map((entity) => ({ id: entity.id, name: entity.name })),
    ...project.associations
      .filter((association) => association.participants.length === 2 && association.participants.every((participant) => participant.cardinality?.max === 'N'))
      .map((association) => ({ id: association.id, name: associativeRelationName(association, project.entities) })),
  ]
  const firstByPhysicalName = new Map<string, { id: string; name: string }>()
  for (const object of objects) {
    const physical = physicalIdentifier(object.name)
    const first = firstByPhysicalName.get(physical)
    if (first && first.id !== object.id) {
      issues.push(makeIssue(RULE_E012, [first.id, object.id], `Les noms « ${first.name} » et « ${object.name} » deviennent tous deux « ${physical} » en SQL PostgreSQL.`))
    } else if (!first) {
      firstByPhysicalName.set(physical, object)
    }
  }
}

export function ensureMinimumIdentifier(entityId: string) {
  return createIdentifier(`id-${entityId}-default`)
}
