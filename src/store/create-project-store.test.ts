import { describe, expect, it } from 'vitest'
import { createProject } from '@/domain'
import { createEntityCommand } from '@/editor'
import { createProjectStore, type ProjectStorePersistence } from './create-project-store'
import type { StoredProject } from '@/persistence'
import type { Project } from '@/domain'

function memoryPersistence(initial: { library?: StoredProject[]; legacy?: Project | null } = {}) {
  let library = initial.library ?? []
  let legacy = initial.legacy ?? null
  const persistence: ProjectStorePersistence & { library: () => StoredProject[]; legacy: () => Project | null } = {
    loadLibrary: () => library,
    saveLibrary: (projects) => { library = projects },
    loadLegacy: () => legacy,
    saveLegacy: (project) => { legacy = project },
    clearStorage: () => { library = []; legacy = null },
    library: () => library,
    legacy: () => legacy,
  }
  return persistence
}

describe('Fabrique du store', () => {
  it('injecte horloge et identifiants sans changer les valeurs par défaut du singleton', () => {
    const persistence = memoryPersistence()
    let ids = 0
    let times = 0
    const store = createProjectStore({
      persistence,
      now: () => `2026-09-03T00:00:0${times++}Z`,
      createId: () => `id-${++ids}`,
    })
    const id = store.getState().createProject(' Alpha ')
    expect(id).toBe('id-1')
    expect(store.getState().projects[0]).toMatchObject({ id: 'id-1', updatedAt: '2026-09-03T00:00:00Z' })
    expect(store.getState().project.name).toBe('Alpha')
    store.getState().apply(createEntityCommand(store.getState().project))
    expect(store.getState().projects[0].updatedAt).toBe('2026-09-03T00:00:01Z')
  })

  it('migre l’ancienne clé uniquement si la bibliothèque est vide', () => {
    const legacy = createProject('Ancien')
    const migrated = createProjectStore({
      persistence: memoryPersistence({ legacy }),
      now: () => '2026-09-03T12:00:00Z',
      createId: () => 'legacy-id',
    })
    expect(migrated.getState().projects).toEqual([{ id: 'legacy-id', project: legacy, updatedAt: '2026-09-03T12:00:00Z' }])

    const existing: StoredProject = { id: 'kept', project: createProject('Bibliothèque'), updatedAt: '2026-01-01T00:00:00Z' }
    const skipped = createProjectStore({
      persistence: memoryPersistence({ library: [existing], legacy }),
    })
    expect(skipped.getState().projects).toEqual([existing])
    expect(skipped.getState().activeProjectId).toBe('kept')
  })

  it('conserve D1 : undo écrit la clé historique, pas la bibliothèque', () => {
    const persistence = memoryPersistence()
    const store = createProjectStore({ persistence, createId: () => 'p1', now: () => 't0' })
    store.getState().createProject('A')
    store.getState().apply(createEntityCommand(store.getState().project))
    expect(persistence.library()[0].project.entities).toHaveLength(1)
    store.getState().undo()
    expect(store.getState().project.entities).toHaveLength(0)
    expect(persistence.library()[0].project.entities).toHaveLength(1)
    expect(persistence.legacy()?.entities).toHaveLength(0)
  })

  it('conserve D2 : une erreur de stockage n’empêche pas le statut saved', () => {
    const persistence = memoryPersistence()
    persistence.saveLibrary = () => { /* quota : l’adaptateur absorbe, rien n’est écrit */ }
    const store = createProjectStore({ persistence, createId: () => 'p1', now: () => 't0' })
    store.getState().createProject('Non sauvegardé')
    expect(store.getState().saveStatus).toBe('saved')
    expect(persistence.library()).toEqual([])
  })
})
