import { describe, expect, it } from 'vitest'
import { createProject, type Project } from '@/domain'
import { exportProject, parseProject } from './project-file'
import { createEntityCommand, createInheritanceCommand, setInheritanceParent, addInheritanceChild } from '@/editor'

describe('Persistance des concepts MERISE', () => {
  it('conserve héritage, contrainte, CIF et règle métier', () => {
    const original: Project = {
      ...createProject('Concepts'),
      entities: [
        { id: 'e1', name: 'PERSONNE', attributes: [{ id: 'a1', name: 'id', conceptualType: 'INTEGER', nullable: false }], identifiers: [{ id: 'i1', attributeIds: ['a1'] }], position: { x: 0, y: 0 } },
        { id: 'e2', name: 'CLIENT', attributes: [{ id: 'a2', name: 'id', conceptualType: 'INTEGER', nullable: false }], identifiers: [{ id: 'i2', attributeIds: ['a2'] }], position: { x: 200, y: 0 } },
      ],
      associations: [
        { id: 'as1', name: 'EST', participants: [{ entityId: 'e2', cardinality: { min: 0, max: 'N' } }, { entityId: 'e1', cardinality: { min: 1, max: 1 } }], attributes: [] },
      ],
      inheritances: [{ id: 'inh1', name: 'SPEC', parentEntityId: 'e1', childEntityIds: ['e2'], coverage: 'total', exclusivity: 'exclusive', position: { x: 80, y: 120 } }],
      constraints: [{ id: 'cst1', name: 'EXCL', description: 'Exclusion', kind: 'exclusion', targetIds: ['as1'], position: { x: 40, y: 80 } }],
      cifs: [{ id: 'cif1', name: 'CIF', sourceEntityId: 'e2', targetEntityId: 'e1', description: 'Client détermine personne', associationId: 'as1', position: { x: 60, y: 40 } }],
      businessRules: [{ id: 'br1', name: 'EMAIL', description: 'Email unique', level: 'error', targetIds: ['e2'], position: { x: 10, y: 10 } }],
    }
    const restored = parseProject(exportProject(original))
    expect(restored.inheritances).toEqual(original.inheritances)
    expect(restored.constraints).toEqual(original.constraints)
    expect(restored.cifs).toEqual(original.cifs)
    expect(restored.businessRules).toEqual(original.businessRules)
  })

  it('accepte un ancien fichier sans collections conceptuelles', () => {
    const restored = parseProject(JSON.stringify({ version: 1, name: 'Ancien', entities: [], associations: [] }))
    expect(restored.inheritances).toEqual([])
    expect(restored.constraints).toEqual([])
    expect(restored.cifs).toEqual([])
    expect(restored.businessRules).toEqual([])
  })

  it('rejette des références dupliquées dans le fichier', () => {
    const base = {
      version: 1,
      entities: [{ id: 'e1', name: 'CLIENT', attributes: [{ id: 'a1', name: 'id', conceptualType: 'INTEGER' }], identifiers: [{ id: 'i1', attributeIds: ['a1'] }], position: { x: 0, y: 0 } }],
      associations: [],
    }
    expect(() => parseProject(JSON.stringify({
      ...base,
      inheritances: [{ id: 'inh1', name: 'SPEC', parentEntityId: 'e1', childEntityIds: ['e1', 'e1'], coverage: 'total', exclusivity: 'exclusive', position: { x: 0, y: 0 } }],
    }))).toThrow(/dupliquées/)
  })

  it('restaure un héritage créé par les commandes', () => {
    let project = createProject()
    project = createEntityCommand(project)
    project = createEntityCommand(project)
    project = createInheritanceCommand(project)
    project = setInheritanceParent(project, project.inheritances[0].id, project.entities[0].id)
    project = addInheritanceChild(project, project.inheritances[0].id, project.entities[1].id)
    const restored = parseProject(exportProject(project))
    expect(restored.inheritances[0].parentEntityId).toBe(project.entities[0].id)
    expect(restored.inheritances[0].childEntityIds).toEqual([project.entities[1].id])
  })
})
