import { describe, expect, it } from 'vitest'
import { createInheritance, createModelConstraint, createFunctionalDependencyConstraint, createBusinessRule, createProject, createEntity } from '@/domain/index'
import { projectToEdges, projectToNodes } from './project-adapter'

describe('Adaptateur des nœuds conceptuels', () => {
  it('projette les quatre concepts en nœuds et arêtes', () => {
    const project = createProject()
    project.entities = [createEntity('e1', 'PARENT', { x: 0, y: 0 }), createEntity('e2', 'ENFANT', { x: 200, y: 0 })]
    project.inheritances = [{ ...createInheritance('inh1', 'SPEC', { x: 80, y: 80 }), parentEntityId: 'e1', childEntityIds: ['e2'] }]
    project.constraints = [{ ...createModelConstraint('cst1', 'EXCL', { x: 40, y: 40 }), targetIds: ['e1'] }]
    project.cifs = [{ ...createFunctionalDependencyConstraint('cif1', 'CIF', { x: 60, y: 20 }), sourceEntityId: 'e1', targetEntityId: 'e2' }]
    project.businessRules = [{ ...createBusinessRule('br1', 'REGLE', { x: 10, y: 10 }), description: 'Doc', targetIds: ['e2'] }]

    const nodes = projectToNodes(project, { viewMode: 'MCD' })
    expect(nodes.map((node) => node.type)).toEqual(expect.arrayContaining(['entity', 'inheritance', 'constraint', 'cif', 'businessRule']))

    const edges = projectToEdges(project, {
      viewMode: 'MCD',
      onOpen: () => {},
      onPick: () => {},
      onClose: () => {},
      openTarget: null,
    })
    expect(edges.some((edge) => edge.type === 'conceptual' && edge.id.startsWith('inh__'))).toBe(true)
    expect(edges.some((edge) => edge.id.startsWith('cif__'))).toBe(true)
    expect(edges.some((edge) => edge.id.startsWith('br__'))).toBe(true)
  })
})
