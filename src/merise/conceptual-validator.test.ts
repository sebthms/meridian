import { describe, expect, it } from 'vitest'
import { createInheritance, createFunctionalDependencyConstraint, createBusinessRule, createModelConstraint } from '@/domain'
import { validateProject } from './validator'
import { buildProject, makeAssociation, makeEntity } from '@/test-support/project-fixtures'

function twoEntities() {
  return [
    makeEntity('PERSONNE', { id: 'e_parent', attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] }),
    makeEntity('CLIENT', { id: 'e_child', attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] }),
  ]
}

describe('Validation des concepts MERISE', () => {
  it('signale un héritage sans parent ni enfant', () => {
    const project = buildProject({
      entities: twoEntities(),
      inheritances: [createInheritance('inh1')],
    })
    const { errors } = validateProject(project)
    expect(errors.some((issue) => issue.ruleId === 'MERISE-E020')).toBe(true)
    expect(errors.some((issue) => issue.ruleId === 'MERISE-E021')).toBe(true)
  })

  it('détecte un cycle d’héritage', () => {
    const [a, b] = twoEntities()
    const project = buildProject({
      entities: [a, b],
      inheritances: [
        { ...createInheritance('inh1'), parentEntityId: a.id, childEntityIds: [b.id] },
        { ...createInheritance('inh2'), parentEntityId: b.id, childEntityIds: [a.id] },
      ],
    })
    const { errors } = validateProject(project)
    expect(errors.some((issue) => issue.ruleId === 'MERISE-E022')).toBe(true)
  })

  it('accepte un héritage acyclique valide', () => {
    const [a, b] = twoEntities()
    const project = buildProject({
      entities: [a, b],
      inheritances: [{ ...createInheritance('inh1', 'SPEC'), parentEntityId: a.id, childEntityIds: [b.id] }],
    })
    expect(validateProject(project).errors.some((issue) => issue.ruleId.startsWith('MERISE-E02'))).toBe(false)
  })

  it('signale une contrainte avec référence absente ou dupliquée', () => {
    const [a] = twoEntities()
    const project = buildProject({
      entities: [a],
      constraints: [{ ...createModelConstraint('cst1', 'X'), targetIds: [a.id, a.id, 'missing'] }],
    })
    const { errors } = validateProject(project)
    expect(errors.some((issue) => issue.ruleId === 'MERISE-E023')).toBe(true)
  })

  it('refuse une CIF entre la même entité ou sans lien fonctionnel', () => {
    const [a, b] = twoEntities()
    const same = buildProject({
      entities: [a, b],
      cifs: [{ ...createFunctionalDependencyConstraint('cif1', 'CIF'), sourceEntityId: a.id, targetEntityId: a.id }],
    })
    expect(validateProject(same).errors.some((issue) => issue.ruleId === 'MERISE-E025')).toBe(true)

    const unlinked = buildProject({
      entities: [a, b],
      cifs: [{ ...createFunctionalDependencyConstraint('cif2', 'CIF'), sourceEntityId: a.id, targetEntityId: b.id }],
    })
    expect(validateProject(unlinked).errors.some((issue) => issue.ruleId === 'MERISE-E026')).toBe(true)
  })

  it('accepte une CIF portée par une association 1:N existante', () => {
    const [a, b] = twoEntities()
    const association = makeAssociation(
      'EST',
      { entityId: b.id, cardinality: { min: 0, max: 'N' } },
      { entityId: a.id, cardinality: { min: 1, max: 1 } },
    )
    const project = buildProject({
      entities: [a, b],
      associations: [association],
      cifs: [{
        ...createFunctionalDependencyConstraint('cif1', 'CIF'),
        sourceEntityId: b.id,
        targetEntityId: a.id,
        associationId: association.id,
      }],
    })
    expect(validateProject(project).errors.some((issue) => issue.ruleId === 'MERISE-E025' || issue.ruleId === 'MERISE-E026')).toBe(false)
  })

  it('refuse d’inventer une CIF à partir des seuls noms', () => {
    const source = makeEntity('COMMANDE', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const target = makeEntity('CLIENT', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const project = buildProject({
      entities: [source, target],
      cifs: [{
        ...createFunctionalDependencyConstraint('cif1', 'CIF'),
        sourceEntityId: source.id,
        targetEntityId: target.id,
      }],
    })
    expect(validateProject(project).errors.some((issue) => issue.ruleId === 'MERISE-E026')).toBe(true)
  })

  it('exige nom et description pour une règle métier, puis l’affiche dans les issues', () => {
    const [a] = twoEntities()
    const incomplete = buildProject({
      entities: [a],
      businessRules: [createBusinessRule('br1', '')],
    })
    expect(validateProject(incomplete).errors.some((issue) => issue.ruleId === 'MERISE-E027')).toBe(true)

    const complete = buildProject({
      entities: [a],
      businessRules: [{ ...createBusinessRule('br2', 'EMAIL_UNIQUE'), description: 'Chaque client a un email.', level: 'warning', targetIds: [a.id] }],
    })
    const result = validateProject(complete)
    expect(result.errors.some((issue) => issue.ruleId === 'MERISE-E027')).toBe(false)
    expect(result.warnings.some((issue) => issue.ruleId === 'MERISE-BR001' && issue.title === 'EMAIL_UNIQUE')).toBe(true)
  })

  it('ne régresse pas sur une entité et une association valides', () => {
    const [a, b] = twoEntities()
    const project = buildProject({
      entities: [a, b],
      associations: [makeAssociation('LIEN', { entityId: a.id, cardinality: { min: 0, max: 'N' } }, { entityId: b.id, cardinality: { min: 1, max: 1 } })],
    })
    expect(validateProject(project).errors).toEqual([])
  })
})
