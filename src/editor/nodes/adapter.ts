import type { Edge, Node } from '@xyflow/react'
import type { Project } from '@/domain'
import { isIdentifierAttribute, isReflexive, associationMidpoint, type ConceptualType } from '@/domain'
import { generateMld } from '@/mld'
import { deriveAssociationType, type AssociationType } from '@/editor/commands'
import type { Cardinality } from '@/domain'

export type EntityNodeData = {
  id: string
  label: string
  attributes: Array<{
    id: string
    name: string
    conceptualType: string
    isIdentifier: boolean
  }>
  foreignKeys: Array<{
    name: string
    reflexive: boolean
  }>
}

export type AssociationNodeData = {
  id: string
  label: string
  /** Présent quand l'association est N:N → la pastille se transforme en table. */
  columns?: Array<{
    name: string
    isPrimaryKey: boolean
    isForeignKey: boolean
    reflexive: boolean
  }>
  /** Propriétés portées par l'association (affichées dans la pastille). */
  attributes?: Array<{
    id: string
    name: string
    conceptualType: ConceptualType
  }>
}

export type AssocEdgeData = {
  associationId: string
  participantIndex: number
  type: AssociationType
  isOpen: boolean
  onOpen: (associationId: string, participantIndex: number) => void
  onPick: (cardinality: Cardinality) => void
  onClose: () => void
}

/**
 * Construit les nœuds React Flow à partir du modèle métier + MLD généré.
 * La pastille (association) existe toujours ; la table associative n'apparaît
 * que pour les N:N. Les clés (PK/FK) sont dérivées du MLD (option A : le MCD
 * reste la source de vérité, le MLD est généré et rendu visuellement).
 */
export function projectToNodes(project: Project, selectedId?: string): Node[] {
  const mld = generateMld(project)
  const entityNodes: Node[] = project.entities.map((e) => {
    const rel = mld.relations.find((r) => r.sourceId === e.id)
    const foreignKeys = (rel?.columns.filter((c) => c.isForeignKey) ?? []).map((c) => ({
      name: c.name,
      reflexive: c.references?.table === e.name,
    }))
    return {
      id: e.id,
      type: 'entity',
      position: e.position,
      selected: e.id === selectedId,
      // Dimensions initiales : évite l'erreur 015 (drag avant mesure par React Flow).
      measured: { width: 180, height: 60 },
      data: {
        id: e.id,
        label: e.name,
        attributes: e.attributes.map((a) => ({
          id: a.id,
          name: a.name,
          conceptualType: a.conceptualType,
          isIdentifier: isIdentifierAttribute(e, a.id),
        })),
        foreignKeys,
      } satisfies EntityNodeData,
    }
  })

  const byId = new Map(project.entities.map((e) => [e.id, e.position]))

  const associationNodes: Node[] = []
  for (const a of project.associations) {
    // Position stable : on conserve la position stockée, sinon point milieu.
    const position = a.position ?? associationMidpoint(a, byId)

    // La pastille se transforme en table lorsque l'association est N:N
    // (y compris réflexive N:N) : un seul nœud, dont le rendu dépend du type.
    const bothN = a.participants.length === 2 && a.participants.every((p) => p.cardinality.max === 'N')
    let columns: AssociationNodeData['columns']
    if (bothN) {
      const rel = mld.relations.find((r) => r.sourceId === a.id)
      const reflexive = isReflexive(a)
      columns = (rel?.columns ?? []).map((c) => ({
        name: c.name,
        isPrimaryKey: c.isPrimaryKey,
        isForeignKey: c.isForeignKey,
        reflexive: c.isForeignKey && reflexive,
      }))
    }

    associationNodes.push({
      id: a.id,
      type: 'association',
      position,
      selected: a.id === selectedId,
      measured: { width: 120, height: 40 },
      data: {
        id: a.id,
        label: a.name,
        columns,
        attributes: a.attributes.map((at) => ({
          id: at.id,
          name: at.name,
          conceptualType: at.conceptualType,
        })),
      } satisfies AssociationNodeData,
    })
  }

  return [...entityNodes, ...associationNodes]
}

export function projectToEdges(
  project: Project,
  opts: {
    onOpen: (associationId: string, participantIndex: number) => void
    onPick: (associationId: string, participantIndex: number, cardinality: Cardinality) => void
    onClose: () => void
    openTarget: { associationId: string; participantIndex: number } | null
  },
): Edge[] {
  const edges: Edge[] = []
  for (const association of project.associations) {
    const type = deriveAssociationType(association.participants)

    for (const [index, participant] of association.participants.entries()) {
      // 1ʳᵉ entité → handle gauche de la pastille ;
      // 2ᵉ entité ← handle droite de la pastille.
      const fromPastille = index === 1
      const isOpen =
        opts.openTarget?.associationId === association.id &&
        opts.openTarget?.participantIndex === index
      edges.push({
        id: `${association.id}__${participant.entityId}`,
        source: fromPastille ? association.id : participant.entityId,
        target: fromPastille ? participant.entityId : association.id,
        sourceHandle: fromPastille ? 'right' : 'source',
        targetHandle: fromPastille ? 'target' : 'left',
        type: 'assoc',
        label: type,
        data: {
          associationId: association.id,
          participantIndex: index,
          type,
          isOpen,
          onOpen: opts.onOpen,
          onPick: (c) => opts.onPick(association.id, index, c),
          onClose: opts.onClose,
        } satisfies AssocEdgeData,
      })
    }
  }
  return edges
}