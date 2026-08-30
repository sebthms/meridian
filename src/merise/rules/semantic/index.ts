import { makeIssue } from '../../types'
import { RULE_W001, RULE_W002, RULE_W003, RULE_W004, RULE_W005, type SemanticRule } from './definitions'

const SUSPICIOUS_NAME_PATTERN = /^(entit[ée][0-9]*|table_temp|objet|entity[0-9]*)$/i
const SPLITTER_PATTERNS: Array<RegExp> = [
  /,/,
  /;/,
  /\//,
  /\s(?:rue|avenue|bd|boulevard)\s/i,
]

export const warnSuspiciousName: SemanticRule = (project, issues) => {
  for (const entity of project.entities) {
    if (SUSPICIOUS_NAME_PATTERN.test(entity.name)) {
      issues.push(makeIssue(RULE_W001, [entity.id]))
    }
  }
  for (const association of project.associations) {
    if (SUSPICIOUS_NAME_PATTERN.test(association.name)) {
      issues.push(makeIssue(RULE_W001, [association.id]))
    }
  }
}

export const warnNonAtomicAttribute: SemanticRule = (project, issues) => {
  const check = (targetIds: string[], name: string) => {
    if (SPLITTER_PATTERNS.some((p) => p.test(name))) {
      issues.push(makeIssue(RULE_W002, targetIds))
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
    const groups = new Map<string, Array<{ name: string; id: string }>>()
    for (const name of attrNames) {
      const m = name.match(/^(.+?)_(\d+)$/)
      if (!m) continue
      const base = m[1]
      const list = groups.get(base) ?? []
      list.push({ name, id: base })
      groups.set(base, list)
    }
    for (const [, list] of groups) {
      if (list.length >= 2) {
        issues.push(makeIssue(RULE_W003, targetPrefix))
      }
    }
  }
  for (const entity of project.entities) {
    collect(
      entity.attributes.map((a) => a.name),
      [entity.id],
    )
  }
}

export const warnSuspiciousFunctionalDependency: SemanticRule = (project, issues) => {
  for (const entity of project.entities) {
    const identifierAttrIds = new Set(entity.identifiers.flatMap((i) => i.attributeIds))
    const identifierNames = new Set(
      entity.attributes.filter((a) => identifierAttrIds.has(a.id)).map((a) => a.name),
    )
    // base of the entity's own identifier, e.g. "id_commande" -> "commande"
    const entityBase = identifierNames.size > 0
      ? [...identifierNames][0].replace(/^id_/, '')
      : ''

    for (const attr of entity.attributes) {
      if (identifierAttrIds.has(attr.id)) continue
      // heuristic: "nom_client" looks like it depends on a non-identifying "id_client"
      const match = attr.name.match(/_(.+)$/)
      if (!match) continue
      const base = match[1]
      const hasForeignId = entity.attributes.some(
        (a) => a.name === `id_${base}` && !identifierAttrIds.has(a.id),
      )
      if (hasForeignId && base !== entityBase) {
        issues.push(
          makeIssue(
            RULE_W004,
            [entity.id, attr.id],
            `\u201C${attr.name}\u201D semble dépendre de \u201Cid_${base}\u201D plutôt que de l\u2019identifiant. Vérifiez qu\u2019il n\u2019existe pas une dépendance transitive.`,
          ),
        )
      }
    }
  }
}

export const warnTernaryAssociation: SemanticRule = (project, issues) => {
  for (const association of project.associations) {
    if (association.participants.length > 2) {
      issues.push(makeIssue(RULE_W005, [association.id]))
    }
  }
}

export const semanticRules: SemanticRule[] = [
  warnSuspiciousName,
  warnNonAtomicAttribute,
  warnRepeatedStructure,
  warnSuspiciousFunctionalDependency,
  warnTernaryAssociation,
]