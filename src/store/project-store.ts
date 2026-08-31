import { create } from 'zustand'
import type { Project } from '@/domain'
import { createProject, ensureAssociationPositions } from '@/domain'
import type { ValidationIssue } from '@/merise'
import { validateProject } from '@/merise'
import {
  loadProjectFromStorage,
  saveProjectToStorage,
  clearProjectStorage,
} from '@/persistence'

export type HistoryState = {
  past: Project[]
  future: Project[]
}

export type ViewMode = 'MCD' | 'UML' | 'MLD'

type ProjectStore = {
  project: Project
  viewMode: ViewMode
  selectedElementId?: string
  // UI transitoire : cible (entité ou association) du modal d'ajout de propriété.
  addPropertyTarget?: { kind: 'entity' | 'association'; id: string } | null
  showTypeLabels: boolean
  issues: ValidationIssue[]
  past: Project[]
  future: Project[]
  // actions
  apply: (next: Project) => void
  select: (id?: string) => void
  openAddProperty: (target: { kind: 'entity' | 'association'; id: string }) => void
  closeAddProperty: () => void
  toggleTypeLabels: () => void
  undo: () => void
  redo: () => void
  reset: () => void
  load: (project: Project) => void
  setViewMode: (mode: ViewMode) => void
  ignoreIssue: (issueId: string) => void
  ignoreRule: (ruleId: string) => void
  unignoreRule: (ruleId: string) => void
}

function revalidate(project: Project): ValidationIssue[] {
  return validateProject(project).issues
}

const MAX_HISTORY = 100

const initialProject = loadProjectFromStorage() ?? createProject()

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: initialProject,
  viewMode: 'MCD',
  selectedElementId: undefined,
  addPropertyTarget: null,
  showTypeLabels: true,
  issues: revalidate(initialProject),
  past: [],
  future: [],

  apply: (next) => {
    if (next === get().project) return
    const project = { ...next, associations: ensureAssociationPositions(next) }
    set((state) => ({
      project,
      issues: revalidate(project),
      past: [...state.past, state.project].slice(-MAX_HISTORY),
      future: [],
    }))
    saveProjectToStorage(project)
  },

  select: (id) => set({ selectedElementId: id }),

  openAddProperty: (target) => set({ addPropertyTarget: target }),

  closeAddProperty: () => set({ addPropertyTarget: null }),

  toggleTypeLabels: () => set((state) => ({ showTypeLabels: !state.showTypeLabels })),

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
    if (restored) saveProjectToStorage(restored)
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
    if (restored) saveProjectToStorage(restored)
  },

  reset: () => {
    const project = createProject()
    set({ project, issues: [], past: [], future: [], selectedElementId: undefined })
    clearProjectStorage()
  },

  load: (project) => {
    const next = { ...project, associations: ensureAssociationPositions(project) }
    set({
      project: next,
      issues: revalidate(next),
      past: [],
      future: [],
      selectedElementId: undefined,
    })
    saveProjectToStorage(next)
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
}))
