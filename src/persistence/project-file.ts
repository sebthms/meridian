import type { Project } from '@/domain'
import { createProject } from '@/domain'

export type ProjectFile = Project

export function exportProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function downloadProject(project: Project, filename = 'my-project.merise.json'): void {
  const blob = new Blob([exportProject(project)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadText(content: string, filename: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseProject(raw: string): ProjectFile {
  const parsed = JSON.parse(raw) as Partial<Project>
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.entities) || !Array.isArray(parsed.associations)) {
    throw new Error('Fichier projet invalide : format .merise.json attendu.')
  }
  return {
    version: 1,
    name: parsed.name ?? 'Projet importé',
    entities: parsed.entities,
    associations: parsed.associations,
    ignoredRules: parsed.ignoredRules ?? [],
    ignoredIssueIds: parsed.ignoredIssueIds ?? [],
  }
}

export function emptyProject(): ProjectFile {
  return createProject()
}