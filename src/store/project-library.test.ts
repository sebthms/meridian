import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject } from '@/domain'
import { createEntityCommand } from '@/editor'
import { createMemoryStorage } from '@/test-support/memory-storage'

describe('Store — bibliothèque et transitions isolées', () => {
  let storage: Storage
  let useStore: typeof import('./project-store').useProjectStore

  async function reload() {
    vi.resetModules()
    useStore = (await import('./project-store')).useProjectStore
  }

  beforeEach(async () => {
    storage = createMemoryStorage()
    vi.stubGlobal('localStorage', storage)
    await reload()
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('commence sans projet enregistré', () => {
    expect(useStore.getState().projects).toEqual([])
    expect(useStore.getState().activeProjectId).toBeNull()
  })

  it('crée, renomme, ouvre et supprime les projets en conservant leur identité', () => {
    const a = useStore.getState().createProject(' A ')
    const b = useStore.getState().createProject('B')
    useStore.getState().renameProject(a, ' Renommé ')
    useStore.getState().openProject(a)
    expect(useStore.getState().project.name).toBe('Renommé')
    useStore.getState().deleteProject(a)
    expect(useStore.getState().activeProjectId).toBe(b)
    useStore.getState().deleteProject(b)
    expect(useStore.getState().projects).toEqual([])
    expect(useStore.getState().activeProjectId).toBeNull()
    expect(JSON.parse(storage.getItem('merise:projects')!)).toEqual([])
  })

  it('charge dans le projet actif et crée une entrée quand la bibliothèque est vide', () => {
    useStore.getState().load(createProject('Import'))
    const id = useStore.getState().activeProjectId
    useStore.getState().load(createProject('Remplacement'))
    expect(useStore.getState().activeProjectId).toBe(id)
    expect(useStore.getState().projects).toHaveLength(1)
    expect(useStore.getState().project.name).toBe('Remplacement')
  })

  it('rouvre la première entrée persistée au démarrage', async () => {
    const a = useStore.getState().createProject('A')
    useStore.getState().createProject('B')
    await reload()
    expect(useStore.getState().activeProjectId).toBe(a)
  })

  it('migre l’ancienne clé seulement en l’absence de bibliothèque', async () => {
    storage.setItem('merise:project:last-opened', JSON.stringify(createProject('Ancien')))
    await reload()
    expect(useStore.getState().projects).toHaveLength(1)
    expect(useStore.getState().project.name).toBe('Ancien')
    useStore.getState().renameProject(useStore.getState().activeProjectId!, 'Bibliothèque')
    await reload()
    expect(useStore.getState().project.name).toBe('Bibliothèque')
  })

  it('réinitialise historique et sélection lors de l’ouverture, mais garde le mode de vue', () => {
    const a = useStore.getState().createProject('A')
    const b = useStore.getState().createProject('B')
    useStore.getState().apply(createEntityCommand(useStore.getState().project))
    useStore.getState().select('selected')
    useStore.getState().setViewMode('MLD')
    useStore.getState().openProject(a)
    expect(useStore.getState().past).toEqual([])
    expect(useStore.getState().future).toEqual([])
    expect(useStore.getState().selectedElementId).toBeUndefined()
    expect(useStore.getState().viewMode).toBe('MLD')
    useStore.getState().openProject(b)
    expect(useStore.getState().project.entities).toHaveLength(1)
  })

  it('ignore apply avec la même référence et borne l’historique à 100', () => {
    useStore.getState().createProject()
    const write = vi.spyOn(storage, 'setItem')
    useStore.getState().apply(useStore.getState().project)
    expect(write).not.toHaveBeenCalled()
    for (let index = 0; index < 105; index++) {
      useStore.getState().apply({ ...useStore.getState().project, name: String(index) })
    }
    expect(useStore.getState().past).toHaveLength(100)
  })

  it('clone le template sans modifier ses données', () => {
    const template = createEntityCommand(createProject('Template'))
    useStore.getState().createProjectFromTemplate('Copie', template)
    expect(useStore.getState().project.entities).toEqual(template.entities)
    expect(useStore.getState().project.entities).not.toBe(template.entities)
    expect(template.name).toBe('Template')
  })

  it('PP-01 : caractérise la désynchronisation undo/bibliothèque, correction D1 non autorisée', async () => {
    const a = useStore.getState().createProject('A')
    useStore.getState().apply(createEntityCommand(useStore.getState().project))
    useStore.getState().undo()
    expect(useStore.getState().project.entities).toHaveLength(0)
    expect(useStore.getState().projects[0].project.entities).toHaveLength(1)
    useStore.getState().redo()
    expect(useStore.getState().project.entities).toHaveLength(1)
    useStore.getState().undo()
    useStore.getState().openProject(a)
    expect(useStore.getState().project.entities).toHaveLength(1)
    await reload()
    expect(useStore.getState().project.entities).toHaveLength(1)
  })

  it('PP-02 : caractérise le statut saved malgré un quota dépassé', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
    useStore.getState().createProject('Non sauvegardé')
    expect(useStore.getState().saveStatus).toBe('saved')
    expect(storage.getItem('merise:projects')).toBeNull()
  })

  it('PP-04 : caractérise les cibles de modales conservées au changement de projet', () => {
    useStore.getState().createProject('A')
    useStore.getState().openAddProperty({ kind: 'entity', id: 'old-entity' })
    useStore.getState().openEditConceptual({ kind: 'inheritance', id: 'old-inheritance' })
    const b = useStore.getState().createProject('B')
    useStore.getState().openProject(b)
    expect(useStore.getState().addPropertyTarget?.id).toBe('old-entity')
    expect(useStore.getState().editConceptualTarget?.id).toBe('old-inheritance')
  })
})
