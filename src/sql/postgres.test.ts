import { describe, it, expect } from 'vitest'
import { generateMld } from '@/mld'
import { generateSql } from './postgres'
import { buildProject, makeEntity, makeAssociation } from '@/merise/rules/__tests__/helpers'

describe('SQL generator (PostgreSQL)', () => {
  it('generates a CREATE TABLE from a simple entity', () => {
    const project = buildProject({
      entities: [
        makeEntity('CLIENT', {
          attrs: [['id_client', 'INTEGER'], ['nom', 'TEXT']],
          identifierAttrNames: ['id_client'],
        }),
      ],
    })
    const sql = generateSql(generateMld(project))
    expect(sql).toContain('CREATE TABLE client')
    expect(sql).toContain('id_client INTEGER PRIMARY KEY')
    expect(sql).toContain('nom TEXT')
  })

  it('generates a foreign key for a 1:N relation', () => {
    const client = makeEntity('CLIENT', {
      attrs: [['id_client', 'INTEGER']],
      identifierAttrNames: ['id_client'],
    })
    const commande = makeEntity('COMMANDE', {
      attrs: [['id_commande', 'INTEGER'], ['date_commande', 'DATE']],
      identifierAttrNames: ['id_commande'],
    })
    const assoc = makeAssociation(
      'PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } },
    )
    const project = buildProject({ entities: [client, commande], associations: [assoc] })
    const sql = generateSql(generateMld(project))
    expect(sql).toContain('CONSTRAINT fk_commande_id_client')
    expect(sql).toContain('REFERENCES client(id_client)')
  })

  it('decides the conceptual DECIMAL type as NUMERIC', () => {
    const entity = makeEntity('ARTICLE', {
      attrs: [['id_article', 'INTEGER'], ['prix', 'DECIMAL']],
      identifierAttrNames: ['id_article'],
    })
    const sql = generateSql(generateMld(buildProject({ entities: [entity] })))
    expect(sql).toContain('prix NUMERIC')
  })
})