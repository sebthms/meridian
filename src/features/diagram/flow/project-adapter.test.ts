import { describe, expect, it } from 'vitest'
import { createAssociation, createEntity, createProject, type Project } from '@/domain/index'
import { projectToEdges, projectToNodes } from './project-adapter'

const mldOptions = {
  viewMode: 'MLD' as const,
  onOpen: () => {},
  onPick: () => {},
  onClose: () => {},
  openTarget: null,
}

const mcdOptions = { ...mldOptions, viewMode: 'MCD' as const }

function projectWithAssociation(maxA: 1 | 'N', maxB: 1 | 'N'): Project {
  const project = createProject()
  project.entities = [createEntity('entity-a', 'A'), createEntity('entity-b', 'B')]
  project.associations = [
    createAssociation('association', 'RELATION', [
      { entityId: 'entity-a', cardinality: { min: 0, max: maxA } },
      { entityId: 'entity-b', cardinality: { min: 1, max: maxB } },
    ]),
  ]
  return project
}

describe('projectToEdges MLD handles', () => {
  it('relie une association N:N avec les handles réellement exposés', () => {
    const edges = projectToEdges(projectWithAssociation('N', 'N'), mldOptions)

    expect(edges).toHaveLength(2)
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceHandle: 'right', targetHandle: 'target' }),
      ]),
    )
  })

  it('relie directement les entités d’une association 1:N', () => {
    const [edge] = projectToEdges(projectWithAssociation('N', 1), mldOptions)

    expect(edge).toMatchObject({ sourceHandle: 'source', targetHandle: 'target' })
  })

  it('utilise deux handles distincts pour une association réflexive', () => {
    const project = createProject()
    project.entities = [createEntity('entity', 'ENTITY')]
    project.associations = [
      createAssociation('association', 'PARENT', [
        { entityId: 'entity', cardinality: { min: 0, max: 'N' } },
        { entityId: 'entity', cardinality: { min: 0, max: 1 } },
      ]),
    ]

    const [edge] = projectToEdges(project, mldOptions)

    expect(edge).toMatchObject({ sourceHandle: 'right', targetHandle: 'bottom' })
  })

  it('conserve la table et deux FK pour une réflexive N:N', () => {
    const project = createProject()
    project.entities = [createEntity('entity', 'ENTITY')]
    project.associations = [
      createAssociation('association', 'RELATION', [
        { entityId: 'entity', cardinality: { min: 0, max: 'N' } },
        { entityId: 'entity', cardinality: { min: 0, max: 'N' } },
      ]),
    ]

    const edges = projectToEdges(project, mldOptions)
    const nodes = projectToNodes(project, { viewMode: 'MLD' })

    expect(nodes.some((node) => node.id === 'association')).toBe(true)
    expect(edges).toHaveLength(2)
    expect(edges[0]).toMatchObject({
      source: 'association',
      target: 'entity',
      sourceHandle: 'reflexive-source-0',
      targetHandle: 'reflexive-target-0',
    })
    expect(edges[1]).toMatchObject({
      source: 'association',
      target: 'entity',
      sourceHandle: 'reflexive-source-1',
      targetHandle: 'reflexive-target-1',
    })
  })

  it('masque la pastille lorsqu’aucune table associative n’est générée', () => {
    const project = createProject()
    project.entities = [createEntity('entity', 'ENTITY')]
    project.associations = [
      createAssociation('association', 'PARENT', [
        { entityId: 'entity', cardinality: { min: 0, max: 'N' } },
        { entityId: 'entity', cardinality: { min: 0, max: 1 } },
      ]),
    ]

    const nodes = projectToNodes(project, { viewMode: 'MLD' })

    expect(nodes.some((node) => node.id === 'association')).toBe(false)
  })
})

describe('projectToEdges MCD reflexive association', () => {
  it('conserve deux branches entre la pastille et la même entité', () => {
    const project = createProject()
    project.entities = [createEntity('entity', 'ENTITY')]
    project.associations = [
      createAssociation('association', 'PARENT', [
        { entityId: 'entity', role: 'parent', cardinality: { min: 0, max: 'N' } },
        { entityId: 'entity', role: 'enfant', cardinality: { min: 0, max: 1 } },
      ]),
    ]

    const edges = projectToEdges(project, mcdOptions)

    expect(edges).toHaveLength(2)
    expect(edges[0]).toMatchObject({
      source: 'entity',
      target: 'association',
      sourceHandle: 'reflexive-source',
      targetHandle: 'reflexive-target-0',
    })
    expect(edges[1]).toMatchObject({
      source: 'association',
      target: 'entity',
      sourceHandle: 'reflexive-source-1',
      targetHandle: 'reflexive-target-1',
    })
  })
})
