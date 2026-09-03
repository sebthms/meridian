import { describe, expect, it } from 'vitest'
import { createAttribute, createIdentifier, createProject } from '@/domain'
import { createAssociationBetween, createEntityCommand, renameEntity } from '@/editor'
import { applyPropertySave, buildAttributeTypeConfig, conceptualTypeFromSection, propertyNameFormatError } from './property-form'
import { propertyTypeDefaults } from './property-type-defaults'

function projectWithEntity(name = 'CLIENT') {
  let project = createProject()
  project = createEntityCommand(project)
  project = renameEntity(project, project.entities[0].id, name)
  return project
}

describe('Formulaire de propriété', () => {
  it('construit les configurations de type comme le formulaire', () => {
    const defaults = propertyTypeDefaults()
    expect(buildAttributeTypeConfig({ ...defaults, section: 'text', textStorage: 'LARGE', collation: ' fr-FR ' })).toEqual({
      text: { charset: 'ASCII', storage: 'LARGE', collation: 'fr-FR' },
    })
    expect(buildAttributeTypeConfig({ ...defaults, section: 'text', textCharset: 'BINARY', collation: 'fr-FR', textLength: 12 })).toEqual({
      text: { charset: 'BINARY', storage: 'VARIABLE', length: 12 },
    })
    expect(buildAttributeTypeConfig({ ...defaults, section: 'numeric', numericKind: 'INTEGER', numericBits: 16 })).toEqual({
      numeric: { kind: 'INTEGER', bits: 16 },
    })
    expect(buildAttributeTypeConfig({ ...defaults, section: 'numeric', numericKind: 'DECIMAL', precision: 10, scale: 4 })).toEqual({
      numeric: { kind: 'DECIMAL', precision: 10, scale: 4 },
    })
    expect(buildAttributeTypeConfig({ ...defaults, section: 'numeric', numericKind: 'REAL', floating: 'SINGLE' })).toEqual({
      numeric: { kind: 'REAL', floating: 'SINGLE' },
    })
    expect(buildAttributeTypeConfig({ ...defaults, section: 'dateTime', dateTimeKind: 'DATETIME', timezone: false })).toEqual({
      dateTime: { kind: 'DATETIME' },
    })
    expect(buildAttributeTypeConfig({ ...defaults, section: 'dateTime', dateTimeKind: 'DATETIME', timezone: true })).toEqual({
      dateTime: { kind: 'DATETIME', timezone: true },
    })
    expect(buildAttributeTypeConfig({ ...defaults, section: 'other', otherKind: 'FREE', freeType: '  JSONB  ' })).toEqual({
      other: { kind: 'FREE', freeType: 'JSONB' },
    })
    expect(buildAttributeTypeConfig({ ...defaults, section: 'other', otherKind: 'FREE', freeType: '   ' })).toEqual({
      other: { kind: 'FREE' },
    })
  })

  it('mappe la section vers le type conceptuel', () => {
    expect(conceptualTypeFromSection('text', 'INTEGER', 'BOOLEAN')).toBe('TEXT')
    expect(conceptualTypeFromSection('numeric', 'INTEGER', 'BOOLEAN')).toBe('INTEGER')
    expect(conceptualTypeFromSection('numeric', 'COUNTER', 'BOOLEAN')).toBe('INTEGER')
    expect(conceptualTypeFromSection('numeric', 'DECIMAL', 'BOOLEAN')).toBe('DECIMAL')
    expect(conceptualTypeFromSection('numeric', 'REAL', 'BOOLEAN')).toBe('DECIMAL')
    expect(conceptualTypeFromSection('dateTime', 'INTEGER', 'BOOLEAN')).toBe('DATE')
    expect(conceptualTypeFromSection('other', 'INTEGER', 'BOOLEAN')).toBe('BOOLEAN')
    expect(conceptualTypeFromSection('other', 'INTEGER', 'XML')).toBe('TEXT')
  })

  it('signale un nom vide ou invalide sans enregistrer', () => {
    expect(propertyNameFormatError('')).toBeNull()
    expect(propertyNameFormatError('nom_ok')).toBeNull()
    expect(propertyNameFormatError('1nom')).toMatch(/nom/i)
    const project = projectWithEntity()
    const fields = propertyTypeDefaults()
    expect(applyPropertySave({
      project,
      target: { kind: 'entity', id: project.entities[0].id },
      name: '   ',
      logicalName: '',
      description: '',
      identifier: false,
      notNull: false,
      unique: false,
      keyOrder: 1,
      typeChanged: false,
      typeFields: fields,
    })).toEqual({ ok: false, error: 'Le nom est obligatoire.' })
    const invalid = applyPropertySave({
      project,
      target: { kind: 'entity', id: project.entities[0].id },
      name: '1nom',
      logicalName: '',
      description: '',
      identifier: false,
      notNull: false,
      unique: false,
      keyOrder: 1,
      typeChanged: false,
      typeFields: fields,
    })
    expect(invalid.ok).toBe(false)
    if (!invalid.ok) expect(invalid.error).toMatch(/nom/i)
  })

  it('conserve la configuration historique lors d’un simple renommage', () => {
    let project = projectWithEntity()
    const entity = project.entities[0]
    const legacy = createAttribute('a_legacy', 'code', 'TEXT')
    legacy.typeConfig = { text: { charset: 'UNICODE', storage: 'FIXED', length: 8, collation: 'fr-FR-x-icu' } }
    project = { ...project, entities: [{ ...entity, attributes: [legacy] }] }
    const formDefaults = propertyTypeDefaults(legacy)
    expect(formDefaults.textStorage).toBe('FIXED')
    const renamed = applyPropertySave({
      project,
      target: { kind: 'entity', id: entity.id, attributeId: legacy.id },
      name: 'code_postal',
      logicalName: ' Code ',
      description: '  identifiant  ',
      identifier: false,
      notNull: true,
      unique: true,
      keyOrder: 1,
      typeChanged: false,
      typeFields: { ...formDefaults, textLength: 50, textStorage: 'VARIABLE' },
      editedAttribute: legacy,
    })
    expect(renamed.ok).toBe(true)
    if (!renamed.ok) return
    const saved = renamed.project.entities[0].attributes[0]
    expect(saved.name).toBe('code_postal')
    expect(saved.logicalName).toBe('Code')
    expect(saved.description).toBe('identifiant')
    expect(saved.typeConfig).toEqual(legacy.typeConfig)
    expect(saved.nullable).toBe(false)
    expect(saved.unique).toBe(true)
  })

  it('applique la configuration du formulaire seulement si le type a changé', () => {
    let project = projectWithEntity()
    const entity = project.entities[0]
    const attribute = createAttribute('a1', 'montant', 'DECIMAL')
    attribute.typeConfig = { numeric: { kind: 'DECIMAL', precision: 8, scale: 2 } }
    project = { ...project, entities: [{ ...entity, attributes: [attribute] }] }
    const fields = { ...propertyTypeDefaults(attribute), numericKind: 'INTEGER' as const, numericBits: 64 as const, section: 'numeric' as const }
    const changed = applyPropertySave({
      project,
      target: { kind: 'entity', id: entity.id, attributeId: attribute.id },
      name: 'montant',
      logicalName: '',
      description: '',
      identifier: false,
      notNull: false,
      unique: false,
      keyOrder: 1,
      typeChanged: true,
      typeFields: fields,
      editedAttribute: attribute,
    })
    expect(changed.ok).toBe(true)
    if (!changed.ok) return
    expect(changed.project.entities[0].attributes[0].typeConfig).toEqual({ numeric: { kind: 'INTEGER', bits: 64 } })
    expect(changed.project.entities[0].attributes[0].conceptualType).toBe('INTEGER')
  })

  it('force nullable et unique pour un identifiant et conserve l’ordre', () => {
    let project = projectWithEntity()
    const entity = project.entities[0]
    const first = createAttribute('a1', 'a', 'TEXT')
    const second = createAttribute('a2', 'b', 'TEXT')
    const identifier = createIdentifier('id1', [first.id, second.id])
    project = { ...project, entities: [{ ...entity, attributes: [first, second], identifiers: [identifier] }] }
    const saved = applyPropertySave({
      project,
      target: { kind: 'entity', id: entity.id, attributeId: second.id },
      name: 'b',
      logicalName: '',
      description: '',
      identifier: true,
      notNull: false,
      unique: true,
      keyOrder: 1,
      identifierId: identifier.id,
      typeChanged: false,
      typeFields: propertyTypeDefaults(second),
      editedAttribute: second,
    })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    const nextEntity = saved.project.entities[0]
    const attr = nextEntity.attributes.find((item) => item.id === second.id)
    expect(attr?.nullable).toBe(false)
    expect(attr?.unique).toBe(false)
    expect(nextEntity.identifiers[0].attributeIds[0]).toBe(second.id)
  })

  it('refuse un doublon et n’applique pas d’identifiant sur une association', () => {
    let project = projectWithEntity()
    project = createEntityCommand(project)
    project = renameEntity(project, project.entities[1].id, 'COMMANDE')
    project = createAssociationBetween(project, project.entities[0].id, project.entities[1].id, 'N:N')
    const association = project.associations[0]
    const existing = createAttribute('aa1', 'quantite', 'INTEGER')
    project = { ...project, associations: [{ ...association, attributes: [existing] }] }
    const duplicate = applyPropertySave({
      project,
      target: { kind: 'association', id: association.id },
      name: 'quantite',
      logicalName: '',
      description: '',
      identifier: true,
      notNull: true,
      unique: true,
      keyOrder: 3,
      typeChanged: false,
      typeFields: propertyTypeDefaults(),
    })
    expect(duplicate).toEqual({ ok: false, error: 'Une propriété portant ce nom existe déjà.' })

    const added = applyPropertySave({
      project,
      target: { kind: 'association', id: association.id },
      name: 'date_ligne',
      logicalName: '',
      description: '',
      identifier: true,
      notNull: true,
      unique: true,
      keyOrder: 3,
      typeChanged: false,
      typeFields: propertyTypeDefaults(),
    })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const attr = added.project.associations[0].attributes.find((item) => item.name === 'date_ligne')
    expect(attr).toBeDefined()
    expect(added.project.entities.every((entity) => entity.identifiers.every((item) => !item.attributeIds.includes(attr!.id)))).toBe(true)
  })

  it('remonte une erreur de type libre invalide', () => {
    const project = projectWithEntity()
    const result = applyPropertySave({
      project,
      target: { kind: 'entity', id: project.entities[0].id },
      name: 'payload',
      logicalName: '',
      description: '',
      identifier: false,
      notNull: false,
      unique: false,
      keyOrder: 1,
      typeChanged: true,
      typeFields: { ...propertyTypeDefaults(), section: 'other', otherKind: 'FREE', freeType: 'TEXT; DROP TABLE client' },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/PostgreSQL/i)
  })
})
