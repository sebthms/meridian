import { describe, expect, it } from 'vitest'
import { createProject } from '@/domain'
import {
  createAssociationBetween,
  createBusinessRuleCommand,
  createCifCommand,
  createConstraintCommand,
  createEntityCommand,
  createInheritanceCommand,
  renameEntity,
  setInheritanceParent,
  addInheritanceChild,
} from '@/editor'
import { applyConceptualSave, type ConceptualSaveInput } from './conceptual-form'

function projectWithEntities() {
  let project = createProject()
  project = createEntityCommand(project)
  project = createEntityCommand(project)
  project = renameEntity(project, project.entities[0].id, 'PARENT')
  project = renameEntity(project, project.entities[1].id, 'ENFANT')
  return project
}

function baseInput(project: ReturnType<typeof createProject>, overrides: Partial<ConceptualSaveInput> = {}): ConceptualSaveInput {
  return {
    project,
    target: { kind: 'inheritance', id: project.inheritances[0]?.id ?? '' },
    name: 'HERITAGE',
    description: '',
    parentEntityId: '',
    childEntityIds: [],
    coverage: 'total',
    exclusivity: 'exclusive',
    kind: 'exclusion',
    targetIds: [],
    sourceEntityId: '',
    targetEntityId: '',
    associationId: '',
    level: 'info',
    ...overrides,
  }
}

describe('Formulaire conceptuel', () => {
  it('refuse un nom vide ou invalide', () => {
    let project = projectWithEntities()
    project = createInheritanceCommand(project)
    expect(applyConceptualSave(baseInput(project, { name: '   ' }))).toEqual({ ok: false, error: 'Le nom est obligatoire.' })
    const invalid = applyConceptualSave(baseInput(project, { name: 'Héritage 1' }))
    expect(invalid.ok).toBe(false)
    if (!invalid.ok) expect(invalid.error).toMatch(/nom/i)
  })

  it('retire le parent des enfants et conserve couverture et exclusivité', () => {
    let project = projectWithEntities()
    const [parent, child] = project.entities
    project = createInheritanceCommand(project)
    project = setInheritanceParent(project, project.inheritances[0].id, parent.id)
    project = addInheritanceChild(project, project.inheritances[0].id, child.id)
    const saved = applyConceptualSave(baseInput(project, {
      name: 'SPECIALISATION',
      parentEntityId: parent.id,
      childEntityIds: [parent.id, child.id],
      coverage: 'partial',
      exclusivity: 'overlapping',
    }))
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.project.inheritances[0]).toMatchObject({
      name: 'SPECIALISATION',
      parentEntityId: parent.id,
      childEntityIds: [child.id],
      coverage: 'partial',
      exclusivity: 'overlapping',
    })
  })

  it('exige une description pour une règle métier', () => {
    let project = projectWithEntities()
    project = createBusinessRuleCommand(project)
    expect(applyConceptualSave(baseInput(project, {
      target: { kind: 'businessRule', id: project.businessRules[0].id },
      name: 'REGLE',
      description: '   ',
    }))).toEqual({ ok: false, error: 'La description est obligatoire.' })
    const saved = applyConceptualSave(baseInput(project, {
      target: { kind: 'businessRule', id: project.businessRules[0].id },
      name: 'REGLE',
      description: '  Toujours unique  ',
      level: 'error',
      targetIds: [project.entities[0].id],
    }))
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.project.businessRules[0]).toMatchObject({
      description: 'Toujours unique',
      level: 'error',
      targetIds: [project.entities[0].id],
    })
  })

  it('déduit l’association fonctionnelle d’une CIF si aucune n’est choisie', () => {
    let project = projectWithEntities()
    const [source, target] = project.entities
    project = createAssociationBetween(project, source.id, target.id, '1:N')
    project = createCifCommand(project)
    const saved = applyConceptualSave(baseInput(project, {
      target: { kind: 'cif', id: project.cifs[0].id },
      name: 'DEPEND',
      description: '  source vers cible  ',
      sourceEntityId: source.id,
      targetEntityId: target.id,
      associationId: '',
    }))
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.project.cifs[0].associationId).toBe(project.associations[0].id)
    expect(saved.project.cifs[0].description).toBe('source vers cible')
  })

  it('signale un doublon de nom du même type', () => {
    let project = projectWithEntities()
    project = createConstraintCommand(project)
    project = createConstraintCommand(project)
    const duplicate = applyConceptualSave(baseInput(project, {
      target: { kind: 'constraint', id: project.constraints[1].id },
      name: project.constraints[0].name,
      kind: 'partition',
      targetIds: [project.entities[0].id],
    }))
    expect(duplicate).toEqual({ ok: false, error: 'Un objet du même type porte déjà ce nom.' })
  })

  it('enregistre une contrainte sans changer le nom même si le projet est inchangé par ailleurs', () => {
    let project = projectWithEntities()
    project = createConstraintCommand(project)
    const current = project.constraints[0]
    const saved = applyConceptualSave(baseInput(project, {
      target: { kind: 'constraint', id: current.id },
      name: current.name,
      description: current.description,
      kind: current.kind,
      targetIds: current.targetIds,
    }))
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.project.constraints[0].name).toBe(current.name)
  })
})
