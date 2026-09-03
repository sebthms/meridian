import { describe, expect, it } from 'vitest'
import {
  createBusinessRule,
  createFunctionalDependencyConstraint,
  createInheritance,
  createModelConstraint,
  createProject,
  findFunctionalAssociation,
  inheritanceMark,
  isBusinessRule,
  isFunctionalDependencyConstraint,
  isInheritance,
  isModelConstraint,
  normalizeProject,
  projectElementLabel,
} from '@/domain'
import { makeAssociation, makeEntity } from '@/test-support/project-fixtures'

describe('Héritage', () => {
  it('crée un héritage total exclusif vide', () => {
    const inheritance = createInheritance('inh1', 'HERITAGE', { x: 10, y: 20 })
    expect(inheritance.coverage).toBe('total')
    expect(inheritance.exclusivity).toBe('exclusive')
    expect(inheritance.childEntityIds).toEqual([])
    expect(isInheritance(inheritance)).toBe(true)
    expect(inheritanceMark(inheritance)).toBe('TX')
  })

  it('isInheritance rejette une forme invalide', () => {
    expect(isInheritance({ id: 'inh1', name: 'X' })).toBe(false)
    expect(isInheritance(null)).toBe(false)
  })
})

describe('Contrainte', () => {
  it('crée une contrainte d’exclusion', () => {
    const constraint = createModelConstraint('c1')
    expect(constraint.kind).toBe('exclusion')
    expect(isModelConstraint(constraint)).toBe(true)
  })
})

describe('CIF', () => {
  it('crée une CIF sans inventer de lien', () => {
    const cif = createFunctionalDependencyConstraint('cif1')
    expect(cif.sourceEntityId).toBe('')
    expect(cif.associationId).toBeUndefined()
    expect(isFunctionalDependencyConstraint(cif)).toBe(true)
  })

  it('findFunctionalAssociation exige une association existante avec max cible = 1', () => {
    const source = makeEntity('COMMANDE', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const target = makeEntity('CLIENT', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const association = makeAssociation(
      'PASSER',
      { entityId: source.id, cardinality: { min: 0, max: 'N' } },
      { entityId: target.id, cardinality: { min: 1, max: 1 } },
    )
    const project = { associations: [association] }
    expect(findFunctionalAssociation(project, source.id, target.id)?.id).toBe(association.id)
    expect(findFunctionalAssociation(project, target.id, source.id)).toBeUndefined()
    expect(findFunctionalAssociation({ associations: [] }, source.id, target.id)).toBeUndefined()
  })
})

describe('Règle métier', () => {
  it('crée une règle de niveau information', () => {
    const rule = createBusinessRule('br1', 'REGLE')
    expect(rule.level).toBe('info')
    expect(isBusinessRule(rule)).toBe(true)
  })
})

describe('normalizeProject', () => {
  it('complète les collections conceptuelles absentes', () => {
    const project = normalizeProject({ ...createProject(), inheritances: undefined as never })
    expect(project.inheritances).toEqual([])
    expect(projectElementLabel(project, 'inconnu')).toBe('inconnu')
  })
})
