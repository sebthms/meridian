import { describe, it, expect } from 'vitest'
import { createProject } from '@/domain'
import { validateProject } from './validator'
import { buildProject, makeEntity } from './rules/__tests__/helpers'

describe('MERISE structural validation', () => {
  it('accepts a valid entity', () => {
    const project = buildProject({
      entities: [
        makeEntity('CLIENT', {
          attrs: [['id_client', 'INTEGER'], ['nom', 'TEXT']],
          identifierAttrNames: ['id_client'],
        }),
      ],
    })
    const { errors, warnings } = validateProject(project)
    expect(errors).toHaveLength(0)
    expect(warnings).toHaveLength(0)
  })

  it('MERISE-E001: entity without name', () => {
    const project = buildProject({ entities: [makeEntity('')] })
    const { errors } = validateProject(project)
    expect(errors.some((e) => e.ruleId === 'MERISE-E001')).toBe(true)
  })

  it('MERISE-E002: entity without identifier', () => {
    const project = buildProject({
      entities: [makeEntity('CLIENT', { attrs: [['nom', 'TEXT']] })],
    })
    const { errors } = validateProject(project)
    expect(errors.some((e) => e.ruleId === 'MERISE-E002')).toBe(true)
  })

  it('MERISE-E003: attribute without name', () => {
    const entity = makeEntity('CLIENT', { attrs: [['id_client', 'INTEGER']] })
    entity.attributes[0].name = ''
    const project = buildProject({ entities: [entity] })
    const { errors } = validateProject(project)
    expect(errors.some((e) => e.ruleId === 'MERISE-E003')).toBe(true)
  })

  it('MERISE-E004: duplicate attribute', () => {
    const entity = makeEntity('CLIENT', {
      attrs: [['id_client', 'INTEGER'], ['nom', 'TEXT'], ['nom', 'TEXT']],
    })
    const project = buildProject({ entities: [entity] })
    const { errors } = validateProject(project)
    expect(errors.some((e) => e.ruleId === 'MERISE-E004')).toBe(true)
  })

  it('MERISE-E005: identifier references missing attribute', () => {
    const entity = makeEntity('CLIENT', {
      attrs: [['nom', 'TEXT']],
      identifierAttrNames: ['id_client'],
    })
    const project = buildProject({ entities: [entity] })
    const { errors } = validateProject(project)
    expect(errors.some((e) => e.ruleId === 'MERISE-E005')).toBe(true)
  })

  it('MERISE-W001: suspicious name', () => {
    const project = buildProject({ entities: [makeEntity('entite1')] })
    const { warnings } = validateProject(project)
    expect(warnings.some((w) => w.ruleId === 'MERISE-W001')).toBe(true)
  })

  it('MERISE-W002: non-atomic attribute', () => {
    const project = buildProject({
      entities: [
        makeEntity('CLIENT', {
          attrs: [['id_client', 'INTEGER'], ['adresse, ville', 'TEXT']],
          identifierAttrNames: ['id_client'],
        }),
      ],
    })
    const { warnings } = validateProject(project)
    expect(warnings.some((w) => w.ruleId === 'MERISE-W002')).toBe(true)
  })

  it('MERISE-W003: repeated structure', () => {
    const project = buildProject({
      entities: [
        makeEntity('CLIENT', {
          attrs: [['id_client', 'INTEGER'], ['telephone_1', 'TEXT'], ['telephone_2', 'TEXT']],
          identifierAttrNames: ['id_client'],
        }),
      ],
    })
    const { warnings } = validateProject(project)
    expect(warnings.some((w) => w.ruleId === 'MERISE-W003')).toBe(true)
  })

  it('MERISE-W004: suspicious functional dependency', () => {
    const project = buildProject({
      entities: [
        makeEntity('COMMANDE', {
          attrs: [
            ['id_commande', 'INTEGER'],
            ['id_client', 'INTEGER'],
            ['nom_client', 'TEXT'],
          ],
          identifierAttrNames: ['id_commande'],
        }),
      ],
    })
    const { warnings } = validateProject(project)
    expect(warnings.some((w) => w.ruleId === 'MERISE-W004')).toBe(true)
  })

  it('ignores a rule when listed in ignoredRules', () => {
    const project = buildProject({
      entities: [makeEntity('CLIENT', { attrs: [['nom', 'TEXT']] })],
      ignoredRules: ['MERISE-E002'],
    })
    const { errors } = validateProject(project)
    expect(errors.some((e) => e.ruleId === 'MERISE-E002')).toBe(false)
  })

  it('ignores a specific issue occurrence', () => {
    const entity = makeEntity('CLIENT', { attrs: [['nom', 'TEXT']], id: 'cli' })
    const project = buildProject({ entities: [entity] })
    const issueId = `MERISE-E002:${entity.id}`
    project.ignoredIssueIds = [issueId]
    const { errors } = validateProject(project)
    expect(errors.some((e) => e.ruleId === 'MERISE-E002')).toBe(false)
  })

  it('createProject produces an empty valid project', () => {
    const { errors } = validateProject(createProject())
    expect(errors).toHaveLength(0)
  })
})