import { describe, expect, it } from 'vitest'
import { createProject } from '@/domain'
import {
  applyCanvasConnection,
  applyNodeMove,
  createAssociationCommand,
  createCifCommand,
  createEntityCommand,
  createInheritanceCommand,
} from './index'

describe('applyCanvasConnection', () => {
  it('crée une association N:N entre deux entités', () => {
    let project = createEntityCommand(createProject())
    project = createEntityCommand(project)
    const [left, right] = project.entities
    const next = applyCanvasConnection(project, left!.id, right!.id)
    expect(next.associations).toHaveLength(1)
    expect(next.associations[0]?.participants.map((participant) => participant.entityId)).toEqual([left!.id, right!.id])
  })

  it('fixe le parent d’un héritage puis un enfant', () => {
    let project = createEntityCommand(createProject())
    project = createEntityCommand(project)
    project = createInheritanceCommand(project)
    const [parent, child] = project.entities
    const inheritance = project.inheritances[0]!
    project = applyCanvasConnection(project, inheritance.id, parent!.id)
    expect(project.inheritances[0]?.parentEntityId).toBe(parent!.id)
    project = applyCanvasConnection(project, inheritance.id, child!.id)
    expect(project.inheritances[0]?.childEntityIds).toContain(child!.id)
  })

  it('attache une CIF à une entité source puis cible', () => {
    let project = createEntityCommand(createProject())
    project = createEntityCommand(project)
    project = createCifCommand(project)
    const [source, target] = project.entities
    const cif = project.cifs[0]!
    project = applyCanvasConnection(project, cif.id, source!.id)
    expect(project.cifs[0]?.sourceEntityId).toBe(source!.id)
    project = applyCanvasConnection(project, cif.id, target!.id)
    expect(project.cifs[0]?.targetEntityId).toBe(target!.id)
  })
})

describe('applyNodeMove', () => {
  it('déplace une association', () => {
    let project = createAssociationCommand(createProject())
    const association = project.associations[0]!
    const next = applyNodeMove(project, { id: association.id, type: 'association', position: { x: 40, y: 80 } })
    expect(next.associations[0]?.position).toEqual({ x: 40, y: 80 })
  })
})
