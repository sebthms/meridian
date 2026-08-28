import { describe, it, expect } from 'vitest'
import { generateMld, formatMld } from '@/mld'
import { buildProject, makeEntity, makeAssociation } from '@/merise/rules/__tests__/helpers'

// ─────────────────────────────────────────────────────────────────────────
// Tests des cas limites du générateur MLD (§14–§21).
// ─────────────────────────────────────────────────────────────────────────

describe('MLD — entités', () => {
  it('une entité sans identifiant produit une relation sans PK (cas dégradé, mais ne plante pas)', () => {
    // Même si E002 bloque la validation, le générateur doit rester robuste.
    const entity = makeEntity('CLIENT', { attrs: [['nom', 'TEXT']] }) // pas d'identifiant
    const mld = generateMld(buildProject({ entities: [entity] }))
    const rel = mld.relations.find((r) => r.name === 'CLIENT')!
    expect(rel.columns.map((c) => c.name)).toEqual(['nom'])
    expect(rel.columns.some((c) => c.isPrimaryKey)).toBe(false)
  })

  it('les propriétés non identifiantes restent de simples colonnes', () => {
    const entity = makeEntity('CLIENT', {
      attrs: [['id_client', 'INTEGER'], ['nom', 'TEXT'], ['email', 'TEXT']],
      identifierAttrNames: ['id_client'],
    })
    const rel = generateMld(buildProject({ entities: [entity] })).relations[0]
    expect(rel.columns.map((c) => c.name)).toEqual(['id_client', 'nom', 'email'])
    expect(rel.columns.find((c) => c.name === 'nom')!.isPrimaryKey).toBe(false)
    expect(rel.columns.find((c) => c.name === 'nom')!.isForeignKey).toBe(false)
  })
})

describe('MLD — associations', () => {
  it('association à une extrémité sans entité résolue → ignorée (pas de crash)', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const assoc = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: 'e_absente', cardinality: { min: 1, max: 1 } },
    )
    // participants.length === 2, mais generateMld ne doit pas lever d'erreur.
    const mld = generateMld(buildProject({ entities: [client], associations: [assoc] }))
    expect(mld.relations.length).toBeGreaterThanOrEqual(1)
  })

  it('une association mal formée (1 participant) est ignorée', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const assoc = makeAssociation('ISOLE', { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: client.id, cardinality: { min: 0, max: 1 } })
    assoc.participants = [assoc.participants[0]] // forcer 1 seul participant
    const mld = generateMld(buildProject({ entities: [client], associations: [assoc] }))
    // Pas de crash ; le relation CLIENT reste présente.
    expect(mld.relations.find((r) => r.name === 'CLIENT')).toBeDefined()
  })

  it('une entité reliée à plusieurs associations hérite de plusieurs FK', () => {
    // CLIENT 0,N ─PASSER─ COMMANDE 1,1  et  CLIENT 0,N ─FACTURER─ FACTURE 1,1
    // → la FK id_client (référence CLIENT) migre vers COMMANDE ET vers FACTURE.
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    const facture = makeEntity('FACTURE', { attrs: [['id_facture', 'INTEGER']], identifierAttrNames: ['id_facture'] })

    const a1 = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } })
    const a2 = makeAssociation('FACTURER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: facture.id, cardinality: { min: 1, max: 1 } })

    const mld = generateMld(buildProject({ entities: [client, commande, facture], associations: [a1, a2] }))

    // COMMANDE reçoit id_client (FK) référençant CLIENT
    const cmd = mld.relations.find((r) => r.name === 'COMMANDE')!
    expect(cmd.columns.some((c) => c.isForeignKey && c.name === 'id_client' && c.references?.table === 'CLIENT')).toBe(true)
    // FACTURE reçoit aussi id_client (FK) référençant CLIENT
    const fac = mld.relations.find((r) => r.name === 'FACTURE')!
    expect(fac.columns.some((c) => c.isForeignKey && c.name === 'id_client' && c.references?.table === 'CLIENT')).toBe(true)
    // CLIENT n'hérite d'aucune FK
    const cli = mld.relations.find((r) => r.name === 'CLIENT')!
    expect(cli.columns.some((c) => c.isForeignKey)).toBe(false)
  })

  it('identifiant composé → clé primaire composée', () => {
    const entity = makeEntity('PALMARES', {
      attrs: [['id_annee', 'INTEGER'], ['id_discipline', 'INTEGER']],
      identifierAttrNames: ['id_annee', 'id_discipline'],
    })
    const rel = generateMld(buildProject({ entities: [entity] })).relations[0]
    expect(rel.columns.filter((c) => c.isPrimaryKey)).toHaveLength(2)
  })

  it('une FK est nommée id_<entité> même quand la PK est `id` (pas de collision)', () => {
    // La PK par défaut est `id` ; la FK doit prendre le nom de l'entité référencée.
    const client = makeEntity('CLIENT', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const assoc = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } })
    const mld = generateMld(buildProject({ entities: [client, commande], associations: [assoc] }))

    const cmd = mld.relations.find((r) => r.name === 'COMMANDE')!
    const fk = cmd.columns.find((c) => c.isForeignKey)!
    expect(fk.name).toBe('id_client')
    expect(fk.references?.table).toBe('CLIENT')
    expect(fk.references?.column).toBe('id')
    // La PK `id` de COMMANDE et la FK `id_client` coexistent sans collision.
    expect(cmd.columns.filter((c) => c.name === 'id')).toHaveLength(1)
  })

  it('évite les collisions de noms de FK (suffixe _2)', () => {
    // COMMANDE possède déjà une propriété `id_client` + une association vers CLIENT.
    const client = makeEntity('CLIENT', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const commande = makeEntity('COMMANDE', {
      attrs: [['id', 'INTEGER'], ['id_client', 'INTEGER']],
      identifierAttrNames: ['id'],
    })
    const assoc = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } })
    const mld = generateMld(buildProject({ entities: [client, commande], associations: [assoc] }))

    const cmd = mld.relations.find((r) => r.name === 'COMMANDE')!
    const names = cmd.columns.map((c) => c.name)
    expect(names).toContain('id_client')
    expect(names).toContain('id_client_2')
  })
})

describe('MLD — format d’aperçu', () => {
  it('formatMld produit une sortie lisible avec PK/FK', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER'], ['nom', 'TEXT']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    const assoc = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } })
    const mld = generateMld(buildProject({ entities: [client, commande], associations: [assoc] }))

    const text = formatMld(mld)
    expect(text).toContain('COMMANDE')
    expect(text).toContain('id_client FK → CLIENT.id_client')
    expect(text).toContain('id_commande PK')
  })
})