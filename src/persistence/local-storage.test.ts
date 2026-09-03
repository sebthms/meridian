import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject } from '@/domain'
import { createMemoryStorage } from '@/test-support/memory-storage'
import { clearProjectStorage, loadProjectFromStorage, loadProjectLibrary, saveProjectLibrary, saveProjectToStorage } from './local-storage'

describe('Stockage local — contrat existant', () => {
  let storage: Storage
  beforeEach(() => {
    storage = createMemoryStorage()
    vi.stubGlobal('localStorage', storage)
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('retourne une bibliothèque vide et aucun ancien projet sans données', () => {
    expect(loadProjectLibrary()).toEqual([])
    expect(loadProjectFromStorage()).toBeNull()
  })

  it('conserve la bibliothèque et les métadonnées lors du round trip', () => {
    const projects = [{ id: 'first', project: createProject('A'), updatedAt: '2026-09-03T00:00:00Z' }]
    saveProjectLibrary(projects)
    expect(loadProjectLibrary()).toEqual(projects)
    expect(storage.getItem('merise:projects')).toBe(JSON.stringify(projects))
  })

  it('conserve la clé de stockage historique', () => {
    const project = createProject('Historique')
    saveProjectToStorage(project)
    expect(loadProjectFromStorage()).toEqual(project)
    expect(storage.getItem('merise:projects')).toBeNull()
  })

  it.each(['{', '{}', 'null'])('tolère une bibliothèque illisible : %s', (raw) => {
    storage.setItem('merise:projects', raw)
    expect(loadProjectLibrary()).toEqual([])
  })

  it('filtre actuellement les entrées invalides sans retirer les entrées valides', () => {
    const valid = { id: 'valid', project: createProject(), updatedAt: '2026-09-03' }
    storage.setItem('merise:projects', JSON.stringify([null, {}, { ...valid, project: {} }, valid]))
    expect(loadProjectLibrary()).toEqual([valid])
  })

  it('efface les deux clés de projet mais conserve les préférences', () => {
    saveProjectLibrary([])
    saveProjectToStorage(createProject())
    storage.setItem('merise-theme', 'dark')
    clearProjectStorage()
    expect(storage.getItem('merise:projects')).toBeNull()
    expect(storage.getItem('merise:project:last-opened')).toBeNull()
    expect(storage.getItem('merise-theme')).toBe('dark')
  })

  it('PP-02 : caractérise les exceptions actuellement masquées, sans approuver ce comportement', () => {
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      vi.spyOn(storage, method).mockImplementation(() => { throw new Error('Storage unavailable') })
    }
    expect(loadProjectLibrary()).toEqual([])
    expect(loadProjectFromStorage()).toBeNull()
    expect(() => saveProjectLibrary([])).not.toThrow()
    expect(() => saveProjectToStorage(createProject())).not.toThrow()
    expect(() => clearProjectStorage()).not.toThrow()
  })
})
