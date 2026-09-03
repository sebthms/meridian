import { describe, it, expect } from 'vitest'
import { validateProject } from '@/merise'
import { buildProject, makeEntity, makeAssociation } from './rules/__tests__/helpers'

describe('Règles de conception', () => {
  it('MERISE-W016 : identifiant instable', () => {
    const entity = makeEntity('CLIENT', {
      attrs: [['email', 'TEXT'], ['nom', 'TEXT']],
      identifierAttrNames: ['email'],
    })
    const { warnings } = validateProject(buildProject({ entities: [entity] }))
    expect(warnings.some((item) => item.ruleId === 'MERISE-W016')).toBe(true)
  })

  it('MERISE-W017 : entité au pluriel', () => {
    const entity = makeEntity('CLIENTS', { attrs: [['id_client', 'INTEGER'], ['nom', 'TEXT']], identifierAttrNames: ['id_client'] })
    const { warnings } = validateProject(buildProject({ entities: [entity] }))
    expect(warnings.some((item) => item.ruleId === 'MERISE-W017')).toBe(true)
  })

  it('MERISE-W001 : association générique (ex-LIEN)', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    const assoc = makeAssociation('LIEN',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } },
    )
    const { warnings } = validateProject(buildProject({ entities: [client, commande], associations: [assoc] }))
    expect(warnings.some((item) => item.ruleId === 'MERISE-W001')).toBe(true)
  })

  it('MERISE-W001 : entité en minuscules (ex-W024)', () => {
    const entity = makeEntity('client', { attrs: [['id_client', 'INTEGER'], ['nom', 'TEXT']], identifierAttrNames: ['id_client'] })
    const { warnings } = validateProject(buildProject({ entities: [entity] }))
    expect(warnings.some((item) => item.ruleId === 'MERISE-W001')).toBe(true)
  })

  it('MERISE-W019 : entité sans propriété descriptive', () => {
    const entity = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const { warnings } = validateProject(buildProject({ entities: [entity] }))
    expect(warnings.some((item) => item.ruleId === 'MERISE-W019')).toBe(true)
  })

  it('MERISE-W020 : redondance entre entités liées', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER'], ['ville', 'TEXT']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER'], ['ville', 'TEXT']], identifierAttrNames: ['id_commande'] })
    const assoc = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } },
    )
    const { warnings } = validateProject(buildProject({ entities: [client, commande], associations: [assoc] }))
    expect(warnings.some((item) => item.ruleId === 'MERISE-W020')).toBe(true)
  })

  it('MERISE-W022 : relation 1,1 des deux côtés', () => {
    const a = makeEntity('A', { attrs: [['id_a', 'INTEGER']], identifierAttrNames: ['id_a'], id: 'ea' })
    const b = makeEntity('B', { attrs: [['id_b', 'INTEGER']], identifierAttrNames: ['id_b'], id: 'eb' })
    const assoc = makeAssociation('POSSEDER',
      { entityId: a.id, cardinality: { min: 1, max: 1 } },
      { entityId: b.id, cardinality: { min: 1, max: 1 } },
    )
    const { warnings } = validateProject(buildProject({ entities: [a, b], associations: [assoc] }))
    expect(warnings.some((item) => item.ruleId === 'MERISE-W022')).toBe(true)
  })

  it('MERISE-W025 : identifiant booléen', () => {
    const entity = makeEntity('FLAG', {
      attrs: [['actif', 'BOOLEAN'], ['libelle', 'TEXT']],
      identifierAttrNames: ['actif'],
    })
    const { warnings } = validateProject(buildProject({ entities: [entity] }))
    expect(warnings.some((item) => item.ruleId === 'MERISE-W025')).toBe(true)
  })
})
