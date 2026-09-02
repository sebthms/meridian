import { describe, expect, it } from 'vitest'
import catalog from './catalog.json'
import projects from './projects.json'
import type { Project } from '@/domain'
import { validateProject } from '@/merise'

describe('bibliothèque de templates', () => {
  it('contient un projet valide pour chaque entrée du catalogue', () => {
    const projectMap = projects as Record<string, Project>

    for (const template of catalog) {
      const project = projectMap[template.id]
      expect(project, `template manquant : ${template.id}`).toBeDefined()
      if (!project) throw new Error(`Template manquant : ${template.id}`)
      expect(project.entities.length, `${template.id} doit contenir des entités`).toBeGreaterThan(0)
      expect(project.associations.length, `${template.id} doit contenir des associations`).toBeGreaterThan(0)
      expect(validateProject(project).errors, `${template.id} contient des erreurs MERISE`).toEqual([])
    }
  })
})
