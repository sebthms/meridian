import { getPrimaryIdentifier, parseAttributeTypeConfig, type Project } from '@/domain'
import { generateMld } from '@/mld'
import { physicalIdentifier } from '@/sql/naming'
import { makeIssue, type ValidationIssue } from '../../types'
import { ADVANCED_RULES as R } from './definitions'

export function validateModelIntegrity(project: Project, issues: ValidationIssue[]) {
  const ids = new Map<string, { ownerId: string; label: string }>()
  const register = (id: string, ownerId: string, label: string, occurrence: string) => {
    const first = ids.get(id)
    if (!id.trim() || first) {
      issues.push(makeIssue(R.E013, [...new Set([first?.ownerId, ownerId].filter((value): value is string => !!value))],
        first ? `« ${first.label} » et « ${label} » partagent l’ID interne « ${id} ».` : `« ${label} » possède un ID interne vide.`, occurrence))
    } else ids.set(id, { ownerId, label })
  }
  const conceptual = [
    ...(project.inheritances ?? []),
    ...(project.constraints ?? []),
    ...(project.cifs ?? []),
    ...(project.businessRules ?? []),
  ]
  for (const [index, owner] of conceptual.entries()) {
    register(owner.id, owner.id, owner.name || `concept-${index}`, `concept-${index}`)
  }
  for (const [index, owner] of [...project.entities, ...project.associations].entries()) {
    register(owner.id, owner.id, owner.name, `object-${index}`)
    for (const [attrIndex, attr] of owner.attributes.entries()) {
      register(attr.id, owner.id, `${owner.name}.${attr.name}`, `object-${index}-attribute-${attrIndex}`)
      try {
        const config = parseAttributeTypeConfig(attr.typeConfig)
        if (!config) continue
        const expected = config.text ? 'TEXT' : config.numeric
          ? ['INTEGER', 'COUNTER'].includes(config.numeric.kind) ? 'INTEGER' : 'DECIMAL'
          : config.dateTime ? 'DATE' : config.other?.kind === 'BOOLEAN' ? 'BOOLEAN' : 'TEXT'
        if (attr.conceptualType !== expected) {
          issues.push(makeIssue(R.E017, [owner.id, attr.id], `« ${owner.name}.${attr.name} » déclare ${attr.conceptualType}, mais sa configuration appartient à la famille ${expected}.`))
        }
      } catch (error) {
        issues.push(makeIssue(R.E016, [owner.id, attr.id], `« ${owner.name}.${attr.name} » : ${error instanceof Error ? error.message : 'Configuration illisible.'}`))
      }
    }
  }
  for (const entity of project.entities) {
    for (const [index, key] of entity.identifiers.entries()) register(key.id, entity.id, `${entity.name} · identifiant ${index + 1}`, `${entity.id}-key-${index}`)
    const explicitPrimaries = entity.identifiers.filter((key) => key.isPrimary === true)
    if (explicitPrimaries.length > 1 || (entity.identifiers.length > 0 && !getPrimaryIdentifier(entity))) {
      issues.push(makeIssue(R.E014, [entity.id], `« ${entity.name} » : ${explicitPrimaries.length > 1 ? `${explicitPrimaries.length} identifiants sont marqués principaux` : 'aucun identifiant n’est choisi comme principal'}.`))
    }
    const keyMembers = new Set(entity.identifiers.flatMap((key) => key.attributeIds))
    for (const attr of entity.attributes) {
      if (keyMembers.has(attr.id) && attr.nullable === true) {
        issues.push(makeIssue(R.E015, [entity.id, attr.id], `« ${entity.name}.${attr.name} » est à la fois identifiante et nullable.`))
      }
    }
  }
}

/** Audit the actual projection, not guessed FK/column names. Run only after structural validation. */
export function validateSqlProjection(project: Project, issues: ValidationIssue[]) {
  if (issues.some((issue) => issue.severity === 'error')) return
  const model = generateMld(project)
  const byTable = new Map(model.relations.map((relation) => [physicalIdentifier(relation.name), relation]))
  const referencedType = (type: string) => type.replace(/^BIGSERIAL\b/i, 'BIGINT').replace(/^SMALLSERIAL\b/i, 'SMALLINT').replace(/^SERIAL\b/i, 'INTEGER')
  for (const relation of model.relations) {
    const seen = new Map<string, string>()
    for (const column of relation.columns) {
      const physical = physicalIdentifier(column.name)
      const first = seen.get(physical)
      if (first !== undefined) {
        issues.push(makeIssue(R.E018, [relation.sourceId], `Dans « ${relation.name} », les colonnes « ${first} » et « ${column.name} » deviennent « ${physical} ».`, physical))
      } else seen.set(physical, column.name)
      if (!column.references) continue
      const target = byTable.get(physicalIdentifier(column.references.table))
      const targetColumn = target?.columns.find((candidate) => physicalIdentifier(candidate.name) === physicalIdentifier(column.references!.column))
      if (!targetColumn?.isPrimaryKey || referencedType(targetColumn.sqlType) !== column.sqlType) {
        issues.push(makeIssue(R.E019, [...new Set([relation.sourceId, ...(target ? [target.sourceId] : [])])],
          `« ${relation.name}.${column.name} » référence « ${column.references.table}.${column.references.column} », sans composante primaire compatible.`, column.name))
      }
    }
  }
}
