import type { Project } from '@/domain'
import { createProject } from '@/domain'

const STORAGE_KEY = 'merise:project:last-opened'

export function loadProjectFromStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Project
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
  } catch {
    // ignore
  }
}

export function newProject(): Project {
  return createProject()
}