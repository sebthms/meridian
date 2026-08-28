import type { Cardinality } from '@/domain'
import { isCardinality } from '@/domain'
import { makeIssue } from '../../types'
import {
  RULE_E006,
  RULE_E007,
  RULE_E008,
  RULE_E009,
  RULE_E010,
  type StructuralRule,
} from './definitions'

export const associationHasName: StructuralRule = (project, issues) => {
  for (const association of project.associations) {
    if (association.name.trim().length === 0) {
      issues.push(makeIssue(RULE_E006, [association.id]))
    }
  }
}

export const associationIsConnected: StructuralRule = (project, issues) => {
  const entityIds = new Set(project.entities.map((e) => e.id))
  for (const association of project.associations) {
    const valid = association.participants.filter((p) => entityIds.has(p.entityId))
    // MVP: exactly two participations, each resolving to an existing entity
    // (reflexive associations reuse the same entity id).
    const p0 = association.participants[0]
    const p1 = association.participants[1]
    const connected =
      association.participants.length === 2 &&
      !!p0 &&
      !!p1 &&
      entityIds.has(p0.entityId) &&
      entityIds.has(p1.entityId)
    if (!connected) {
      issues.push(makeIssue(RULE_E007, [association.id]))
    }
    if (valid.length === 0) {
      issues.push(makeIssue(RULE_E010, [association.id]))
    }
  }
}

export const cardinalityIsValid: StructuralRule = (project, issues) => {
  for (const association of project.associations) {
    for (const participant of association.participants) {
      if (!isCardinality(participant.cardinality)) {
        issues.push(makeIssue(RULE_E008, [association.id, participant.entityId]))
      }
    }
  }
}

export const cardinalityIsComplete: StructuralRule = (project, issues) => {
  for (const association of project.associations) {
    for (const participant of association.participants) {
      if (!participant.cardinality) {
        issues.push(makeIssue(RULE_E009, [association.id, participant.entityId]))
      }
    }
  }
}

export type { Cardinality }