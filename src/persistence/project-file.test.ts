import { describe, it, expect } from 'vitest'
import type { Project } from '@/domain'
import { exportProject, parseProject, emptyProject } from './project-file'
import { newProject } from './local-storage'

// ─────────────────────────────────────────────────────────────────────────
// Tests de persistance (§40–§42) : l'import/export .merise.json doit être
// un aller-retour fidèle (model + positions + associations + règles ignorées).
// NB : on teste les fonctions pures ; downloadProject/downloadText utilisent
// l'API DOM (blob) et sont couverts manuellement dans l'UI.
// ─────────────────────────────────────────────────────────────────────────

function sampleProject(): Project {
  return {
    version: 1,
    name: 'Bibliotheque',
    entities: [
      {
        id: 'e1',
        name: 'LIVRE',
        attributes: [
          { id: 'a1', name: 'id_livre', conceptualType: 'INTEGER', nullable: false },
          { id: 'a2', name: 'titre', conceptualType: 'TEXT', nullable: false },
        ],
        identifiers: [{ id: 'i1', attributeIds: ['a1'] }],
        position: { x: 500, y: 300 },
      },
      {
        id: 'e2',
        name: 'ADHERENT',
        attributes: [{ id: 'a3', name: 'id_adherent', conceptualType: 'INTEGER', nullable: false }],
        identifiers: [{ id: 'i2', attributeIds: ['a3'] }],
        position: { x: 800, y: 300 },
      },
    ],
    associations: [
      {
        id: 'as1',
        name: 'EMPRUNTER',
        participants: [
          { entityId: 'e1', cardinality: { min: 0, max: 'N' } },
          { entityId: 'e2', cardinality: { min: 1, max: 1 } },
        ],
        attributes: [],
      },
    ],
    ignoredRules: ['MERISE-W001'],
    ignoredIssueIds: ['MERISE-E002:e1'],
  }
}

describe('Persistance .merise.json', () => {
  it('exportProject → parseProject est un aller-retour fidèle', () => {
    const original = sampleProject()
    const json = exportProject(original)
    const roundTripped = parseProject(json)

    expect(roundTripped.version).toBe(1)
    expect(roundTripped.name).toBe('Bibliotheque')
    // entités : noms, attributs, identifiants, positions
    expect(roundTripped.entities).toEqual(original.entities)
    // associations : participants + cardinalités
    expect(roundTripped.associations).toEqual(original.associations)
    // règles ignorées conservées (Cas 5 du §46)
    expect(roundTripped.ignoredRules).toEqual(['MERISE-W001'])
    expect(roundTripped.ignoredIssueIds).toEqual(['MERISE-E002:e1'])
  })

  it('parseProject rejette un fichier non-MERISE (version ou forme invalide)', () => {
    expect(() => parseProject('{ "version": 2 }')).toThrow()
    expect(() => parseProject('{ "entities": [], "associations": [] }')).toThrow() // version manquante
    expect(() => parseProject('pas du json')).toThrow()
  })

  it('valide profondément les propriétés et positions', () => {
    const base = {
      version: 1,
      entities: [{ id: 'e1', name: 'CLIENT', attributes: [{ id: 'a1', name: 'id', conceptualType: 'INTEGER' }], identifiers: [{ id: 'i1', attributeIds: ['a1'] }], position: { x: 0, y: 0 } }],
      associations: [],
    }
    expect(() => parseProject(JSON.stringify({ ...base, entities: [{ ...base.entities[0], position: { x: '0', y: 0 } }] }))).toThrow(/coordonnées/)
    expect(() => parseProject(JSON.stringify({ ...base, entities: [{ ...base.entities[0], attributes: [{ id: 'a1', name: 'id', conceptualType: 'VARCHAR' }] }] }))).toThrow(/type conceptuel/)
    expect(() => parseProject(JSON.stringify({ ...base, entities: [{ ...base.entities[0], identifiers: [{ id: 'i1', attributeIds: ['missing'] }] }] }))).toThrow(/référence/)
  })

  it('rejette les références orphelines et cardinalités absentes', () => {
    const entity = { id: 'e1', name: 'CLIENT', attributes: [{ id: 'a1', name: 'id', conceptualType: 'INTEGER' }], identifiers: [{ id: 'i1', attributeIds: ['a1'] }], position: { x: 0, y: 0 } }
    const association = { id: 'as1', name: 'PASSER', participants: [{ entityId: 'missing', cardinality: { min: 0, max: 'N' } }, { entityId: 'e1' }], attributes: [] }
    expect(() => parseProject(JSON.stringify({ version: 1, entities: [entity], associations: [association] }))).toThrow()
  })

  it('migre une version historique compatible vers la version courante', () => {
    const migrated = parseProject(JSON.stringify({ version: 0, entities: [], associations: [] }))
    expect(migrated.version).toBe(1)
  })

  it('parseProject remplit les valeurs manquantes avec des défauts sûrs', () => {
    const minimal = JSON.stringify({
      version: 1,
      name: 'Importé',
      entities: [],
      associations: [],
    })
    const p = parseProject(minimal)
    expect(p.ignoredRules).toEqual([])
    expect(p.ignoredIssueIds).toEqual([])
    expect(p.name).toBe('Importé')
  })

  it('emptyProject / newProject créent un projet vierge', () => {
    expect(emptyProject().entities).toEqual([])
    expect(newProject().version).toBe(1)
  })
})
