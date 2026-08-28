import type { Project } from '@/domain'
import {
  createAssociation,
  createAttribute,
  createEntity,
  createIdentifier,
  type Attribute,
  type ConceptualType,
} from '@/domain'

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/** Nom d'entité inutilisé : `BASE` puis `BASE_2`, `BASE_3`… */
function uniqueEntityName(project: Project, base: string): string {
  const used = new Set(project.entities.map((e) => e.name.trim().toLowerCase()))
  if (!used.has(base.toLowerCase())) return base
  let i = 2
  while (used.has(`${base}_${i}`.toLowerCase())) i += 1
  return `${base}_${i}`
}

/** Nom d'attribut inutilisé dans une entité donnée. */
function uniqueAttributeName(entity: Project['entities'][number], base: string): string {
  const used = new Set(entity.attributes.map((a) => a.name.trim().toLowerCase()))
  if (!used.has(base.toLowerCase())) return base
  let i = 2
  while (used.has(`${base}_${i}`.toLowerCase())) i += 1
  return `${base}_${i}`
}

export function createEntityCommand(project: Project): Project {
  const entity = createEntity(uid('e'), uniqueEntityName(project, 'ENTITY'), {
    x: 120 + project.entities.length * 40,
    y: 120,
  })
  const idAttr = createAttribute(uid('a'), 'id', 'INTEGER')
  entity.attributes = [idAttr]
  entity.identifiers = [createIdentifier(uid('i'), [idAttr.id])]
  return { ...project, entities: [...project.entities, entity] }
}

export function renameEntity(project: Project, entityId: string, name: string): Project {
  const trimmed = name.trim()
  // Refuse un nom vide ou déjà porté par une autre entité.
  if (trimmed.length === 0) return project
  const duplicate = project.entities.some(
    (e) => e.id !== entityId && e.name.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  if (duplicate) return project
  return {
    ...project,
    entities: project.entities.map((e) => (e.id === entityId ? { ...e, name: trimmed } : e)),
  }
}

export function deleteEntity(project: Project, entityId: string): Project {
  // Règle MERISE : une association est binaire. Si la suppression d'une entité
  // la réduit à moins de deux extrémités valides, elle n'a plus de sens → on la
  // supprime (pas d'orpheline → pas d'E007/E010 parasites).
  const associations = project.associations
    .map((a) => ({
      ...a,
      participants: a.participants.filter((p) => p.entityId !== entityId),
    }))
    .filter((a) => a.participants.length >= 2)

  return { ...project, entities: project.entities.filter((e) => e.id !== entityId), associations }
}

export function moveEntity(project: Project, entityId: string, position: { x: number; y: number }): Project {
  return {
    ...project,
    entities: project.entities.map((e) => (e.id === entityId ? { ...e, position } : e)),
  }
}

export function addAttribute(project: Project, entityId: string): Project {
  return {
    ...project,
    entities: project.entities.map((e) =>
      e.id === entityId
        ? { ...e, attributes: [...e.attributes, createAttribute(uid('a'), uniqueAttributeName(e, 'attribut'), 'TEXT')] }
        : e,
    ),
  }
}

/**
 * Ajoute une propriété nommée et typée (§ Interface — formulaire).
 * Renvoie aussi l'id créé pour une sélection éventuelle.
 * Refuse un nom dupliqué dans l'entité (projet inchangé, id vide).
 */
export function addAttributeWithName(
  project: Project,
  entityId: string,
  name: string,
  conceptualType: NonNullable<Project['entities'][number]['attributes'][number]['conceptualType']> = 'TEXT',
): { project: Project; attributeId: string } {
  const entity = project.entities.find((e) => e.id === entityId)
  if (
    !entity ||
    entity.attributes.some((a) => a.name.trim().toLowerCase() === name.trim().toLowerCase())
  ) {
    return { project, attributeId: '' }
  }
  const attr = createAttribute(uid('a'), name.trim(), conceptualType)
  const projectNext = {
    ...project,
    entities: project.entities.map((e) =>
      e.id === entityId ? { ...e, attributes: [...e.attributes, attr] } : e,
    ),
  }
  return { project: projectNext, attributeId: attr.id }
}

export function updateAttribute(
  project: Project,
  entityId: string,
  attributeId: string,
  patch: Partial<NonNullable<Project['entities'][number]['attributes'][number]>>,
): Project {
  const entity = project.entities.find((e) => e.id === entityId)
  if (entity && patch.name && patch.name.trim() !== '') {
    // refuse de renommer vers un nom déjà porté par un autre attribut
    const dup = entity.attributes.some(
      (a) => a.id !== attributeId && a.name.trim().toLowerCase() === patch.name!.trim().toLowerCase(),
    )
    if (dup) return project
  }
  return {
    ...project,
    entities: project.entities.map((e) =>
      e.id === entityId
        ? {
            ...e,
            attributes: e.attributes.map((a) =>
              a.id === attributeId
                ? { ...a, ...patch, ...(patch.name ? { name: patch.name.trim() } : {}) }
                : a,
            ),
          }
        : e,
    ),
  }
}

export function removeAttribute(project: Project, entityId: string, attributeId: string): Project {
  return {
    ...project,
    entities: project.entities.map((e) =>
      e.id === entityId
        ? {
            ...e,
            attributes: e.attributes.filter((a) => a.id !== attributeId),
            identifiers: e.identifiers.map((i) => ({
              ...i,
              attributeIds: i.attributeIds.filter((id) => id !== attributeId),
            })),
          }
        : e,
    ),
  }
}

export function toggleIdentifierAttribute(
  project: Project,
  entityId: string,
  attributeId: string,
): Project {
  return {
    ...project,
    entities: project.entities.map((e) => {
      if (e.id !== entityId) return e
      const current = e.identifiers[0]
      const isIn = current?.attributeIds.includes(attributeId)
      const nextIds = isIn
        ? current!.attributeIds.filter((id) => id !== attributeId)
        : [...(current?.attributeIds ?? []), attributeId]
      const identifiers =
        nextIds.length === 0 ? [] : [createIdentifier(current?.id ?? uid('i'), nextIds)]
      return { ...e, identifiers }
    }),
  }
}

export function createAssociationCommand(project: Project): Project {
  // Le bouton « Ajouter une association » crée une pastille vide, reliée
  // ensuite manuellement à deux entités (les participants sont ajoutés via
  // addAssociationParticipant au fil des connexions).
  const association = createAssociation(uid('a'), 'ASSOCIATION', [], { x: 200, y: 200 })
  return { ...project, associations: [...project.associations, association] }
}

/**
 * Relie une entité à une association (connexion manuelle) : ajoute un
 * participant. Binaire : on ignore une 3ᵉ connexion. Si l'entité est déjà
 * liée, c'est une association réflexive → on lui donne un rôle.
 */
export function addAssociationParticipant(
  project: Project,
  associationId: string,
  entityId: string,
): Project {
  return {
    ...project,
    associations: project.associations.map((a) => {
      if (a.id !== associationId || a.participants.length >= 2) return a
      const reflexive = a.participants.some((p) => p.entityId === entityId)
      return {
        ...a,
        participants: [
          ...a.participants,
          {
            entityId,
            role: reflexive ? 'parent' : undefined,
            cardinality: { min: 0, max: 'N' } as const,
          },
        ],
      }
    }),
  }
}

export function updateCardinality(
  project: Project,
  associationId: string,
  participantIndex: number,
  cardinality: { min: 0 | 1; max: 1 | 'N' },
): Project {
  return {
    ...project,
    associations: project.associations.map((a) =>
      a.id === associationId
        ? {
            ...a,
            participants: a.participants.map((p, i) =>
              i === participantIndex ? { ...p, cardinality } : p,
            ),
          }
        : a,
    ),
  }
}

export type AssociationType = '1:N' | 'N:N' | '1:1' | 'REFLEXIVE'

export type AssociationPreset = AssociationType

export const ASSOCIATION_PRESETS: ReadonlyArray<{ id: AssociationType; label: string }> = [
  { id: '1:N', label: '1:N' },
  { id: 'N:N', label: 'N:N' },
  { id: '1:1', label: '1:1' },
  { id: 'REFLEXIVE', label: 'Réflexive' },
]

/**
 * Dérive le type d'association à partir des cardinalités des participants.
 * (Réflexive : même entité des deux côtés.)
 */
export function deriveAssociationType(
  participants: Array<{ entityId: string; cardinality: { min: 0 | 1; max: 1 | 'N' } }>,
): AssociationType {
  if (participants.length === 2 && participants[0].entityId === participants[1].entityId) {
    return 'REFLEXIVE'
  }
  // Association incomplète (0 ou 1 participant) : pas encore déterminable.
  if (participants.length < 2) return '1:N'
  const [a, b] = participants
  if (a.cardinality.max === 'N' && b.cardinality.max === 'N') return 'N:N'
  if (a.cardinality.max === 1 && b.cardinality.max === 1) return '1:1'
  return '1:N'
}

/**
 * Crée une association entre deux entités (§ drag & drop) selon un preset.
 * La réflexive relie la même entité deux fois avec des rôles.
 */
export function createAssociationBetween(
  project: Project,
  entityAId: string,
  entityBId: string,
  preset: AssociationPreset,
  name?: string,
): Project {
  const reflexive = entityAId === entityBId
  const participants = (() => {
    switch (preset) {
      case '1:N':
        return [
          { entityId: entityAId, cardinality: { min: 0, max: 'N' } as const },
          { entityId: entityBId, cardinality: { min: 1, max: 1 } as const },
        ]
      case 'N:N':
        return [
          { entityId: entityAId, cardinality: { min: 0, max: 'N' } as const },
          { entityId: entityBId, cardinality: { min: 0, max: 'N' } as const },
        ]
      case '1:1':
        return [
          { entityId: entityAId, cardinality: { min: 0, max: 1 } as const },
          { entityId: entityBId, cardinality: { min: 1, max: 1 } as const },
        ]
      case 'REFLEXIVE':
        return reflexive
          ? [
              { entityId: entityAId, role: 'parent', cardinality: { min: 0, max: 'N' } as const },
              { entityId: entityAId, role: 'enfant', cardinality: { min: 0, max: 1 } as const },
            ]
          : [
              { entityId: entityAId, cardinality: { min: 0, max: 'N' } as const },
              { entityId: entityBId, cardinality: { min: 0, max: 'N' } as const },
            ]
    }
  })()

  const association = createAssociation(uid('a'), name?.trim() || 'ASSOCIATION', participants)
  // Position stable : point milieu des deux entités.
  const eA = project.entities.find((e) => e.id === entityAId)
  const eB = project.entities.find((e) => e.id === entityBId)
  const posA = eA?.position ?? { x: 0, y: 0 }
  const posB = eB?.position ?? { x: 0, y: 0 }
  const position = {
    x: (posA.x + posB.x) / 2,
    y: (posA.y + posB.y) / 2,
  }
  return { ...project, associations: [...project.associations, { ...association, position }] }
}

export function deleteAssociation(project: Project, associationId: string): Project {
  return {
    ...project,
    associations: project.associations.filter((a) => a.id !== associationId),
  }
}

export function updateAssociationName(project: Project, associationId: string, name: string): Project {
  return {
    ...project,
    associations: project.associations.map((a) => (a.id === associationId ? { ...a, name } : a)),
  }
}

/**
 * Ajoute une propriété portée par une association (attribut de l'association).
 * Renvoie l'id créé ; refus d'un nom dupliqué (projet inchangé, id vide).
 */
export function addAssociationAttribute(
  project: Project,
  associationId: string,
  name: string,
  conceptualType: ConceptualType = 'TEXT',
): { project: Project; attributeId: string } {
  const association = project.associations.find((a) => a.id === associationId)
  if (
    !association ||
    association.attributes.some((a) => a.name.trim().toLowerCase() === name.trim().toLowerCase())
  ) {
    return { project, attributeId: '' }
  }
  const attr = createAttribute(uid('a'), name.trim(), conceptualType)
  const projectNext = {
    ...project,
    associations: project.associations.map((a) =>
      a.id === associationId ? { ...a, attributes: [...a.attributes, attr] } : a,
    ),
  }
  return { project: projectNext, attributeId: attr.id }
}

export function updateAssociationAttribute(
  project: Project,
  associationId: string,
  attributeId: string,
  patch: Partial<Attribute>,
): Project {
  return {
    ...project,
    associations: project.associations.map((a) =>
      a.id === associationId
        ? {
            ...a,
            attributes: a.attributes.map((at) => (at.id === attributeId ? { ...at, ...patch } : at)),
          }
        : a,
    ),
  }
}

export function updateParticipantRole(
  project: Project,
  associationId: string,
  participantIndex: number,
  role: string,
): Project {
  return {
    ...project,
    associations: project.associations.map((a) =>
      a.id === associationId
        ? {
            ...a,
            participants: a.participants.map((p, i) =>
              i === participantIndex ? { ...p, role: role.trim() || undefined } : p,
            ),
          }
        : a,
    ),
  }
}

/**
 * Change le type d'une association (popover de l'arête) : met à jour les
 * cardinalités des deux participants selon le preset choisi.
 */
export function setAssociationType(
  project: Project,
  associationId: string,
  type: AssociationType,
): Project {
  return {
    ...project,
    associations: project.associations.map((a) => {
      if (a.id !== associationId || a.participants.length !== 2) return a
      const [x, y] = a.participants
      const reflexive = x.entityId === y.entityId

      if (reflexive && type !== 'REFLEXIVE') return a
      if (!reflexive && type === 'REFLEXIVE') return a

      switch (type) {
        case '1:N':
          return {
            ...a,
            participants: [
              { ...x, role: undefined, cardinality: { min: 0, max: 'N' as const } },
              { ...y, role: undefined, cardinality: { min: 1, max: 1 as const } },
            ],
          }
        case 'N:N':
          return {
            ...a,
            participants: [
              { ...x, role: undefined, cardinality: { min: 0, max: 'N' as const } },
              { ...y, role: undefined, cardinality: { min: 0, max: 'N' as const } },
            ],
          }
        case '1:1':
          return {
            ...a,
            participants: [
              { ...x, role: undefined, cardinality: { min: 0, max: 1 as const } },
              { ...y, role: undefined, cardinality: { min: 1, max: 1 as const } },
            ],
          }
        case 'REFLEXIVE':
          return {
            ...a,
            participants: [
              { ...x, role: x.role ?? 'parent', cardinality: { min: 0, max: 'N' as const } },
              { ...y, role: y.role ?? 'enfant', cardinality: { min: 0, max: 1 as const } },
            ],
          }
      }
    }),
  }
}