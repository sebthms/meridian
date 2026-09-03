import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { normalizeProject, type Project } from '@/domain'
import { generateMld } from '@/mld'
import { generateSql } from '@/sql'
import templates from '@/features/project-library/templates/projects.fr.json'
import hashes from './projection-baseline.json'
import { projectToEdges, projectToNodes } from './project-adapter'

// Empreintes capturées avant extraction (L4). Les fonctions/callbacks sont
// exclus par JSON.stringify ; les tests dédiés vérifient leur comportement.
describe('Contrat de projection avant refactoring', () => {
  for (const [name, expected] of Object.entries(hashes)) {
    it(`préserve MLD, SQL et les trois vues : ${name}`, () => {
      const raw = name.endsWith('.json')
        ? JSON.parse(readFileSync(`fixtures/${name}`, 'utf8')) as Project
        : (templates as unknown as Record<string, Project>)[name]
      const project = normalizeProject(raw)
      const mld = generateMld(project)
      const projections = (['MCD', 'UML', 'MLD'] as const).map((viewMode) => ({
        nodes: projectToNodes(project, { viewMode }),
        edges: projectToEdges(project, { viewMode, onOpen: () => {}, onPick: () => {}, onClose: () => {}, openTarget: null }),
      }))
      const hash = createHash('sha256').update(JSON.stringify({ mld, sql: generateSql(mld), projections })).digest('hex')
      expect(hash).toBe(expected)
    })
  }
})
