import { makeIssue } from '../../types'
import { designRules } from './design-rules'
import {
  NON_ATOMIC_SPLITTERS,
  REPEATED_ATTR_SUFFIX,
  SUSPICIOUS_ASSOCIATION_NAMES,
  SUSPICIOUS_ENTITY_NAMES,
} from './patterns'
import {
  RULE_W001,
  RULE_W002,
  RULE_W003,
  RULE_W004,
  RULE_W005,
  type SemanticRule,
} from './definitions'

export const warnSuspiciousName: SemanticRule = (project, issues) => {
  for (const entity of project.entities) {
    const trimmed = entity.name.trim()
    if (SUSPICIOUS_ENTITY_NAMES.test(trimmed) || (/^[a-z][a-z0-9_]*$/.test(trimmed) && trimmed === trimmed.toLowerCase())) {
      issues.push(makeIssue(RULE_W001, [entity.id], `« ${entity.name} ».`))
    }
  }
  for (const association of project.associations) {
    const trimmed = association.name.trim()
    if (SUSPICIOUS_ENTITY_NAMES.test(trimmed) || SUSPICIOUS_ASSOCIATION_NAMES.test(trimmed)) {
      issues.push(makeIssue(RULE_W001, [association.id], `« ${association.name} ».`))
    }
  }
}

export const warnNonAtomicAttribute: SemanticRule = (project, issues) => {
  const check = (targetIds: string[], name: string) => {
    if (NON_ATOMIC_SPLITTERS.some((pattern) => pattern.test(name))) {
      issues.push(makeIssue(RULE_W002, targetIds, `« ${name} ».`))
    }
  }
  for (const entity of project.entities) {
    for (const attr of entity.attributes) check([entity.id, attr.id], attr.name)
  }
  for (const association of project.associations) {
    for (const attr of association.attributes) check([association.id, attr.id], attr.name)
  }
}

export const warnRepeatedStructure: SemanticRule = (project, issues) => {
  const collect = (attrNames: string[], targetPrefix: string[]) => {
    const groups = new Map<string, number>()
    for (const name of attrNames) {
      const match = name.match(REPEATED_ATTR_SUFFIX)
      if (!match?.[1]) continue
      groups.set(match[1].toLowerCase(), (groups.get(match[1].toLowerCase()) ?? 0) + 1)
    }
    for (const [, count] of groups) {
      if (count >= 2) issues.push(makeIssue(RULE_W003, targetPrefix))
    }
  }
  for (const entity of project.entities) {
    collect(entity.attributes.map((attribute) => attribute.name), [entity.id])
  }
  for (const association of project.associations) {
    collect(association.attributes.map((attribute) => attribute.name), [association.id])
  }
}

export const warnSuspiciousFunctionalDependency: SemanticRule = (project, issues) => {
  for (const entity of project.entities) {
    const identifierAttrIds = new Set(entity.identifiers.flatMap((identifier) => identifier.attributeIds))
    const identifierNames = new Set(
      entity.attributes.filter((attribute) => identifierAttrIds.has(attribute.id)).map((attribute) => attribute.name),
    )
    const entityBase = identifierNames.size > 0 ? [...identifierNames][0].replace(/^id_/, '') : ''

    for (const attr of entity.attributes) {
      if (identifierAttrIds.has(attr.id)) continue
      const match = attr.name.match(/_(.+)$/)
      if (!match) continue
      const base = match[1]
      const hasForeignId = entity.attributes.some(
        (candidate) => candidate.name === `id_${base}` && !identifierAttrIds.has(candidate.id),
      )
      if (hasForeignId && base !== entityBase) {
        issues.push(makeIssue(RULE_W004, [entity.id, attr.id], `« ${attr.name} ».`))
      }
    }
  }
}

export const warnTernaryAssociation: SemanticRule = (project, issues) => {
  for (const association of project.associations) {
    if (association.participants.length > 2) {
      issues.push(makeIssue(RULE_W005, [association.id], `« ${association.name} » (${association.participants.length} participations).`))
    }
  }
}

export const semanticRules: SemanticRule[] = [
  warnSuspiciousName,
  warnNonAtomicAttribute,
  warnRepeatedStructure,
  warnSuspiciousFunctionalDependency,
  warnTernaryAssociation,
  ...designRules,
]

export * from './design-rules'
export * from './patterns'
