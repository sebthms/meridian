import { describe, expect, it, vi } from 'vitest'
import { createProject } from '@/domain'
import { createAssociationBetween, createEntityCommand, renameEntity } from '@/editor'
import * as mld from '@/mld'
import { projectToEdges, projectToNodes } from './project-adapter'

function sampleProject() {
  let project = createProject()
  project = createEntityCommand(project)
  project = createEntityCommand(project)
  project = renameEntity(project, project.entities[0].id, 'CLIENT')
  project = renameEntity(project, project.entities[1].id, 'COMMANDE')
  return createAssociationBetween(project, project.entities[0].id, project.entities[1].id, 'N:N')
}

describe('Coût des projections', () => {
  it('n’appelle pas generateMld pour les vues MCD et UML', () => {
    const project = sampleProject()
    const spy = vi.spyOn(mld, 'generateMld')
    projectToNodes(project, { viewMode: 'MCD' })
    projectToEdges(project, { viewMode: 'MCD', onOpen: () => {}, onPick: () => {}, onClose: () => {}, openTarget: null })
    projectToNodes(project, { viewMode: 'UML' })
    projectToEdges(project, { viewMode: 'UML', onOpen: () => {}, onPick: () => {}, onClose: () => {}, openTarget: null })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('réutilise un MLD fourni pour la vue MLD', () => {
    const project = sampleProject()
    const model = mld.generateMld(project)
    const spy = vi.spyOn(mld, 'generateMld')
    projectToNodes(project, { viewMode: 'MLD', mld: model })
    projectToEdges(project, { viewMode: 'MLD', mld: model, onOpen: () => {}, onPick: () => {}, onClose: () => {}, openTarget: null })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
