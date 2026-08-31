import { describe, it, expect } from 'vitest'
import type { Project } from '@/domain'
import { createProject } from '@/domain'
import {
  createEntityCommand,
  createAssociationCommand,
  renameEntity,
  deleteEntity,
  moveEntity,
  moveAssociation,
  addAttribute,
  addAttributeWithName,
  updateAttribute,
  removeAttribute,
  toggleIdentifierAttribute,
  updateCardinality,
  createAssociationBetween,
  ASSOCIATION_PRESETS,
  addAssociationParticipant,
  addAssociationAttribute,
  updateAssociationAttribute,
  deleteAssociation,
} from './commands'

// ─────────────────────────────────────────────────────────────────────────
// Tests des commandes d'édition (§30). Chaque commande est une fonction
// pure (Project → Project) : c'est ce qui rend undo/redo trivial.
// ─────────────────────────────────────────────────────────────────────────

function projectWithTwoEntities(): Project {
  let p = createProject()
  p = createEntityCommand(p)
  p = createEntityCommand(p)
  return p
}

describe('Commandes d’entités', () => {
  it('createEntityCommand ajoute une entité avec # id comme identifiant par défaut', () => {
    // Le MVP crée directement ENTITY_1 avec un identifiant id (§36).
    const p = createEntityCommand(createProject())
    expect(p.entities).toHaveLength(1)
    const e = p.entities[0]
    expect(e.attributes).toHaveLength(1)
    expect(e.identifiers[0].attributeIds).toEqual([e.attributes[0].id])
  })

  it('renameEntity est immuable (ne mute pas le projet d’origine)', () => {
    const original = projectWithTwoEntities()
    const renamed = renameEntity(original, original.entities[0].id, 'CLIENT')
    expect(renamed.entities[0].name).toBe('CLIENT')
    // le projet original reste inchangé → undo = restaurer l'ancienne référence
    expect(original.entities[0].name).toBe('ENTITY')
  })

  it('deleteEntity retire l’entité et supprime l’association devenue orpheline', () => {
    let p = projectWithTwoEntities()
    const [a, b] = p.entities
    p = { ...p, associations: [{ id: 'a1', name: 'AB', participants: [
      { entityId: a.id, cardinality: { min: 0, max: 'N' } },
      { entityId: b.id, cardinality: { min: 1, max: 1 } },
    ], attributes: [] }] }
    p = deleteEntity(p, a.id)
    expect(p.entities.map((e) => e.id)).toEqual([b.id])
    // l'association binaire réduite à une seule extrémité n'a plus de sens → supprimée
    expect(p.associations).toHaveLength(0)
  })

  it('moveEntity met à jour la position (state graphique ≠ model métier)', () => {
    const base = projectWithTwoEntities()
    const p = moveEntity(base, base.entities[0].id, { x: 50, y: 50 })
    expect(p.entities[0].position).toEqual({ x: 50, y: 50 })
  })
})

describe('Commandes d’attributs et identifiants', () => {
  it('addAttribute / updateAttribute / removeAttribute forment un cycle complet', () => {
    let p = projectWithTwoEntities()
    const eid = p.entities[0].id
    p = addAttribute(p, eid)
    const attr = p.entities[0].attributes.find((a) => a.name === 'attribut')
    expect(attr).toBeDefined()

    p = updateAttribute(p, eid, attr!.id, { name: 'nom', conceptualType: 'TEXT' })
    expect(p.entities[0].attributes.find((a) => a.id === attr!.id)!.name).toBe('nom')

    p = removeAttribute(p, eid, attr!.id)
    expect(p.entities[0].attributes.some((a) => a.id === attr!.id)).toBe(false)
  })

  it('removeAttribute retire aussi l’attribut de l’identifiant si nécessaire', () => {
    let p = projectWithTwoEntities()
    const eid = p.entities[0].id
    // on marque l'attribut "id" comme identifiant (déjà le cas), puis on le retire
    const idAttr = p.entities[0].attributes[0]
    p = removeAttribute(p, eid, idAttr.id)
    // plus aucune référence dans l'identifiant
    expect(p.entities[0].identifiers.every((i) => !i.attributeIds.includes(idAttr.id))).toBe(true)
  })

  it('toggleIdentifierAttribute marque/démarque un attribut comme identifiant', () => {
    let p = projectWithTwoEntities()
    const eid = p.entities[0].id
    // ajouter un attribut "nom" puis en faire l'identifiant
    p = addAttribute(p, eid)
    const nom = p.entities[0].attributes.find((a) => a.name === 'attribut')!
    p = updateAttribute(p, eid, nom.id, { name: 'nom' })

    p = toggleIdentifierAttribute(p, eid, nom.id)
    expect(p.entities[0].identifiers[0].attributeIds).toContain(nom.id)

    p = toggleIdentifierAttribute(p, eid, nom.id)
    expect(p.entities[0].identifiers[0].attributeIds).not.toContain(nom.id)
  })
})

describe('Commandes d’associations', () => {
  it('createAssociationCommand crée une pastille vide, reliée ensuite manuellement', () => {
    const p = createAssociationCommand(createProject())
    expect(p.associations).toHaveLength(1)
    // nouvelle pastille sans participant (on les ajoute via addAssociationParticipant)
    expect(p.associations[0].participants).toHaveLength(0)
  })

  it('addAssociationParticipant relie une entité à la pastille (participants ajoutés un à un)', () => {
    let p = projectWithTwoEntities()
    p = createAssociationCommand(p)
    const assoc = p.associations[0]
    p = addAssociationParticipant(p, assoc.id, p.entities[0].id)
    expect(p.associations[0].participants).toHaveLength(1)
    expect(p.associations[0].participants[0].entityId).toBe(p.entities[0].id)
    p = addAssociationParticipant(p, assoc.id, p.entities[1].id)
    expect(p.associations[0].participants).toHaveLength(2)
    expect(p.associations[0].participants.map((x) => x.entityId)).toEqual([
      p.entities[0].id,
      p.entities[1].id,
    ])
  })

  it('addAssociationParticipant est binaire : ignore une 3ᵉ connexion', () => {
    let p = projectWithTwoEntities()
    p = createAssociationCommand(p)
    const assoc = p.associations[0]
    const third = createEntityCommand(p)
    p = { ...p, entities: third.entities }
    p = addAssociationParticipant(p, assoc.id, p.entities[0].id)
    p = addAssociationParticipant(p, assoc.id, p.entities[1].id)
    const assocId = p.associations[0].id
    p = addAssociationParticipant(p, assocId, p.entities[2].id)
    expect(p.associations[0].participants).toHaveLength(2)
  })

  it('addAssociationParticipant réflexive : relier la même entité deux fois ajoute un rôle', () => {
    let p = projectWithTwoEntities()
    p = createAssociationCommand(p)
    const assoc = p.associations[0]
    const eid = p.entities[0].id
    p = addAssociationParticipant(p, assoc.id, eid)
    p = addAssociationParticipant(p, assoc.id, eid)
    expect(p.associations[0].participants).toHaveLength(2)
    expect(p.associations[0].participants[0].entityId).toBe(eid)
    expect(p.associations[0].participants[1].entityId).toBe(eid)
    expect(p.associations[0].participants[1].role).toBeDefined()
  })

  it('updateCardinality modifie la cardinalité d’un participant donné', () => {
    let p = projectWithTwoEntities()
    p = createAssociationCommand(p)
    const assoc = p.associations[0]
    p = addAssociationParticipant(p, assoc.id, p.entities[0].id)
    p = addAssociationParticipant(p, assoc.id, p.entities[1].id)
    p = updateCardinality(p, assoc.id, 0, { min: 1, max: 'N' })
    expect(p.associations[0].participants[0].cardinality).toEqual({ min: 1, max: 'N' })
    // l'autre participant n'est pas affecté
    expect(p.associations[0].participants[1].cardinality).toEqual({ min: 0, max: 'N' })
  })
})

describe('Commandes de formulaire et drag & drop', () => {
  it('addAttributeWithName crée une propriété nommée et typée, et renvoie son id', () => {
    const base = projectWithTwoEntities()
    const eid = base.entities[0].id
    const { project, attributeId } = addAttributeWithName(base, eid, 'email', 'TEXT')
    const attr = project.entities[0].attributes.find((a) => a.id === attributeId)!
    expect(attr.name).toBe('email')
    expect(attr.conceptualType).toBe('TEXT')
  })

  it('createAssociationBetween 1:N place les cardinalités attendues', () => {
    const base = projectWithTwoEntities()
    const [a, b] = base.entities
    const p = createAssociationBetween(base, a.id, b.id, '1:N')
    expect(p.associations).toHaveLength(1)
    expect(p.associations[0].participants[0].cardinality).toEqual({ min: 0, max: 'N' })
    expect(p.associations[0].participants[1].cardinality).toEqual({ min: 1, max: 1 })
  })

  it('createAssociationBetween réflexive relie la même entité deux fois avec des rôles', () => {
    const base = projectWithTwoEntities()
    const eid = base.entities[0].id
    const p = createAssociationBetween(base, eid, eid, 'REFLEXIVE')
    expect(p.associations).toHaveLength(1)
    expect(p.associations[0].participants).toHaveLength(2)
    expect(p.associations[0].participants.every((x) => x.entityId === eid)).toBe(true)
    expect(p.associations[0].participants[0].role).toBeDefined()
  })

  it('ASSOCIATION_PRESETS liste les 4 types d’association', () => {
    expect(ASSOCIATION_PRESETS.map((p) => p.id)).toEqual(['1:N', 'N:N', '1:1', 'REFLEXIVE'])
  })

  it('createAssociationBetween N:N place 0,N des deux côtés', () => {
    const base = projectWithTwoEntities()
    const [a, b] = base.entities
    const p = createAssociationBetween(base, a.id, b.id, 'N:N')
    expect(p.associations[0].participants[0].cardinality).toEqual({ min: 0, max: 'N' })
    expect(p.associations[0].participants[1].cardinality).toEqual({ min: 0, max: 'N' })
  })

  it('createAssociationBetween 1:1 place 0,1 et 1,1', () => {
    const base = projectWithTwoEntities()
    const [a, b] = base.entities
    const p = createAssociationBetween(base, a.id, b.id, '1:1')
    expect(p.associations[0].participants[0].cardinality).toEqual({ min: 0, max: 1 })
    expect(p.associations[0].participants[1].cardinality).toEqual({ min: 1, max: 1 })
  })
})

describe('Commandes d\u2019association avancées', () => {
  it('moveAssociation met à jour la position', () => {
    let p = createAssociationCommand(createProject())
    const assoc = p.associations[0]
    p = moveAssociation(p, assoc.id, { x: 100, y: 200 })
    expect(p.associations[0].position).toEqual({ x: 100, y: 200 })
  })

  it('moveAssociation est immuable', () => {
    const p = createAssociationCommand(createProject())
    const assoc = p.associations[0]
    const next = moveAssociation(p, assoc.id, { x: 999, y: 999 })
    expect(next.associations[0].position).toEqual({ x: 999, y: 999 })
    expect(p.associations[0].position).toEqual({ x: 200, y: 200 })
  })

  it('addAssociationAttribute ajoute une propriété à une association', () => {
    let p = projectWithTwoEntities()
    p = createAssociationBetween(p, p.entities[0].id, p.entities[1].id, 'N:N')
    const assocId = p.associations[0].id
    const res = addAssociationAttribute(p, assocId, 'date', 'DATE')
    expect(res.attributeId).not.toBe('')
    expect(res.project.associations[0].attributes).toHaveLength(1)
    expect(res.project.associations[0].attributes[0].name).toBe('date')
    expect(res.project.associations[0].attributes[0].conceptualType).toBe('DATE')
  })

  it('addAssociationAttribute refuse un nom dupliqué', () => {
    let p = projectWithTwoEntities()
    p = createAssociationBetween(p, p.entities[0].id, p.entities[1].id, 'N:N')
    const assocId = p.associations[0].id
    const { project: p2 } = addAssociationAttribute(p, assocId, 'date', 'DATE')
    const res = addAssociationAttribute(p2, assocId, 'date', 'TEXT')
    expect(res.attributeId).toBe('')
    expect(res.project).toBe(p2)
  })

  it('addAssociationAttribute ignore une association inexistante', () => {
    const p = projectWithTwoEntities()
    const res = addAssociationAttribute(p, 'fake_id', 'date', 'DATE')
    expect(res.attributeId).toBe('')
  })

  it('updateAssociationAttribute modifie une propriété d\u2019association', () => {
    let p = projectWithTwoEntities()
    p = createAssociationBetween(p, p.entities[0].id, p.entities[1].id, 'N:N')
    const assocId = p.associations[0].id
    const { project, attributeId } = addAssociationAttribute(p, assocId, 'date', 'DATE')
    p = updateAssociationAttribute(project, assocId, attributeId, { name: 'date_implantation', nullable: true })
    const attr = p.associations[0].attributes.find((a) => a.id === attributeId)!
    expect(attr.name).toBe('date_implantation')
    expect(attr.nullable).toBe(true)
  })

  it('deleteAssociation supprime l\u2019association', () => {
    let p = projectWithTwoEntities()
    p = createAssociationBetween(p, p.entities[0].id, p.entities[1].id, 'N:N')
    expect(p.associations).toHaveLength(1)
    p = deleteAssociation(p, p.associations[0].id)
    expect(p.associations).toHaveLength(0)
  })
})