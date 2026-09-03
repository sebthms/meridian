import { describe, expect, it } from 'vitest'
import { createFunctionalDependencyConstraint, createInheritance, createModelConstraint, createBusinessRule } from '@/domain'
import { generateMld, formatMld } from '@/mld'
import { generateSql } from '@/sql'
import { buildProject, makeAssociation, makeEntity } from '@/merise/rules/__tests__/helpers'

describe('Export conceptuel MLD/SQL', () => {
  it('n’ajoute aucune table ni FK pour l’héritage, la contrainte, la CIF ou la règle', () => {
    const parent = makeEntity('PERSONNE', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const child = makeEntity('CLIENT', { attrs: [['id', 'INTEGER'], ['email', 'TEXT']], identifierAttrNames: ['id'] })
    const association = makeAssociation(
      'EST',
      { entityId: child.id, cardinality: { min: 0, max: 'N' } },
      { entityId: parent.id, cardinality: { min: 1, max: 1 } },
    )
    const project = buildProject({
      entities: [parent, child],
      associations: [association],
      inheritances: [{ ...createInheritance('inh1', 'SPEC'), parentEntityId: parent.id, childEntityIds: [child.id] }],
      constraints: [{ ...createModelConstraint('cst1', 'EXCL'), kind: 'exclusion', targetIds: [association.id], description: 'Exclusion' }],
      cifs: [{ ...createFunctionalDependencyConstraint('cif1', 'CIF'), sourceEntityId: child.id, targetEntityId: parent.id, associationId: association.id, description: 'Client détermine personne' }],
      businessRules: [{ ...createBusinessRule('br1', 'EMAIL'), description: 'Email obligatoire', level: 'error', targetIds: [child.id] }],
    })
    const mld = generateMld(project)
    expect(mld.relations.map((relation) => relation.source)).toEqual(['entity', 'entity'])
    expect(mld.conceptualNotes).toHaveLength(4)
    expect(mld.conceptualNotes.every((note) => note.text.length > 0)).toBe(true)

    const sql = generateSql(mld)
    expect(sql).toContain('-- Concepts MERISE conceptuels')
    expect(sql).toContain('Héritage SPEC')
    expect(sql).toContain('CIF CIF')
    expect(sql).toContain('CREATE TABLE personne')
    expect(sql).toContain('CREATE TABLE client')
    expect(sql.match(/CREATE TABLE/g)?.length).toBe(2)
    expect(formatMld(mld)).toContain('Concepts MERISE (non exportés en tables)')
  })

  it('n’invente pas de dépendance fonctionnelle à partir des noms', () => {
    const commande = makeEntity('COMMANDE', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const client = makeEntity('CLIENT', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const project = buildProject({
      entities: [commande, client],
      cifs: [{ ...createFunctionalDependencyConstraint('cif1', 'CIF'), sourceEntityId: commande.id, targetEntityId: client.id }],
    })
    const mld = generateMld(project)
    const sql = generateSql(mld)
    expect(sql).not.toContain('FOREIGN KEY')
    expect(sql).toContain('aucune clé étrangère n’est inventée')
  })
})
