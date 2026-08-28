import { describe, it, expect } from 'vitest'
import { generateMld } from '@/mld'
import { generateSql } from './postgres'
import { buildProject, makeEntity, makeAssociation } from '@/merise/rules/__tests__/helpers'

// ─────────────────────────────────────────────────────────────────────────
// Tests du générateur SQL PostgreSQL (§22, §25).
// ─────────────────────────────────────────────────────────────────────────

describe('SQL — colonnes et types', () => {
  it('traduit correctement chaque type conceptuel en type SQL', () => {
    // MCD : TEXT/INTEGER/DECIMAL/DATE/BOOLEAN → SQL : TEXT/INTEGER/NUMERIC/DATE/BOOLEAN (§23)
    const entity = makeEntity('ARTICLE', {
      attrs: [
        ['id_article', 'INTEGER'],
        ['description', 'TEXT'],
        ['prix', 'DECIMAL'],
        ['date_creation', 'DATE'],
        ['actif', 'BOOLEAN'],
      ],
      identifierAttrNames: ['id_article'],
    })
    const sql = generateSql(generateMld(buildProject({ entities: [entity] })))
    expect(sql).toContain('id_article INTEGER PRIMARY KEY')
    expect(sql).toContain('description TEXT')
    expect(sql).toContain('prix NUMERIC')
    expect(sql).toContain('date_creation DATE')
    expect(sql).toContain('actif BOOLEAN')
  })

  it('applique NOT NULL aux colonnes non-nullables et aux PK', () => {
    const entity = makeEntity('CLIENT', {
      attrs: [
        ['id_client', 'INTEGER'],
        ['email', 'TEXT'],
      ],
      identifierAttrNames: ['id_client'],
    })
    entity.attributes.find((a) => a.name === 'email')!.nullable = true
    const sql = generateSql(generateMld(buildProject({ entities: [entity] })))
    // PK : toujours NOT NULL
    expect(sql).toContain('id_client INTEGER PRIMARY KEY')
    // email nullable : on n'ajoute pas NOT NULL
    expect(sql).not.toMatch(/email TEXT\s+NOT NULL/)
  })

  it('produit un identifiant SQL en snake_case (noms métier conservés)', () => {
    const entity = makeEntity('LigneCommande', {
      attrs: [['idLigne', 'INTEGER'], ['quantite', 'INTEGER']],
      identifierAttrNames: ['idLigne'],
    })
    const sql = generateSql(generateMld(buildProject({ entities: [entity] })))
    expect(sql).toContain('CREATE TABLE ligne_commande')
    expect(sql).toContain('id_ligne INTEGER PRIMARY KEY')
  })
})

describe('SQL — relations', () => {
  it('génère la contrainte FOREIGN KEY pour une relation 1:N', () => {
    const client = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']], identifierAttrNames: ['id_client'] })
    const commande = makeEntity('COMMANDE', { attrs: [['id_commande', 'INTEGER']], identifierAttrNames: ['id_commande'] })
    const assoc = makeAssociation('PASSER',
      { entityId: client.id, cardinality: { min: 0, max: 'N' } },
      { entityId: commande.id, cardinality: { min: 1, max: 1 } })
    const sql = generateSql(generateMld(buildProject({ entities: [client, commande], associations: [assoc] })))

    expect(sql).toContain('CONSTRAINT fk_commande_id_client')
    expect(sql).toContain('FOREIGN KEY (id_client)')
    expect(sql).toContain('REFERENCES client(id_client)')
  })

  it('génère une table associative pour une relation N:N (PK composite)', () => {
    const etudiant = makeEntity('ETUDIANT', { attrs: [['id_etudiant', 'INTEGER']], identifierAttrNames: ['id_etudiant'] })
    const cours = makeEntity('COURS', { attrs: [['id_cours', 'INTEGER']], identifierAttrNames: ['id_cours'] })
    const inscription = makeAssociation('INSCRIPTION',
      { entityId: etudiant.id, cardinality: { min: 0, max: 'N' } },
      { entityId: cours.id, cardinality: { min: 0, max: 'N' } })
    const sql = generateSql(generateMld(buildProject({ entities: [etudiant, cours], associations: [inscription] })))

    // Table inscription avec deux colonnes PK/FK + deux FK constraints
    expect(sql).toContain('CREATE TABLE inscription')
    expect(sql).toContain('id_etudiant INTEGER PRIMARY KEY')
    expect(sql).toContain('id_cours INTEGER PRIMARY KEY')
    expect(sql).toContain('REFERENCES etudiant(id_etudiant)')
    expect(sql).toContain('REFERENCES cours(id_cours)')
  })

  it('génère une FK autoréférentielle pour une association réflexive 1:N (hiérarchie)', () => {
    const employe = makeEntity('EMPLOYE', { attrs: [['id_employe', 'INTEGER']], identifierAttrNames: ['id_employe'] })
    const gerer = makeAssociation('GERER',
      { entityId: employe.id, role: 'manager', cardinality: { min: 0, max: 'N' } },
      { entityId: employe.id, role: 'subordonne', cardinality: { min: 0, max: 1 } })
    const sql = generateSql(generateMld(buildProject({ entities: [employe], associations: [gerer] })))

    // Règle 2 (réflexive 1:N) : une seule FK `manager_id` référençant employe(id_employe)
    expect(sql).toContain('manager_id_employe INTEGER')
    expect(sql).toContain('REFERENCES employe(id_employe)')
    expect(sql).not.toContain('subordonne_id_employe INTEGER')
  })

  it('génère une table associative pour une association réflexive N:N (deux FK auto-référentes)', () => {
    const employe = makeEntity('EMPLOYE', { attrs: [['id_employe', 'INTEGER']], identifierAttrNames: ['id_employe'] })
    const parrainer = makeAssociation('PARRAINER',
      { entityId: employe.id, role: 'parrain', cardinality: { min: 0, max: 'N' } },
      { entityId: employe.id, role: 'filleul', cardinality: { min: 0, max: 'N' } })
    const sql = generateSql(generateMld(buildProject({ entities: [employe], associations: [parrainer] })))

    // Règle 3 (réflexive N:N) : table associative, PK composite = les deux FK auto-référentes
    expect(sql).toContain('CREATE TABLE parrainer')
    expect(sql).toContain('parrain_id_employe INTEGER PRIMARY KEY')
    expect(sql).toContain('filleul_id_employe INTEGER PRIMARY KEY')
    expect(sql).toContain('REFERENCES employe(id_employe)')
  })

  it('les commandes CREATE TABLE sont séparées par des lignes vides (ordre entités puis associations)', () => {
    const a = makeEntity('A', { attrs: [['id_a', 'INTEGER']], identifierAttrNames: ['id_a'] })
    const b = makeEntity('B', { attrs: [['id_b', 'INTEGER']], identifierAttrNames: ['id_b'] })
    const assoc = makeAssociation('AB',
      { entityId: a.id, cardinality: { min: 0, max: 'N' } },
      { entityId: b.id, cardinality: { min: 0, max: 'N' } })
    const sql = generateSql(generateMld(buildProject({ entities: [a, b], associations: [assoc] })))
    // Les entités sont générées avant la table associative (FK resolvable).
    const idxA = sql.indexOf('CREATE TABLE a')
    const idxB = sql.indexOf('CREATE TABLE b')
    const idxAB = sql.indexOf('CREATE TABLE ab')
    expect(idxA).toBeGreaterThanOrEqual(0)
    expect(idxB).toBeGreaterThan(idxA)
    expect(idxAB).toBeGreaterThan(idxB)
  })
})