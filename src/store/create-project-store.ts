import { create } from 'zustand'
import type { ConceptualKind, Project, ViewMode } from '@/domain'
import { createProject as createEmptyProject, ensureAssociationPositions, normalizeProject } from '@/domain'
import type { ValidationIssue } from '@/merise'
import { validateProject } from '@/merise'
import {
  loadProjectFromStorage,
  loadProjectLibrary,
  saveProjectLibrary,
  type StoredProject,
  saveProjectToStorage,
  clearProjectStorage,
} from '@/persistence'

export type HistoryState = {
  past: Project[]
  future: Project[]
}

export type { ViewMode } from '@/domain'
export type SaveStatus = 'saved' | 'saving'

export type ProjectStore = {
  project: Project
  projects: StoredProject[]
  activeProjectId: string | null
  viewMode: ViewMode
  saveStatus: SaveStatus
  selectedElementId?: string
  addPropertyTarget?: { kind: 'entity' | 'association'; id: string; attributeId?: string } | null
  editConceptualTarget?: { kind: ConceptualKind; id: string } | null
  issues: ValidationIssue[]
  past: Project[]
  future: Project[]
  apply: (next: Project) => void
  select: (id?: string) => void
  openAddProperty: (target: { kind: 'entity' | 'association'; id: string; attributeId?: string }) => void
  closeAddProperty: () => void
  openEditConceptual: (target: { kind: ConceptualKind; id: string }) => void
  closeEditConceptual: () => void
  undo: () => void
  redo: () => void
  reset: () => void
  load: (project: Project) => void
  createProject: (name?: string) => string
  createProjectFromTemplate: (name: string, template: Project) => string
  openProject: (projectId: string) => void
  renameProject: (projectId: string, name: string) => void
  deleteProject: (projectId: string) => void
  clearAllProjects: () => void
  setViewMode: (mode: ViewMode) => void
  ignoreIssue: (issueId: string) => void
  ignoreRule: (ruleId: string) => void
  unignoreRule: (ruleId: string) => void
  resetIgnoredRules: () => void
}

export type ProjectStorePersistence = {
  loadLibrary: () => StoredProject[]
  saveLibrary: (projects: StoredProject[]) => void
  loadLegacy: () => Project | null
  saveLegacy: (project: Project) => void
  clearStorage: () => void
}

export type ProjectStoreDependencies = {
  persistence?: Partial<ProjectStorePersistence>
  now?: () => string
  createId?: () => string
}

const MAX_HISTORY = 100

function revalidate(project: Project): ValidationIssue[] {
  return validateProject(normalizeProject(project)).issues
}

export function defaultProjectId(): string {
  return `project_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function defaultPersistence(): ProjectStorePersistence {
  return {
    loadLibrary: loadProjectLibrary,
    saveLibrary: saveProjectLibrary,
    loadLegacy: loadProjectFromStorage,
    saveLegacy: saveProjectToStorage,
    clearStorage: clearProjectStorage,
  }
}

export function createProjectStore(dependencies: ProjectStoreDependencies = {}) {
  const persistence: ProjectStorePersistence = { ...defaultPersistence(), ...dependencies.persistence }
  const now = dependencies.now ?? (() => new Date().toISOString())
  const createId = dependencies.createId ?? defaultProjectId

  const persistedProjects = persistence.loadLibrary()
  const legacyProject = persistedProjects.length === 0 ? persistence.loadLegacy() : null
  const initialProjects: StoredProject[] = legacyProject
    ? [{ id: createId(), project: legacyProject, updatedAt: now() }]
    : persistedProjects
  const initialActiveProjectId = initialProjects[0]?.id ?? null
  const initialProject = initialProjects[0]?.project ?? createEmptyProject()

  if (legacyProject) persistence.saveLibrary(initialProjects)

  return create<ProjectStore>((set, get) => ({
    project: initialProject,
    projects: initialProjects,
    activeProjectId: initialActiveProjectId,
    viewMode: 'MCD',
    saveStatus: 'saved',
    selectedElementId: undefined,
    addPropertyTarget: null,
    editConceptualTarget: null,
    issues: revalidate(initialProject),
    past: [],
    future: [],

    apply: (next) => {
      if (next === get().project) return
      const project = normalizeProject({ ...next, associations: ensureAssociationPositions(next) })
      set({ saveStatus: 'saving' })
      set((state) => {
        const projects = state.projects.map((item) => item.id === state.activeProjectId
          ? { ...item, project, updatedAt: now() }
          : item)
        persistence.saveLibrary(projects)
        return {
        project,
        projects,
        issues: revalidate(project),
        past: [...state.past, state.project].slice(-MAX_HISTORY),
        future: [],
        saveStatus: 'saved',
        }
      })
    },

    select: (id) => set({ selectedElementId: id }),

    openAddProperty: (target) => set({ addPropertyTarget: target }),

    closeAddProperty: () => set({ addPropertyTarget: null }),

    openEditConceptual: (target) => set({ editConceptualTarget: target }),

    closeEditConceptual: () => set({ editConceptualTarget: null }),

    undo: () => {
      let restored: Project | undefined
      set((state) => {
        const previous = state.past[state.past.length - 1]
        if (!previous) return state
        restored = previous
        return {
          project: previous,
          issues: revalidate(previous),
          past: state.past.slice(0, -1),
          future: [state.project, ...state.future].slice(0, MAX_HISTORY),
          selectedElementId: undefined,
        }
      })
      if (restored) { persistence.saveLegacy(restored); set({ saveStatus: 'saved' }) }
    },

    redo: () => {
      let restored: Project | undefined
      set((state) => {
        const next = state.future[0]
        if (!next) return state
        restored = next
        return {
          project: next,
          issues: revalidate(next),
          past: [...state.past, state.project].slice(-MAX_HISTORY),
          future: state.future.slice(1),
          selectedElementId: undefined,
        }
      })
      if (restored) { persistence.saveLegacy(restored); set({ saveStatus: 'saved' }) }
    },

    reset: () => {
      const project = createEmptyProject()
      get().load(project)
    },

    load: (project) => {
      const next = normalizeProject({ ...project, associations: ensureAssociationPositions(project) })
      set({ saveStatus: 'saving' })
      set((state) => {
        const projects = state.activeProjectId
          ? state.projects.map((item) => item.id === state.activeProjectId ? { ...item, project: next, updatedAt: now() } : item)
          : [...state.projects, { id: createId(), project: next, updatedAt: now() }]
        const activeProjectId = state.activeProjectId ?? projects[projects.length - 1]!.id
        persistence.saveLibrary(projects)
        return {
        project: next,
        projects,
        activeProjectId,
        issues: revalidate(next),
        past: [],
        future: [],
        saveStatus: 'saved',
        selectedElementId: undefined,
        }
      })
    },

    createProject: (name = 'Nouveau projet') => {
      const project = createEmptyProject(name.trim() || 'Nouveau projet')
      const item = { id: createId(), project, updatedAt: now() }
      set({ saveStatus: 'saving' })
      set((state) => {
        const projects = [...state.projects, item]
        persistence.saveLibrary(projects)
        return { projects, activeProjectId: item.id, project, issues: revalidate(project), past: [], future: [], selectedElementId: undefined, saveStatus: 'saved' }
      })
      return item.id
    },

    createProjectFromTemplate: (name, template) => {
      const project: Project = normalizeProject(JSON.parse(JSON.stringify({ ...template, name: name.trim() || template.name })) as Project)
      const item = { id: createId(), project, updatedAt: now() }
      set({ saveStatus: 'saving' })
      set((state) => {
        const projects = [...state.projects, item]
        persistence.saveLibrary(projects)
        return { projects, activeProjectId: item.id, project, issues: revalidate(project), past: [], future: [], selectedElementId: undefined, saveStatus: 'saved' }
      })
      return item.id
    },

    openProject: (projectId) => {
      set((state) => {
        const item = state.projects.find((candidate) => candidate.id === projectId)
        if (!item) return state
        return { activeProjectId: item.id, project: item.project, issues: revalidate(item.project), past: [], future: [], selectedElementId: undefined }
      })
    },

    renameProject: (projectId, name) => {
      const trimmedName = name.trim()
      if (!trimmedName) return
      set({ saveStatus: 'saving' })
      set((state) => {
        const projects = state.projects.map((item) => item.id === projectId ? { ...item, project: { ...item.project, name: trimmedName }, updatedAt: now() } : item)
        const active = projects.find((item) => item.id === state.activeProjectId)
        persistence.saveLibrary(projects)
        return active ? { projects, project: active.project, saveStatus: 'saved' } : { projects, saveStatus: 'saved' }
      })
    },

    deleteProject: (projectId) => {
      set({ saveStatus: 'saving' })
      set((state) => {
        const remaining = state.projects.filter((item) => item.id !== projectId)
        if (remaining.length === 0) {
          persistence.saveLibrary([])
          return { projects: [], activeProjectId: null, project: createEmptyProject(), issues: [], past: [], future: [], selectedElementId: undefined, saveStatus: 'saved' }
        }
        const activeProjectId = state.activeProjectId === projectId ? remaining[0].id : state.activeProjectId
        const active = remaining.find((item) => item.id === activeProjectId) ?? remaining[0]
        persistence.saveLibrary(remaining)
        return { projects: remaining, activeProjectId: active.id, project: active.project, issues: revalidate(active.project), past: [], future: [], selectedElementId: undefined, saveStatus: 'saved' }
      })
    },

    clearAllProjects: () => {
      set({ saveStatus: 'saving' })
      persistence.clearStorage()
      set({ projects: [], activeProjectId: null, project: createEmptyProject(), issues: [], past: [], future: [], selectedElementId: undefined, saveStatus: 'saved' })
    },

    setViewMode: (viewMode) => set({ viewMode }),

    ignoreIssue: (issueId) => {
      const { project } = get()
      if (project.ignoredIssueIds.includes(issueId)) return
      const next = { ...project, ignoredIssueIds: [...project.ignoredIssueIds, issueId] }
      get().apply(next)
    },

    ignoreRule: (ruleId) => {
      const { project } = get()
      if (project.ignoredRules.includes(ruleId)) return
      const next = { ...project, ignoredRules: [...project.ignoredRules, ruleId] }
      get().apply(next)
    },

    unignoreRule: (ruleId) => {
      const { project } = get()
      const next = {
        ...project,
        ignoredRules: project.ignoredRules.filter((r) => r !== ruleId),
        ignoredIssueIds: project.ignoredIssueIds.filter((id) => !id.startsWith(`${ruleId}:`)),
      }
      get().apply(next)
    },

    resetIgnoredRules: () => {
      const { project } = get()
      if (project.ignoredRules.length === 0 && project.ignoredIssueIds.length === 0) return
      get().apply({ ...project, ignoredRules: [], ignoredIssueIds: [] })
    },
  }))
}
