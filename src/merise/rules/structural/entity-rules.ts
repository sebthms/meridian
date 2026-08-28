import { createIdentifier } from '@/domain'
import { makeIssue } from '../../types'
import {
  RULE_E001,
  RULE_E002,
  RULE_E003,
  RULE_E004,
  RULE_E005,
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
  for (const entity of project.entities) {
    const seen = new Map<string, string>()
    for (const attr of entity.attributes) {
      const key = attr.name.trim().toLowerCase()
      if (key.length === 0) continue
      const existingId = seen.get(key)
      if (existingId && existingId !== attr.id) {
        issues.push(makeIssue(RULE_E004, [entity.id, attr.id]))
      } else if (!existingId) {
        seen.set(key, attr.id)
      }
    }
  }
}

export const identifierIsValid: StructuralRule = (project, issues) => {
  for (const entity of project.entities) {
    const attributeIds = new Set(entity.attributes.map((a) => a.id))
    for (const identifier of entity.identifiers) {
      if (identifier.attributeIds.length === 0) {
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

// Re-export helper for auto-fix: give an entity its first attribute as identifier.
export function ensureMinimumIdentifier(entityId: string) {
  // pure helper exposed for auto-correction logic
  return createIdentifier(`id-${entityId}-default`)
}