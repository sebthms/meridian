import { describe, it, expect } from 'vitest'
import { generateMld } from './generator'
import { buildProject, makeEntity, makeAssociation } from '@/merise/rules/__tests__/helpers'

describe('MLD generator', () => {
  it('Rule 1: entity becomes a relation', () => {
    const project = buildProject({
      entities: [
        makeEntity('CLIENT', {
          attrs: [['id_client', 'INTEGER'], ['nom', 'TEXT']],
          identifierAttrNames: ['id_client'],
        }),
      ],
    })
    const mld = generateMld(project)
    const relation = mld.relations.find((r) => r.name === 'CLIENT')
    expect(relation).toBeDefined()
    expect(relation!.columns.find((c) => c.name === 'id_client')?.isPrimaryKey).toBe(true)
    expect(relation!.columns.find((c) => c.name === 'nom')?.isForeignKey).toBe(false)
  })

  it('Rule 2: 1:N migrates FK into the child table', () => {
    const client = makeEntity('CLIENT', {
      attrs: [['id_client', 'INTEGER']],
      identifierAttrNames: ['id_client'],
    })
    const commande = makeEntity('COMMANDE', {
      attrs: [['id_commande', 'INTEGER']],
      identifierAttrNames: ['id_commande'],
    })
    const association = makeAssociation(
      'PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } },
    )
    const project = buildProject({ entities: [client, commande], associations: [association] })
    const mld = generateMld(project)
    const cmd = mld.relations.find((r) => r.name === 'COMMANDE')!
    const fk = cmd.columns.find((c) => c.name === 'id_client')
    expect(fk?.isForeignKey).toBe(true)
    expect(fk?.references?.table).toBe('CLIENT')
  })

  it('Rule 3: N:N creates an associative table', () => {
    const etudiant = makeEntity('ETUDIANT', {
      attrs: [['id_etudiant', 'INTEGER']],
      identifierAttrNames: ['id_etudiant'],
    })
    const cours = makeEntity('COURS', {
      attrs: [['id_cours', 'INTEGER']],
      identifierAttrNames: ['id_cours'],
    })
    const inscription = makeAssociation(
      'INSCRIPTION',
      { entityId: etudiant.id, cardinality: { min: 0, max: 'N' } },
      { entityId: cours.id, cardinality: { min: 0, max: 'N' } },
    )
    const project = buildProject({ entities: [etudiant, cours], associations: [inscription] })
    const mld = generateMld(project)
    const table = mld.relations.find((r) => r.name === 'INSCRIPTION')!
    expect(table.columns).toHaveLength(2)
    expect(table.columns.every((c) => c.isPrimaryKey && c.isForeignKey)).toBe(true)
  })

  it('N:N with association properties', () => {
    const etudiant = makeEntity('ETUDIANT', {
      attrs: [['id_etudiant', 'INTEGER']],
      identifierAttrNames: ['id_etudiant'],
    })
    const cours = makeEntity('COURS', {
      attrs: [['id_cours', 'INTEGER']],
      identifierAttrNames: ['id_cours'],
    })
    const inscription = makeAssociation(
      'INSCRIPTION',
      { entityId: etudiant.id, cardinality: { min: 0, max: 'N' } },
      { entityId: cours.id, cardinality: { min: 0, max: 'N' } },
    )
    inscription.attributes = [{ id: 'p_date', name: 'date', conceptualType: 'DATE', nullable: false }]
    const project = buildProject({ entities: [etudiant, cours], associations: [inscription] })
    const mld = generateMld(project)
    const table = mld.relations.find((r) => r.name === 'INSCRIPTION')!
    expect(table.columns).toHaveLength(3)
    expect(table.columns.some((c) => c.name === 'date')).toBe(true)
  })

  it('0,1 ↔ 1,1 places FK in the 1,1 side (spec decision)', () => {
    const a = makeEntity('A', { attrs: [['id_a', 'INTEGER']], identifierAttrNames: ['id_a'] })
    const b = makeEntity('B', { attrs: [['id_b', 'INTEGER']], identifierAttrNames: ['id_b'] })
    const assoc = makeAssociation(
      'A_B',
      { entityId: a.id, cardinality: { min: 0, max: 1 } },
      { entityId: b.id, cardinality: { min: 1, max: 1 } },
    )
    const project = buildProject({ entities: [a, b], associations: [assoc] })
    const mld = generateMld(project)
    const relB = mld.relations.find((r) => r.name === 'B')!
    expect(relB.columns.some((c) => c.isForeignKey && c.references?.table === 'A')).toBe(true)
  })

  it('1,1 ↔ 1,1 keeps two tables (spec decision)', () => {
    const a = makeEntity('A', { attrs: [['id_a', 'INTEGER']], identifierAttrNames: ['id_a'] })
    const b = makeEntity('B', { attrs: [['id_b', 'INTEGER']], identifierAttrNames: ['id_b'] })
    const assoc = makeAssociation(
      'A_B',
      { entityId: a.id, cardinality: { min: 1, max: 1 } },
      { entityId: b.id, cardinality: { min: 1, max: 1 } },
    )
    const project = buildProject({ entities: [a, b], associations: [assoc] })
    const mld = generateMld(project)
    expect(mld.relations.filter((r) => ['A', 'B'].includes(r.name))).toHaveLength(2)
  })

  it('reflexive association produces a self-referencing FK', () => {
    const employe = makeEntity('EMPLOYE', {
      attrs: [['id_employe', 'INTEGER']],
      identifierAttrNames: ['id_employe'],
    })
    const assoc = makeAssociation(
      'GERER',
      { entityId: employe.id, role: 'manager', cardinality: { min: 0, max: 'N' } },
      { entityId: employe.id, role: 'subordonne', cardinality: { min: 0, max: 1 } },
    )
    const project = buildProject({ entities: [employe], associations: [assoc] })
    const mld = generateMld(project)
    const table = mld.relations.find((r) => r.name === 'EMPLOYE')!
    const fks = table.columns.filter((c) => c.isForeignKey)
    expect(fks.length).toBeGreaterThan(0)
    expect(fks.every((c) => c.references?.table === 'EMPLOYE')).toBe(true)
  })

  it('composite identifier produces a composite PK', () => {
    const entity = makeEntity('PALMARES', {
      attrs: [['id_annee', 'INTEGER'], ['id_discipline', 'INTEGER']],
      identifierAttrNames: ['id_annee', 'id_discipline'],
    })
    const project = buildProject({ entities: [entity] })
    const mld = generateMld(project)
    const rel = mld.relations.find((r) => r.name === 'PALMARES')!
    expect(rel.columns.filter((c) => c.isPrimaryKey)).toHaveLength(2)
  })

  it('1:N with association properties places properties on the N side', () => {
    const client = makeEntity('CLIENT', {
      attrs: [['id_client', 'INTEGER']],
      identifierAttrNames: ['id_client'],
    })
    const commande = makeEntity('COMMANDE', {
      attrs: [['id_commande', 'INTEGER']],
      identifierAttrNames: ['id_commande'],
    })
    const assoc = makeAssociation(
      'PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } },
    )
    assoc.attributes = [{ id: 'p_date', name: 'date_passe', conceptualType: 'DATE' }]
    const project = buildProject({ entities: [client, commande], associations: [assoc] })
    const mld = generateMld(project)
    const cmd = mld.relations.find((r) => r.name === 'COMMANDE')!
    const cli = mld.relations.find((r) => r.name === 'CLIENT')!
    // la FK est dans le côté 1,1 (COMMANDE)
    expect(cmd.columns.some((c) => c.isForeignKey && c.references?.table === 'CLIENT')).toBe(true)
    // la propriété migre dans le côté N (CLIENT), pas dans COMMANDE
    expect(cli.columns.some((c) => c.name === 'date_passe')).toBe(true)
    expect(cmd.columns.some((c) => c.name === 'date_passe')).toBe(false)
  })

  it('reflexive 1:N with association properties adds properties to the entity table', () => {
    const employe = makeEntity('EMPLOYE', {
      attrs: [['id_employe', 'INTEGER']],
      identifierAttrNames: ['id_employe'],
    })
    const assoc = makeAssociation(
      'GERER',
      { entityId: employe.id, role: 'manager', cardinality: { min: 0, max: 'N' } },
      { entityId: employe.id, role: 'subordonne', cardinality: { min: 0, max: 1 } },
    )
    assoc.attributes = [{ id: 'p_depuis', name: 'depuis', conceptualType: 'DATE' }]
    const project = buildProject({ entities: [employe], associations: [assoc] })
    const mld = generateMld(project)
    const table = mld.relations.find((r) => r.name === 'EMPLOYE')!
    // FK autoréférentielle
    expect(table.columns.some((c) => c.isForeignKey && c.references?.table === 'EMPLOYE')).toBe(true)
    // la propriété de l'association est dans la table
    expect(table.columns.some((c) => c.name === 'depuis')).toBe(true)
  })
})