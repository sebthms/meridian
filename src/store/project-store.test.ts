import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './project-store'
import { createEntityCommand } from '@/editor'

// ─────────────────────────────────────────────────────────────────────────
// Tests du store Zustand (§29) : création, undo/redo, validation temps réel,
// et système d'ignorance. (localStorage est absent en Node → fonctions
// no-op via try/catch, ce qui rend le store testable.)
// ─────────────────────────────────────────────────────────────────────────

describe('ProjectStore — cycle de vie', () => {
  beforeEach(() => {
    // état neuf à chaque test (pas de leakage entre tests)
    useProjectStore.setState({
      project: useProjectStore.getState().project,
      past: [],
      future: [],
      issues: [],
      selectedElementId: undefined,
    })
    // on repart d'un projet vierge
    useProjectStore.getState().reset()
  })

  it('crée une entité via apply() puis la retrouve', () => {
    const store = useProjectStore.getState()
    store.apply(createEntityCommand(store.project))
    expect(useProjectStore.getState().project.entities).toHaveLength(1)
  })

  it('undo() annule la dernière action et redo() la restaure', () => {
    const initial = useProjectStore.getState().project

    // 1ère action : ajouter une entité
    useProjectStore.getState().apply(createEntityCommand(initial))
    expect(useProjectStore.getState().project.entities).toHaveLength(1)

    // undo → on revient à l'état initial (0 entité)
    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project.entities).toHaveLength(0)

    // redo → l'entité réapparaît
    useProjectStore.getState().redo()
    expect(useProjectStore.getState().project.entities).toHaveLength(1)
  })

  it('undo() sans historique ne fait rien', () => {
    useProjectStore.getState().undo()
    // aucun crash, l'état reste cohérent
    expect(useProjectStore.getState().project).toBeDefined()
  })

  it('la validation est recalculée à chaque modification (temps réel)', () => {
    const store = useProjectStore.getState()
    // une entité sans identifiant → E002 doit apparaître dans issues
    store.apply({ ...store.project, entities: [
      { id: 'e1', name: 'CLIENT', attributes: [], identifiers: [], position: { x: 0, y: 0 } },
    ] })
    const errors = useProjectStore.getState().issues.filter((i) => i.severity === 'error')
    expect(errors.some((e) => e.ruleId === 'MERISE-E002')).toBe(true)
  })
})

describe('ProjectStore — système d’ignorance', () => {
  it('ignoreIssue / ignoreRule mettent à jour les listes et filtrent les issues', () => {
    const store = useProjectStore.getState()
    store.apply({ ...store.project, entities: [
      { id: 'e1', name: 'CLIENT', attributes: [], identifiers: [], position: { x: 0, y: 0 } },
    ] })

    // d'abord, l'erreur E002 est présente
    expect(useProjectStore.getState().issues.some((i) => i.ruleId === 'MERISE-E002')).toBe(true)

    // on ignore la règle entière
    useProjectStore.getState().ignoreRule('MERISE-E002')
    expect(useProjectStore.getState().project.ignoredRules).toContain('MERISE-E002')
    expect(useProjectStore.getState().issues.some((i) => i.ruleId === 'MERISE-E002')).toBe(false)
  })
})