import { describe, it, expect } from 'vitest'
import { validateProject, normalizeProject } from '@/merise'
import { buildProject, makeEntity, makeAssociation } from './rules/__tests__/helpers'

// ─────────────────────────────────────────────────────────────────────────
// Tests des règles de validation (§10). Complète validator.test.ts en
// couvrant E006→E010, la normalisation et les cas de figure particuliers.
// ─────────────────────────────────────────────────────────────────────────

function ruleIds(issues: Array<{ ruleId: string }>): Set<string> {
  return new Set(issues.map((i) => i.ruleId))
}

describe('Validation — règles E006 → E010', () => {
  it('MERISE-E006 : association sans nom', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    const assoc = makeAssociation('', // ← nom vide
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } },
    )
    const { issues } = validateProject(buildProject({ entities: [client, commande], associations: [assoc] }))
    expect(ruleIds(issues).has('MERISE-E006')).toBe(true)
  })

  it('MERISE-E007 : association mal connectée (moins de 2 participants valides)', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    // Participant vers une entité inexistante
    const assoc = makeAssociation(
      'PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: 'entite_supprimee', cardinality: { min: 1, max: 1 } },
    )
    const { issues } = validateProject(buildProject({ entities: [client, commande], associations: [assoc] }))
    expect(ruleIds(issues).has('MERISE-E007')).toBe(true)
    // Ici l'un des participants est encore valide → E010 ne se déclenche PAS
    // (E010 n'apparaît que quand AUCUN participant ne pointe vers une entité existante).
    expect(ruleIds(issues).has('MERISE-E010')).toBe(false)
  })

  it('MERISE-E008 : cardinalité invalide (hors des 4 formes)', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    const assoc = makeAssociation(
      'PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } },
    )
    // NB : le helper type le champ en Cardinality ; on force la valeur invalide à la volée
    // (min > 1 → E008, puisque le MVP n'accepte que 0,1 / 1,1 / 0,N / 1,N).
    assoc.participants[0].cardinality = { min: 2, max: 'N' } as never
    const { issues } = validateProject(buildProject({ entities: [client, commande], associations: [assoc] }))
    expect(ruleIds(issues).has('MERISE-E008')).toBe(true)
  })

  it('MERISE-E009 : cardinalité absente sur une extrémité', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    const assoc = makeAssociation(
      'PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } },
    )
    // On retire la cardinalité du 2e participant → extrémité sans cardinalité.
    delete (assoc.participants[1] as { cardinality?: unknown }).cardinality
    const { issues } = validateProject(buildProject({ entities: [client, commande], associations: [assoc] }))
    expect(ruleIds(issues).has('MERISE-E009')).toBe(true)
  })

  it('MERISE-E010 : référence vers entité supprimée', () => {
    // Association dont TOUTES les entités ont été supprimées → id orphelin.
    const assoc = makeAssociation(
      'PASSER',
      { entityId: 'e_disparu', cardinality: { min: 0, max: 'N' } },
      { entityId: 'e_disparu2', cardinality: { min: 1, max: 1 } },
    )
    const { issues } = validateProject(buildProject({ entities: [], associations: [assoc] }))
    expect(ruleIds(issues).has('MERISE-E010')).toBe(true)
  })
})

describe('Validation — cas particuliers', () => {
  it('plusieurs associations entre les mêmes entités sont autorisées (aucune erreur)', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    // Deux associations distinctes CLIENT↔COMMANDE (§2 « plusieurs associations entre les mêmes entités »)
    const a1 = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } })
    const a2 = makeAssociation('ANNULER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 0, max: 'N' } })
    const { errors } = validateProject(buildProject({ entities: [client, commande], associations: [a1, a2] }))
    expect(errors).toHaveLength(0)
  })

  it('la validation est en temps réel et retourne erreurs + warnings séparés', () => {
    // Entité valide SAUF un warning (nom suspect) → errors=0, warnings>0.
    const entity = makeEntity('entite1', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const result = validateProject(buildProject({ entities: [entity] }))
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some((w) => w.ruleId === 'MERISE-W001')).toBe(true)
  })
})

describe('Normalisation (§14)', () => {
  it('normalizeProject retire les participants orphelins avant validation', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    const assoc = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: 'e_disparu', cardinality: { min: 1, max: 1 } })

    const normalized = normalizeProject(buildProject({ entities: [client, commande], associations: [assoc] }))
    // Le participant orphelin a été retiré ; la validation ne signale donc plus E010.
    expect(normalized.associations[0].participants.map((p) => p.entityId)).toEqual([client.id])
    const { issues } = validateProject(normalized)
    expect(ruleIds(issues).has('MERISE-E010')).toBe(false)
  })
})