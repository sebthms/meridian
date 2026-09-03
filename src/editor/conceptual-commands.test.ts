import { describe, expect, it } from 'vitest'
import { createProject } from '@/domain'
import {
  addAttributeWithName,
  createAssociationBetween,
  createBusinessRuleCommand,
  createCifCommand,
  createConstraintCommand,
  createEntityCommand,
  createInheritanceCommand,
  deleteBusinessRule,
  deleteCif,
  deleteConstraint,
  deleteEntity,
  deleteInheritance,
  renameEntity,
  setCifSource,
  setCifTarget,
  setInheritanceParent,
  addInheritanceChild,
  addConstraintTarget,
  addBusinessRuleTarget,
  updateBusinessRule,
  updateCif,
  updateConstraint,
  updateInheritance,
} from './index'

function projectWithEntities() {
  let project = createProject()
  project = createEntityCommand(project)
  project = createEntityCommand(project)
  project = renameEntity(project, project.entities[0].id, 'PARENT')
  project = renameEntity(project, project.entities[1].id, 'ENFANT')
  return project
}

describe('Commandes conceptuelles', () => {
  it('crée, modifie et supprime un héritage', () => {
    let project = projectWithEntities()
    const [parent, child] = project.entities
    project = createInheritanceCommand(project)
    expect(project.inheritances).toHaveLength(1)
    const inheritanceId = project.inheritances[0].id
    project = setInheritanceParent(project, inheritanceId, parent.id)
    project = addInheritanceChild(project, inheritanceId, child.id)
    project = updateInheritance(project, inheritanceId, { coverage: 'partial', exclusivity: 'overlapping' })
    expect(project.inheritances[0]).toMatchObject({
      parentEntityId: parent.id,
      childEntityIds: [child.id],
      coverage: 'partial',
      exclusivity: 'overlapping',
    })
    project = deleteInheritance(project, inheritanceId)
    expect(project.inheritances).toHaveLength(0)
    expect(project.entities).toHaveLength(2)
  })

  it('refuse un enfant déjà parent et un nom invalide', () => {
    let project = projectWithEntities()
    project = createInheritanceCommand(project)
    const inheritance = project.inheritances[0]
    const original = project
    expect(updateInheritance(project, inheritance.id, { name: 'Héritage 1' })).toBe(original)
    project = setInheritanceParent(project, inheritance.id, project.entities[0].id)
    expect(addInheritanceChild(project, inheritance.id, project.entities[0].id)).toBe(project)
  })

  it('crée, modifie et supprime une contrainte', () => {
    let project = projectWithEntities()
    project = createConstraintCommand(project)
    const constraintId = project.constraints[0].id
    project = addConstraintTarget(project, constraintId, project.entities[0].id)
    project = updateConstraint(project, constraintId, { kind: 'partition', description: 'Partition exclusive' })
    expect(project.constraints[0].targetIds).toEqual([project.entities[0].id])
    expect(project.constraints[0].kind).toBe('partition')
    project = deleteConstraint(project, constraintId)
    expect(project.constraints).toHaveLength(0)
  })

  it('crée, relie et supprime une CIF', () => {
    let project = projectWithEntities()
    project = createCifCommand(project)
    const cifId = project.cifs[0].id
    project = setCifSource(project, cifId, project.entities[0].id)
    project = setCifTarget(project, cifId, project.entities[1].id)
    project = updateCif(project, cifId, { description: 'Dépendance métier' })
    expect(project.cifs[0].sourceEntityId).toBe(project.entities[0].id)
    expect(project.cifs[0].targetEntityId).toBe(project.entities[1].id)
    project = deleteCif(project, cifId)
    expect(project.cifs).toHaveLength(0)
  })

  it('refuse une CIF dont la source et la cible sont identiques', () => {
    let project = projectWithEntities()
    project = createCifCommand(project)
    const cifId = project.cifs[0].id
    project = setCifSource(project, cifId, project.entities[0].id)
    expect(setCifTarget(project, cifId, project.entities[0].id)).toBe(project)
  })

  it('crée, documente et supprime une règle métier', () => {
    let project = projectWithEntities()
    project = createBusinessRuleCommand(project)
    const ruleId = project.businessRules[0].id
    project = addBusinessRuleTarget(project, ruleId, project.entities[0].id)
    project = updateBusinessRule(project, ruleId, { description: 'Un client a un email unique.', level: 'warning' })
    expect(project.businessRules[0].level).toBe('warning')
    expect(project.businessRules[0].description).toContain('email')
    project = deleteBusinessRule(project, ruleId)
    expect(project.businessRules).toHaveLength(0)
  })

  it('nettoie les références quand une entité est supprimée', () => {
    let project = projectWithEntities()
    const [parent, child] = project.entities
    project = createAssociationBetween(project, parent.id, child.id, '1:N')
    project = createInheritanceCommand(project)
    project = setInheritanceParent(project, project.inheritances[0].id, parent.id)
    project = addInheritanceChild(project, project.inheritances[0].id, child.id)
    project = createConstraintCommand(project)
    project = addConstraintTarget(project, project.constraints[0].id, parent.id)
    project = createCifCommand(project)
    project = setCifSource(project, project.cifs[0].id, parent.id)
    project = setCifTarget(project, project.cifs[0].id, child.id)
    project = createBusinessRuleCommand(project)
    project = addBusinessRuleTarget(project, project.businessRules[0].id, parent.id)
    project = deleteEntity(project, parent.id)
    expect(project.entities.map((entity) => entity.id)).toEqual([child.id])
    expect(project.associations).toHaveLength(0)
    expect(project.inheritances).toHaveLength(0)
    expect(project.constraints[0].targetIds).toEqual([])
    expect(project.cifs).toHaveLength(0)
    expect(project.businessRules[0].targetIds).toEqual([])
  })

  it('ne casse pas les propriétés et identifiants existants', () => {
    let project = projectWithEntities()
    const entityId = project.entities[0].id
    const { project: withAttr, attributeId } = addAttributeWithName(project, entityId, 'nom', 'TEXT')
    project = withAttr
    project = createInheritanceCommand(project)
    expect(project.entities[0].attributes.some((attribute) => attribute.id === attributeId)).toBe(true)
    expect(project.entities[0].identifiers[0].attributeIds).toHaveLength(1)
  })
})
