import {
  isValidModelName,
  modelNameError,
  parseAttributeTypeConfig,
  type Attribute,
  type AttributeTypeConfig,
  type ConceptualType,
  type Project,
} from '@/domain/index'
import {
  addAssociationAttribute,
  addAttributeWithName,
  setAttributeIdentifier,
  updateAssociationAttribute,
  updateAttribute,
} from '@/editor/index'
import { propertyTypeDefaults, type TypeSection } from './property-type-defaults'

export type PropertyTypeFields = ReturnType<typeof propertyTypeDefaults>

export type PropertyTarget = { kind: 'entity' | 'association'; id: string; attributeId?: string }

export type PropertySaveInput = {
  project: Project
  target: PropertyTarget
  name: string
  logicalName: string
  description: string
  identifier: boolean
  notNull: boolean
  unique: boolean
  keyOrder: number
  identifierId?: string
  typeChanged: boolean
  typeFields: PropertyTypeFields
  editedAttribute?: Attribute
}

export type PropertySaveResult =
  | { ok: true; project: Project }
  | { ok: false; error: string }

export function propertyNameFormatError(name: string): string | null {
  return name.trim() && !isValidModelName(name.trim()) ? modelNameError('Le nom de la propriété') : null
}

export function conceptualTypeFromSection(
  section: TypeSection,
  numericKind: PropertyTypeFields['numericKind'],
  otherKind: PropertyTypeFields['otherKind'],
): ConceptualType {
  return section === 'text'
    ? 'TEXT'
    : section === 'numeric'
      ? (numericKind === 'INTEGER' || numericKind === 'COUNTER' ? 'INTEGER' : 'DECIMAL')
      : section === 'dateTime'
        ? 'DATE'
        : otherKind === 'BOOLEAN' ? 'BOOLEAN' : 'TEXT'
}

export function buildAttributeTypeConfig(fields: PropertyTypeFields): AttributeTypeConfig {
  const {
    section,
    textCharset,
    textStorage,
    textLength,
    collation,
    numericKind,
    numericBits,
    precision,
    scale,
    floating,
    dateTimeKind,
    timezone,
    otherKind,
    freeType,
  } = fields
  return section === 'text'
    ? { text: { charset: textCharset, storage: textStorage, ...(textStorage !== 'LARGE' ? { length: textLength } : {}), ...(textCharset !== 'BINARY' && collation.trim() ? { collation: collation.trim() } : {}) } }
    : section === 'numeric'
      ? { numeric: { kind: numericKind, ...(numericKind === 'INTEGER' ? { bits: numericBits } : {}), ...(numericKind === 'DECIMAL' ? { precision, scale } : {}), ...(numericKind === 'REAL' ? { floating } : {}) } }
      : section === 'dateTime'
        ? { dateTime: { kind: dateTimeKind, ...(dateTimeKind === 'DATETIME' && timezone ? { timezone: true } : {}) } }
        : { other: { kind: otherKind, ...(otherKind === 'FREE' && freeType.trim() ? { freeType: freeType.trim() } : {}) } }
}

export function resolveSavedTypeConfig(
  editedAttribute: Attribute | undefined,
  typeChanged: boolean,
  typeConfig: AttributeTypeConfig,
): { ok: true; typeConfig: AttributeTypeConfig | undefined } | { ok: false; error: string } {
  try {
    // Editing a label must not narrow a legacy TEXT/NUMERIC column.
    return {
      ok: true,
      typeConfig: parseAttributeTypeConfig(editedAttribute && !typeChanged ? editedAttribute.typeConfig : typeConfig),
    }
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : 'Type invalide.' }
  }
}

export function buildAttributePatch(input: {
  name: string
  logicalName: string
  conceptualType: ConceptualType
  typeConfig: AttributeTypeConfig | undefined
  identifier: boolean
  notNull: boolean
  unique: boolean
  keyOrder: number
  description: string
}) {
  return {
    name: input.name,
    logicalName: input.logicalName.trim() || undefined,
    conceptualType: input.conceptualType,
    typeConfig: input.typeConfig,
    nullable: input.identifier ? false : !input.notNull,
    unique: input.identifier ? false : input.unique,
    identifierOrder: input.identifier ? Math.max(1, input.keyOrder) : undefined,
    description: input.description.trim() || undefined,
  }
}

export function applyPropertySave(input: PropertySaveInput): PropertySaveResult {
  const trimmedName = input.name.trim()
  if (!trimmedName) return { ok: false, error: 'Le nom est obligatoire.' }
  if (!isValidModelName(trimmedName)) return { ok: false, error: modelNameError('Le nom de la propriété') }

  const typeConfig = buildAttributeTypeConfig(input.typeFields)
  const conceptualType = conceptualTypeFromSection(
    input.typeFields.section,
    input.typeFields.numericKind,
    input.typeFields.otherKind,
  )
  const saved = resolveSavedTypeConfig(input.editedAttribute, input.typeChanged, typeConfig)
  if (!saved.ok) return saved

  const patch = buildAttributePatch({
    name: trimmedName,
    logicalName: input.logicalName,
    conceptualType,
    typeConfig: saved.typeConfig,
    identifier: input.identifier,
    notNull: input.notNull,
    unique: input.unique,
    keyOrder: input.keyOrder,
    description: input.description,
  })

  const { project, target } = input
  let next: Project
  let savedAttributeId = target.attributeId
  if (target.attributeId) {
    next = target.kind === 'entity'
      ? updateAttribute(project, target.id, target.attributeId, patch)
      : updateAssociationAttribute(project, target.id, target.attributeId, patch)
    if (next === project && input.editedAttribute?.name.trim().toLowerCase() !== trimmedName.toLowerCase()) {
      return { ok: false, error: 'Une propriété portant ce nom existe déjà.' }
    }
  } else {
    const result = target.kind === 'entity'
      ? addAttributeWithName(project, target.id, trimmedName, conceptualType)
      : addAssociationAttribute(project, target.id, trimmedName, conceptualType)
    if (!result.attributeId) return { ok: false, error: 'Une propriété portant ce nom existe déjà.' }
    savedAttributeId = result.attributeId
    next = target.kind === 'entity'
      ? updateAttribute(result.project, target.id, result.attributeId, patch)
      : updateAssociationAttribute(result.project, target.id, result.attributeId, patch)
  }
  if (target.kind === 'entity' && savedAttributeId) {
    next = setAttributeIdentifier(next, target.id, savedAttributeId, input.identifier, input.keyOrder, input.identifierId)
  }
  return { ok: true, project: next }
}
