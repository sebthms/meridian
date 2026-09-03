import { describe, expect, it } from 'vitest'
import { attributeToSql } from './model'
import { generateSql } from './postgres'
import { generateMld } from '@/mld'
import { parseAttributeTypeConfig, getPrimaryIdentifier, type AttributeTypeConfig } from '@/domain'
import { exportProject, parseProject } from '@/persistence/project-file'
import { setAttributeIdentifier, setIdentifierOrder } from '@/editor'
import { buildProject, makeAssociation, makeEntity } from '@/test-support/project-fixtures'

const sqlType = (typeConfig: AttributeTypeConfig) => attributeToSql({ conceptualType: 'TEXT', typeConfig })

describe('Types avancés — régressions', () => {
  it.each([
    [{ text: { charset: 'ASCII', storage: 'VARIABLE', length: 80 } }, 'VARCHAR(80)'],
    [{ text: { charset: 'UNICODE', storage: 'FIXED', length: 12 } }, 'CHAR(12)'],
    [{ text: { charset: 'UNICODE', storage: 'LARGE' } }, 'TEXT'],
    [{ text: { charset: 'BINARY', storage: 'LARGE' } }, 'BYTEA'],
    [{ numeric: { kind: 'INTEGER', bits: 8 } }, 'SMALLINT'],
    [{ numeric: { kind: 'INTEGER', bits: 16 } }, 'SMALLINT'],
    [{ numeric: { kind: 'INTEGER', bits: 32 } }, 'INTEGER'],
    [{ numeric: { kind: 'INTEGER', bits: 64 } }, 'BIGINT'],
    [{ numeric: { kind: 'DECIMAL', precision: 15, scale: 2 } }, 'NUMERIC(15,2)'],
    [{ numeric: { kind: 'DECIMAL', precision: 1 } }, 'NUMERIC(1,1)'],
    [{ numeric: { kind: 'REAL', floating: 'SINGLE' } }, 'REAL'],
    [{ numeric: { kind: 'REAL', floating: 'DOUBLE' } }, 'DOUBLE PRECISION'],
    [{ numeric: { kind: 'MONEY' } }, 'MONEY'],
    [{ numeric: { kind: 'COUNTER' } }, 'BIGSERIAL'],
    [{ dateTime: { kind: 'DATE' } }, 'DATE'],
    [{ dateTime: { kind: 'TIME' } }, 'TIME'],
    [{ dateTime: { kind: 'DATETIME' } }, 'TIMESTAMP'],
    [{ dateTime: { kind: 'DATETIME', timezone: true } }, 'TIMESTAMP WITH TIME ZONE'],
    [{ other: { kind: 'XML' } }, 'XML'],
    [{ other: { kind: 'BOOLEAN' } }, 'BOOLEAN'],
    [{ other: { kind: 'GEOMETRIC' } }, 'GEOMETRY'],
    [{ other: { kind: 'GEOGRAPHIC' } }, 'GEOGRAPHY'],
  ] satisfies [AttributeTypeConfig, string][])('convertit %j', (config, expected) => {
    expect(sqlType(config)).toBe(expected)
  })

  it.each(['VARIABLE', 'FIXED', 'LARGE'] as const)('ne génère jamais de collation binaire (%s)', (storage) => {
    const config: AttributeTypeConfig = { text: { charset: 'BINARY', storage, length: 50, collation: 'fr-FR-x-icu' } }
    expect(sqlType(config)).not.toContain('COLLATE')
    expect(parseAttributeTypeConfig(config)?.text?.collation).toBeUndefined()
  })

  it('échappe le nom de la collation sans le dénaturer', () => {
    expect(sqlType({ text: { charset: 'UNICODE', storage: 'LARGE', collation: 'ma"collation' } })).toBe('TEXT COLLATE "ma""collation"')
  })

  it.each(['JSONB', 'DOUBLE PRECISION', 'NUMERIC(15, 2)', 'TIMESTAMP(3) WITH TIME ZONE', 'CHARACTER VARYING(100)', 'public.mon_type', '"mon schema"."mon type"', 'TEXT[]'])('préserve le type libre %s', (freeType) => {
    expect(sqlType({ other: { kind: 'FREE', freeType } })).toBe(freeType)
  })

  it.each(['', 'TEXT; DROP TABLE client', 'INTEGER NOT NULL', 'TEXT --', 'TEXT /* comment */', 'TEXT DEFAULT 1'])('rejette le fragment libre %s', (freeType) => {
    expect(() => sqlType({ other: { kind: 'FREE', freeType } })).toThrow()
  })

  it('la FK d’un compteur n’obtient ni séquence ni NOT NULL implicite', () => {
    const parent = makeEntity('PARENT', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    parent.attributes[0].typeConfig = { numeric: { kind: 'COUNTER' } }
    const child = makeEntity('ENFANT', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const link = makeAssociation('LIEN', { entityId: parent.id, cardinality: { min: 0, max: 'N' } }, { entityId: child.id, cardinality: { min: 0, max: 1 } })
    const sql = generateSql(generateMld(buildProject({ entities: [parent, child], associations: [link] })))
    expect(sql.match(/BIGSERIAL/g)).toHaveLength(1)
    expect(sql).toContain('id_parent BIGINT NULL')
  })

  it('déclare PostGIS uniquement pour un modèle spatial', () => {
    const entity = makeEntity('LIEU', { attrs: [['position', 'TEXT']] })
    const project = buildProject({ entities: [entity] })
    expect(generateSql(generateMld(project))).not.toContain('EXTENSION')
    entity.attributes[0].typeConfig = { other: { kind: 'GEOGRAPHIC' } }
    const sql = generateSql(generateMld(project))
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS postgis;')
    expect(sql).toContain('position GEOGRAPHY')
  })

})

describe('Identifiants et import — régressions', () => {
  function entityWithKeys() {
    const entity = makeEntity('PARENT', { attrs: [['code', 'TEXT'], ['version', 'INTEGER']], identifierAttrNames: ['code'] })
    entity.identifiers = [
      { id: 'alternate', attributeIds: [entity.attributes[0].id], isPrimary: false },
      { id: 'primary', attributeIds: [entity.attributes[1].id], isPrimary: true },
    ]
    return entity
  }

  it('respecte l’ordre choisi dans la PK et la référence FK', () => {
    const parent = entityWithKeys()
    parent.identifiers = [{ id: 'key', attributeIds: parent.attributes.map((item) => item.id) }]
    const child = makeEntity('CHILD', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const link = makeAssociation('LIEN', { entityId: parent.id, cardinality: { min: 0, max: 'N' } }, { entityId: child.id, cardinality: { min: 1, max: 1 } })
    const project = setIdentifierOrder(buildProject({ entities: [parent, child], associations: [link] }), parent.id, parent.attributes[1].id, 1)
    const sql = generateSql(generateMld(project))
    expect(sql).toContain('PRIMARY KEY (version, code)')
    expect(sql).toContain('REFERENCES parent(version, code)')
    expect(sql).not.toContain(' UNIQUE')
  })

  it('décocher l’identifiant secondaire ne touche pas la clé principale', () => {
    const entity = entityWithKeys()
    const result = setAttributeIdentifier(buildProject({ entities: [entity] }), entity.id, entity.attributes[0].id, false)
    expect(result.entities[0].identifiers).toEqual([entity.identifiers[1]])
  })

  it('décocher une propriété retire ses appartenances réelles et promeut la clé restante', () => {
    const entity = entityWithKeys()
    const result = setAttributeIdentifier(buildProject({ entities: [entity] }), entity.id, entity.attributes[1].id, false)
    expect(getPrimaryIdentifier(result.entities[0])?.id).toBe('alternate')
    expect(result.entities[0].identifiers[0].attributeIds).toEqual([entity.attributes[0].id])
  })

  it('ajouter un identifiant utilise la clé principale explicite', () => {
    const entity = entityWithKeys()
    entity.attributes.push({ id: 'new', name: 'nouveau', conceptualType: 'INTEGER', nullable: true })
    const result = setAttributeIdentifier(buildProject({ entities: [entity] }), entity.id, 'new', true, 1)
    expect(result.entities[0].identifiers[0]).toEqual(entity.identifiers[0])
    expect(result.entities[0].identifiers[1].attributeIds).toEqual(['new', entity.attributes[1].id])
    expect(result.entities[0].attributes[2].nullable).toBe(false)
  })

  it('préserve types, ordre et indicateur de clé principale après export/import', () => {
    const entity = entityWithKeys()
    entity.attributes[0] = { ...entity.attributes[0], typeConfig: { text: { charset: 'UNICODE', storage: 'VARIABLE', length: 80, collation: 'fr-FR-x-icu' } }, logicalName: 'Code', identifierOrder: 1 }
    const original = buildProject({ entities: [entity] })
    expect(parseProject(exportProject(original))).toEqual(original)
    expect(getPrimaryIdentifier(parseProject(exportProject(original)).entities[0])?.id).toBe('primary')
  })

  it.each([
    { text: { charset: 'ASCII', storage: 'VARIABLE', collation: 42 } },
    { text: { charset: 'UNKNOWN', storage: 'VARIABLE' } },
    { text: { charset: 'ASCII', storage: 'VARIABLE', length: '50' } },
    { text: { charset: 'ASCII', storage: 'VARIABLE', length: -2 } },
    { numeric: { kind: 'INTEGER', bits: 128 } },
    { numeric: { kind: 'DECIMAL', precision: 2, scale: 3 } },
    { numeric: { kind: 'DECIMAL', precision: 3.5 } },
    { dateTime: { kind: 'DATETIME', timezone: 'yes' } },
    { other: { kind: 'FREE', freeType: 'TEXT; DROP TABLE x' } },
    { text: {}, numeric: {} },
    {},
  ])('rejette une configuration mal formée dès l’import : %j', (typeConfig) => {
    const entity = entityWithKeys()
    const project = buildProject({ entities: [entity] })
    const raw = JSON.parse(exportProject(project))
    raw.entities[0].attributes[0].typeConfig = typeConfig
    expect(() => parseProject(JSON.stringify(raw))).toThrow()
  })
})
