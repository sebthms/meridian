import type { Project } from '@/domain'
import { makeIssue } from '../../types'
import {
  normalizedAttrName,
  PLURAL_ENTITY_SUFFIX,
  UNSTABLE_IDENTIFIER_NAMES,
} from './patterns'
import {
  RULE_W016,
  RULE_W017,
  RULE_W019,
  RULE_W020,
  RULE_W022,
  RULE_W025,
  type SemanticRule,
} from './definitions'

function identifierAttributeIds(entity: Project['entities'][number]): Set<string> {
  return new Set(entity.identifiers.flatMap((identifier) => identifier.attributeIds))
}

export const warnUnstableIdentifier: SemanticRule = (project, issues) => {
  for (const entity of project.entities) {
    const members = identifierAttributeIds(entity)
    for (const attribute of entity.attributes) {
      if (!members.has(attribute.id)) continue
      const normalized = normalizedAttrName(attribute.name)
      const unstable = UNSTABLE_IDENTIFIER_NAMES.has(normalized)
      const weakText = attribute.conceptualType === 'TEXT' && !unstable
      if (!unstable && !weakText) continue
      if (attribute.conceptualType === 'INTEGER' && attribute.typeConfig?.numeric?.kind === 'COUNTER') continue
      issues.push(makeIssue(RULE_W016, [entity.id, attribute.id], `« ${attribute.name} » dans « ${entity.name} ».`))
    }
  }
}

export const warnPluralEntityName: SemanticRule = (project, issues) => {
  for (const entity of project.entities) {
    const trimmed = entity.name.trim()
    if (trimmed.length <= 3) continue
    if (PLURAL_ENTITY_SUFFIX.test(trimmed) && trimmed.toUpperCase() === trimmed) {
      issues.push(makeIssue(RULE_W017, [entity.id], `« ${entity.name} ».`))
    }
  }
}

export const warnEntityWithoutDescriptiveProperties: SemanticRule = (project, issues) => {
  for (const entity of project.entities) {
    if (entity.attributes.length === 0) continue
    const members = identifierAttributeIds(entity)
    if (entity.attributes.every((attribute) => members.has(attribute.id))) {
      issues.push(makeIssue(RULE_W019, [entity.id], `« ${entity.name} ».`))
    }
  }
}

export const warnCrossEntityRedundancy: SemanticRule = (project, issues) => {
  const entities = new Map(project.entities.map((entity) => [entity.id, entity]))
  for (const association of project.associations) {
    if (association.participants.length !== 2) continue
    const [leftId, rightId] = association.participants.map((participant) => participant.entityId)
    const left = entities.get(leftId)
    const right = entities.get(rightId)
    if (!left || !right || leftId === rightId) continue
    const leftMembers = identifierAttributeIds(left)
    const rightMembers = identifierAttributeIds(right)
    const leftNames = new Map(left.attributes.filter((attribute) => !leftMembers.has(attribute.id)).map((attribute) => [normalizedAttrName(attribute.name), attribute.id]))
    for (const attribute of right.attributes) {
      if (rightMembers.has(attribute.id)) continue
      const mirrorId = leftNames.get(normalizedAttrName(attribute.name))
      if (!mirrorId) continue
      issues.push(makeIssue(RULE_W020, [left.id, mirrorId, right.id, attribute.id, association.id], `« ${attribute.name} » dans « ${left.name} » et « ${right.name} ».`))
    }
  }
}

export const warnOneToOneMandatory: SemanticRule = (project, issues) => {
  for (const association of project.associations) {
    if (association.participants.length !== 2) continue
    const mandatory = association.participants.every((participant) => participant.cardinality?.min === 1 && participant.cardinality?.max === 1)
    if (!mandatory) continue
    issues.push(makeIssue(RULE_W022, [association.id], `« ${association.name} ».`))
  }
}

export const warnBooleanIdentifier: SemanticRule = (project, issues) => {
  for (const entity of project.entities) {
    const members = identifierAttributeIds(entity)
    for (const attribute of entity.attributes) {
      if (!members.has(attribute.id) || attribute.conceptualType !== 'BOOLEAN') continue
      issues.push(makeIssue(RULE_W025, [entity.id, attribute.id], `« ${entity.name}.${attribute.name} ».`))
    }
  }
}

export const designRules: SemanticRule[] = [
  warnUnstableIdentifier,
  warnPluralEntityName,
  warnEntityWithoutDescriptiveProperties,
  warnCrossEntityRedundancy,
  warnOneToOneMandatory,
  warnBooleanIdentifier,
]
