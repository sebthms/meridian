import type {
  Association,
  Attribute,
  BusinessRule,
  Entity,
  FunctionalDependencyConstraint,
  Inheritance,
  ModelConstraint,
  Project,
} from '@/domain'
import {
  BUSINESS_RULE_LEVELS,
  CONCEPTUAL_TYPES,
  CONSTRAINT_KINDS,
  createProject,
  isCardinality,
  isInheritanceCoverage,
  isInheritanceExclusivity,
  parseAttributeTypeConfig,
} from '@/domain'

export type ProjectFile = Project

const CURRENT_PROJECT_VERSION = 1

function invalid(message: string): never {
  throw new Error(`Fichier projet invalide : ${message}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateTypeConfig(value: unknown, context: string): Attribute['typeConfig'] | undefined {
  try {
    return parseAttributeTypeConfig(value)
  } catch (error) {
    return invalid(`${context} : ${error instanceof Error ? error.message : 'type invalide.'}`)
  }
}

function validateAttribute(value: unknown, context: string): Attribute {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()) invalid(`${context} doit avoir un identifiant.`)
  if (typeof value.name !== 'string') invalid(`${context} doit avoir un nom texte.`)
  if (value.logicalName !== undefined && typeof value.logicalName !== 'string') invalid(`${context}.logicalName doit être texte.`)
  if (!CONCEPTUAL_TYPES.includes(value.conceptualType as never)) invalid(`${context} utilise un type conceptuel invalide.`)
  if (value.nullable !== undefined && typeof value.nullable !== 'boolean') invalid(`${context}.nullable doit être booléen.`)
  if (value.unique !== undefined && typeof value.unique !== 'boolean') invalid(`${context}.unique doit être booléen.`)
  if (value.description !== undefined && typeof value.description !== 'string') invalid(`${context}.description doit être texte.`)
  if (value.identifierOrder !== undefined && (typeof value.identifierOrder !== 'number' || !Number.isInteger(value.identifierOrder) || value.identifierOrder < 1)) invalid(`${context}.identifierOrder doit être un entier positif.`)
  const typeConfig = validateTypeConfig(value.typeConfig, context)
  return {
    id: value.id,
    name: value.name,
    ...(value.logicalName !== undefined ? { logicalName: value.logicalName } : {}),
    conceptualType: value.conceptualType as Attribute['conceptualType'],
    ...(value.nullable !== undefined ? { nullable: value.nullable } : {}),
    ...(value.unique !== undefined ? { unique: value.unique } : {}),
    ...(value.description !== undefined ? { description: value.description } : {}),
    ...(typeConfig ? { typeConfig } : {}),
    ...(value.identifierOrder !== undefined ? { identifierOrder: value.identifierOrder } : {}),
  }
}

function validatePosition(value: unknown, context: string): { x: number; y: number } {
  if (!isRecord(value) || typeof value.x !== 'number' || !Number.isFinite(value.x) || typeof value.y !== 'number' || !Number.isFinite(value.y)) {
    invalid(`${context} doit contenir des coordonnées numériques finies.`)
  }
  return { x: value.x, y: value.y }
}

function validateEntity(value: unknown, index: number): Entity {
  const context = `L'entité ${index + 1}`
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.name !== 'string' || !Array.isArray(value.attributes) || !Array.isArray(value.identifiers)) {
    invalid(`${context} a une structure invalide.`)
  }
  const attributes = value.attributes.map((attribute, attributeIndex) => validateAttribute(attribute, `${context}, propriété ${attributeIndex + 1}`))
  const identifiers = value.identifiers.map((identifier, identifierIndex) => {
    const identifierContext = `${context}, identifiant ${identifierIndex + 1}`
    if (!isRecord(identifier) || typeof identifier.id !== 'string' || !identifier.id.trim() || !Array.isArray(identifier.attributeIds) || !identifier.attributeIds.every((id) => typeof id === 'string')) {
      invalid(`${identifierContext} a une structure invalide.`)
    }
    if (identifier.name !== undefined && typeof identifier.name !== 'string') invalid(`${identifierContext}.name doit être texte.`)
    if (identifier.isPrimary !== undefined && typeof identifier.isPrimary !== 'boolean') invalid(`${identifierContext}.isPrimary doit être booléen.`)
    if (new Set(identifier.attributeIds).size !== identifier.attributeIds.length) invalid(`${identifierContext} contient des propriétés dupliquées.`)
    return { id: identifier.id, attributeIds: identifier.attributeIds, ...(identifier.name !== undefined ? { name: identifier.name } : {}), ...(identifier.isPrimary !== undefined ? { isPrimary: identifier.isPrimary } : {}) }
  })
  if (identifiers.filter((identifier) => identifier.isPrimary === true).length > 1) invalid(`${context} possède plusieurs identifiants principaux.`)
  const attributeIds = new Set(attributes.map((attribute) => attribute.id))
  if (new Set(attributes.map((attribute) => attribute.id)).size !== attributes.length) invalid(`${context} contient des identifiants de propriétés dupliqués.`)
  if (identifiers.some((identifier) => identifier.attributeIds.length === 0 || identifier.attributeIds.some((id) => !attributeIds.has(id)))) invalid(`${context} contient un identifiant qui référence une propriété absente.`)
  return { id: value.id, name: value.name, attributes, identifiers, position: validatePosition(value.position, `${context}.position`) }
}

function validateAssociation(value: unknown, index: number): Association {
  const context = `L'association ${index + 1}`
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.name !== 'string' || !Array.isArray(value.participants) || !Array.isArray(value.attributes)) {
    invalid(`${context} a une structure invalide.`)
  }
  const participants = value.participants.map((participant, participantIndex) => {
    if (!isRecord(participant) || typeof participant.entityId !== 'string' || !participant.entityId.trim() || !isCardinality(participant.cardinality)) invalid(`${context}, participant ${participantIndex + 1} a une structure ou une cardinalité invalide.`)
    if (participant.role !== undefined && typeof participant.role !== 'string') invalid(`${context}, participant ${participantIndex + 1}.role doit être texte.`)
    return { entityId: participant.entityId, ...(participant.role !== undefined ? { role: participant.role } : {}), cardinality: participant.cardinality }
  })
  const attributes = value.attributes.map((attribute, attributeIndex) => validateAttribute(attribute, `${context}, propriété ${attributeIndex + 1}`))
  if (new Set(attributes.map((attribute) => attribute.id)).size !== attributes.length) invalid(`${context} contient des identifiants de propriétés dupliqués.`)
  return { id: value.id, name: value.name, participants, attributes, ...(value.position !== undefined ? { position: validatePosition(value.position, `${context}.position`) } : {}) }
}

function validateStringIds(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string' && id.trim())) {
    invalid(`${context} doit être un tableau d’identifiants texte.`)
  }
  if (new Set(value).size !== value.length) invalid(`${context} contient des références dupliquées.`)
  return value
}

function validateInheritance(value: unknown, index: number): Inheritance {
  const context = `L’héritage ${index + 1}`
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.name !== 'string') {
    invalid(`${context} a une structure invalide.`)
  }
  if (typeof value.parentEntityId !== 'string') invalid(`${context}.parentEntityId doit être texte.`)
  if (!isInheritanceCoverage(value.coverage)) invalid(`${context} a un type de couverture invalide.`)
  if (!isInheritanceExclusivity(value.exclusivity)) invalid(`${context} a un type d’exclusivité invalide.`)
  return {
    id: value.id,
    name: value.name,
    parentEntityId: value.parentEntityId,
    childEntityIds: validateStringIds(value.childEntityIds, `${context}.childEntityIds`),
    coverage: value.coverage,
    exclusivity: value.exclusivity,
    position: validatePosition(value.position, `${context}.position`),
  }
}

function validateConstraint(value: unknown, index: number): ModelConstraint {
  const context = `La contrainte ${index + 1}`
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.name !== 'string') {
    invalid(`${context} a une structure invalide.`)
  }
  if (typeof value.description !== 'string') invalid(`${context}.description doit être texte.`)
  if (!CONSTRAINT_KINDS.includes(value.kind as never)) invalid(`${context} a un type de contrainte invalide.`)
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    kind: value.kind as ModelConstraint['kind'],
    targetIds: validateStringIds(value.targetIds, `${context}.targetIds`),
    position: validatePosition(value.position, `${context}.position`),
  }
}

function validateCif(value: unknown, index: number): FunctionalDependencyConstraint {
  const context = `La CIF ${index + 1}`
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.name !== 'string') {
    invalid(`${context} a une structure invalide.`)
  }
  if (typeof value.sourceEntityId !== 'string' || typeof value.targetEntityId !== 'string') {
    invalid(`${context} doit déclarer une entité source et une entité cible.`)
  }
  if (typeof value.description !== 'string') invalid(`${context}.description doit être texte.`)
  if (value.associationId !== undefined && (typeof value.associationId !== 'string' || !value.associationId.trim())) {
    invalid(`${context}.associationId doit être texte.`)
  }
  return {
    id: value.id,
    name: value.name,
    sourceEntityId: value.sourceEntityId,
    targetEntityId: value.targetEntityId,
    description: value.description,
    ...(value.associationId !== undefined ? { associationId: value.associationId } : {}),
    position: validatePosition(value.position, `${context}.position`),
  }
}

function validateBusinessRule(value: unknown, index: number): BusinessRule {
  const context = `La règle métier ${index + 1}`
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.name !== 'string') {
    invalid(`${context} a une structure invalide.`)
  }
  if (typeof value.description !== 'string') invalid(`${context}.description doit être texte.`)
  if (!BUSINESS_RULE_LEVELS.includes(value.level as never)) invalid(`${context} a un niveau invalide.`)
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    level: value.level as BusinessRule['level'],
    targetIds: validateStringIds(value.targetIds, `${context}.targetIds`),
    position: validatePosition(value.position, `${context}.position`),
  }
}

function migrateProject(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.version === 0) return { ...raw, version: CURRENT_PROJECT_VERSION }
  if (raw.version !== CURRENT_PROJECT_VERSION) invalid('version de projet non prise en charge.')
  return raw
}

export function exportProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function downloadProject(project: Project, filename = 'my-project.merise.json'): void {
  const blob = new Blob([exportProject(project)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadText(content: string, filename: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseProject(raw: string): ProjectFile {
  let decoded: unknown
  try {
    decoded = JSON.parse(raw)
  } catch {
    invalid('JSON illisible ou corrompu.')
  }
  if (!isRecord(decoded)) invalid('un objet JSON est attendu.')
  const parsed = migrateProject(decoded)
  if (typeof parsed.name !== 'string' && parsed.name !== undefined) invalid('name doit être texte.')
  if (!Array.isArray(parsed.entities) || !Array.isArray(parsed.associations)) invalid('entities et associations doivent être des tableaux.')
  const inheritancesRaw = parsed.inheritances ?? []
  const constraintsRaw = parsed.constraints ?? []
  const cifsRaw = parsed.cifs ?? []
  const businessRulesRaw = parsed.businessRules ?? []
  if (!Array.isArray(inheritancesRaw) || !Array.isArray(constraintsRaw) || !Array.isArray(cifsRaw) || !Array.isArray(businessRulesRaw)) {
    invalid('inheritances, constraints, cifs et businessRules doivent être des tableaux.')
  }
  const entities = parsed.entities.map(validateEntity)
  const associations = parsed.associations.map(validateAssociation)
  const inheritances = inheritancesRaw.map(validateInheritance)
  const constraints = constraintsRaw.map(validateConstraint)
  const cifs = cifsRaw.map(validateCif)
  const businessRules = businessRulesRaw.map(validateBusinessRule)
  const entityIds = new Set(entities.map((entity) => entity.id))
  const associationIds = new Set(associations.map((association) => association.id))
  if (entityIds.size !== entities.length) invalid('les identifiants d’entités doivent être uniques.')
  if (associationIds.size !== associations.length) invalid('les identifiants d’associations doivent être uniques.')
  if (new Set(inheritances.map((item) => item.id)).size !== inheritances.length) invalid('les identifiants d’héritages doivent être uniques.')
  if (new Set(constraints.map((item) => item.id)).size !== constraints.length) invalid('les identifiants de contraintes doivent être uniques.')
  if (new Set(cifs.map((item) => item.id)).size !== cifs.length) invalid('les identifiants de CIF doivent être uniques.')
  if (new Set(businessRules.map((item) => item.id)).size !== businessRules.length) invalid('les identifiants de règles métier doivent être uniques.')
  if (associations.some((association) => association.participants.some((participant) => !entityIds.has(participant.entityId)))) invalid('une association référence une entité inexistante.')
  const objectIds = new Set([...entityIds, ...associationIds, ...inheritances.map((item) => item.id), ...constraints.map((item) => item.id), ...cifs.map((item) => item.id), ...businessRules.map((item) => item.id)])
  if (objectIds.size !== entityIds.size + associationIds.size + inheritances.length + constraints.length + cifs.length + businessRules.length) {
    invalid('les identifiants d’objets du projet doivent être uniques.')
  }
  const ignoredRules = parsed.ignoredRules ?? []
  const ignoredIssueIds = parsed.ignoredIssueIds ?? []
  if (!Array.isArray(ignoredRules) || !ignoredRules.every((item) => typeof item === 'string') || !Array.isArray(ignoredIssueIds) || !ignoredIssueIds.every((item) => typeof item === 'string')) invalid('les listes d’ignorance doivent contenir uniquement du texte.')
  return {
    version: CURRENT_PROJECT_VERSION,
    name: parsed.name ?? 'Projet importé',
    entities,
    associations,
    inheritances,
    constraints,
    cifs,
    businessRules,
    ignoredRules,
    ignoredIssueIds,
  }
}

export function emptyProject(): ProjectFile {
  return createProject()
}
