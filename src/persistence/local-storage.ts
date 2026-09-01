import type { Project } from '@/domain'
import { createProject } from '@/domain'
import { parseProject } from './project-file'

const STORAGE_KEY = 'merise:project:last-opened'
const PROJECTS_STORAGE_KEY = 'merise:projects'

export type StoredProject = {
  id: string
  project: Project
  updatedAt: string
}

function parseStoredProject(value: unknown): StoredProject | null {
  if (!value || typeof value !== 'object') return null
  const item = value as { id?: unknown; project?: unknown; updatedAt?: unknown }
  if (typeof item.id !== 'string' || !item.id || typeof item.updatedAt !== 'string' || !item.project) return null
  try {
    return { id: item.id, project: parseProject(JSON.stringify(item.project)), updatedAt: item.updatedAt }
  } catch {
    return null
  }
}

export function loadProjectLibrary(): StoredProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(parseStoredProject).filter((item): item is StoredProject => item !== null) : []
  } catch {
    return []
  }
}

export function saveProjectLibrary(projects: StoredProject[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
  } catch {
    // storage may be unavailable (private mode / quota) — ignore silently
  }
}

export function loadProjectFromStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseProject(raw)
  } catch {
    return null
  }
}

export function saveProjectToStorage(project: Project): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
  } catch {
    // storage may be unavailable (private mode / quota) — ignore silently
  }
}

export function clearProjectStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PROJECTS_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function newProject(): Project {
  return createProject()
}
