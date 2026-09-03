import { describe, it, expect } from 'vitest'
import {
  createAttribute,
  isAttribute,
  CONCEPTUAL_TYPES,
  createCardinality,
  isCardinality,
  cardinalityToString,
  areCardinalitiesEqual,
  createIdentifier,
  isIdentifier,
  createEntity,
  isEntity,
  isIdentifierAttribute,
  getEntityAttributesInIdentifiers,
  createAssociation,
  isAssociation,
  isReflexive,
  createProject,
  findEntity,
  findAssociation,
} from '@/domain'

// ─────────────────────────────────────────────────────────────────────────
// Tests unitaires du MODÈLE CONCEPTUEL (§44 du PLAN.MD).
// Chaque type du domaine est vérifié : Attribute, Cardinality, Identifier,
// Entity, Association, Project.
// ─────────────────────────────────────────────────────────────────────────

describe('Attribute (§5)', () => {
  it('crée un attribut avec des valeurs par défaut', () => {
    // createAttribute(id, name, type) — nullable vaut false par défaut.
    const attr = createAttribute('a1', 'nom', 'TEXT')
    expect(attr.id).toBe('a1')
    expect(attr.name).toBe('nom')
    expect(attr.conceptualType).toBe('TEXT')
    expect(attr.nullable).toBe(false)
  })

  it('isAttribute accepte un attribut valide et rejette les valeurs invalides', () => {
    expect(isAttribute(createAttribute('a1', 'nom'))).toBe(true)
    // id manquant
    expect(isAttribute({ name: 'nom', conceptualType: 'TEXT' })).toBe(false)
    // type conceptuel non supporté
    expect(isAttribute({ id: 'a1', name: 'nom', conceptualType: 'VARCHAR(255)' })).toBe(false)
    // null
    expect(isAttribute(null)).toBe(false)
  })

  it('les 5 types conceptuels sont supportés (jamais de type SQL physique)', () => {
    // Le MCD ne doit PAS exposer VARCHAR(255), DECIMAL(10,2), SERIAL… (§23)
    expect(CONCEPTUAL_TYPES).toEqual(['TEXT', 'INTEGER', 'DECIMAL', 'DATE', 'BOOLEAN'])
  })
})

describe('Cardinality (§8)', () => {
  it('createCardinality donne 0,N par défaut', () => {
    expect(createCardinality()).toEqual({ min: 0, max: 'N' })
  })

  it('isCardinality n’accepte que les 4 formes binaires du MVP', () => {
    // Les quatre cardinalités autorisées :
    for (const c of [
      { min: 0, max: 1 },
      { min: 1, max: 1 },
      { min: 0, max: 'N' },
      { min: 1, max: 'N' },
    ]) {
      expect(isCardinality(c)).toBe(true)
    }
    // Formes interdites dans le MVP : min > max, bornées (2,N, 3,5, 1,5…)
    expect(isCardinality({ min: 2, max: 1 })).toBe(false)
    expect(isCardinality({ min: 0, max: 2 })).toBe(false)
    expect(isCardinality({ min: 2, max: 'N' })).toBe(false)
    expect(isCardinality({ min: 1, max: 5 })).toBe(false)
    expect(isCardinality(null)).toBe(false)
  })

  it('cardinalityToString rend la notation MERISE "min,max"', () => {
    expect(cardinalityToString({ min: 1, max: 'N' })).toBe('1,N')
    expect(cardinalityToString({ min: 0, max: 1 })).toBe('0,1')
  })

  it('areCardinalitiesEqual compare par valeur', () => {
    expect(areCardinalitiesEqual({ min: 1, max: 'N' }, { min: 1, max: 'N' })).toBe(true)
    expect(areCardinalitiesEqual({ min: 1, max: 'N' }, { min: 0, max: 'N' })).toBe(false)
  })
})

describe('Identifier (§5)', () => {
  it('crée un identifiant (simple ou composé)', () => {
    // # id_client  → identifiant simple
    expect(createIdentifier('i1', ['a1']).attributeIds).toEqual(['a1'])
    // # id_client + # id_commande → identifiant composé
    expect(createIdentifier('i1', ['a1', 'a2']).attributeIds).toEqual(['a1', 'a2'])
  })

  it('isIdentifier vérifie la forme attendue', () => {
    expect(isIdentifier(createIdentifier('i1', []))).toBe(true)
    expect(isIdentifier({ id: 'i1', attributeIds: 'a1' })).toBe(false) // attributeIds non-tableau
    expect(isIdentifier(null)).toBe(false)
  })
})

describe('Entity (§5)', () => {
  it('crée une entité vide', () => {
    const e = createEntity('e1', 'CLIENT', { x: 10, y: 20 })
    expect(e.attributes).toEqual([])
    expect(e.identifiers).toEqual([])
    expect(e.position).toEqual({ x: 10, y: 20 })
  })

  it('isEntity valide et rejette', () => {
    expect(isEntity(createEntity('e1'))).toBe(true)
    expect(isEntity({ id: 'e1', name: 'CLIENT', attributes: [], identifiers: [] })).toBe(false) // position absente
    expect(isEntity(null)).toBe(false)
  })

  it('isIdentifierAttribute détecte les attributs identifiants', () => {
    const a1 = createAttribute('a1', 'id_client')
    const a2 = createAttribute('a2', 'nom')
    const entity = createEntity('e1', 'CLIENT')
    entity.attributes = [a1, a2]
    entity.identifiers = [createIdentifier('i1', ['a1'])]

    expect(isIdentifierAttribute(entity, 'a1')).toBe(true)
    expect(isIdentifierAttribute(entity, 'a2')).toBe(false)
    expect(isIdentifierAttribute(entity, 'inconnu')).toBe(false)
  })

  it('getEntityAttributesInIdentifiers renvoie les attributs utilisés par un identifiant', () => {
    const a1 = createAttribute('a1', 'id_client')
    const a2 = createAttribute('a2', 'nom')
    const entity = createEntity('e1', 'CLIENT')
    entity.attributes = [a1, a2]
    entity.identifiers = [createIdentifier('i1', ['a1'])]

    const inIds = getEntityAttributesInIdentifiers(entity)
    expect(inIds.map((a) => a.id)).toEqual(['a1'])
  })
})

describe('Association (§6–§9)', () => {
  it('crée une association avec participants et attributs portés', () => {
    const a = createAssociation('a1', 'INSCRIPTION', [])
    expect(a.attributes).toEqual([])
    expect(a.participants).toEqual([])
  })

  it('isAssociation valide et rejette', () => {
    expect(isAssociation(createAssociation('a1', 'GERER'))).toBe(true)
    expect(isAssociation({ id: 'a1', participants: [], attributes: [] })).toBe(false) // name absent
    expect(isAssociation(null)).toBe(false)
  })

  it('isReflexive détecte une association reliant deux fois la même entité', () => {
    // EMPLOYE ── GERER ── EMPLOYE (manager / subordonné)
    const reflex = createAssociation('a1', 'GERER', [
      { entityId: 'e1', role: 'manager', cardinality: { min: 0, max: 'N' } },
      { entityId: 'e1', role: 'subordonne', cardinality: { min: 0, max: 1 } },
    ])
    expect(isReflexive(reflex)).toBe(true)

    // Association binaire classique entre deux entités ≠ réflexive
    const binary = createAssociation('a2', 'PASSER', [
      { entityId: 'e1', cardinality: { min: 0, max: 'N' } },
      { entityId: 'e2', cardinality: { min: 1, max: 1 } },
    ])
    expect(isReflexive(binary)).toBe(false)
  })

  it('les associations sont binaires dans le MVP (2 participants sauf réflexives)', () => {
    // Le MVP impose participants.length === 2 sauf association réflexive (§6)
    const binary = createAssociation('a1', 'PASSER', [
      { entityId: 'e1', cardinality: { min: 0, max: 'N' } },
      { entityId: 'e2', cardinality: { min: 1, max: 1 } },
    ])
    expect(binary.participants).toHaveLength(2)
  })
})

describe('Project (§40)', () => {
  it('createProject produit un projet vide et versionné', () => {
    const p = createProject('Bibliotheque')
    expect(p.version).toBe(1)
    expect(p.name).toBe('Bibliotheque')
    expect(p.entities).toEqual([])
    expect(p.associations).toEqual([])
    expect(p.inheritances).toEqual([])
    expect(p.constraints).toEqual([])
    expect(p.cifs).toEqual([])
    expect(p.businessRules).toEqual([])
    expect(p.ignoredRules).toEqual([])
    expect(p.ignoredIssueIds).toEqual([])
  })

  it('findEntity / findAssociation résolvent par id', () => {
    const p = createProject()
    const entity = createEntity('e1', 'CLIENT')
    const assoc = createAssociation('a1', 'PASSER')
    p.entities = [entity]
    p.associations = [assoc]

    expect(findEntity(p, 'e1')).toBe(entity)
    expect(findEntity(p, 'inconnu')).toBeUndefined()
    expect(findAssociation(p, 'a1')).toBe(assoc)
    expect(findAssociation(p, 'inconnu')).toBeUndefined()
  })
})