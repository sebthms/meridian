import type { Edge, Node } from '@xyflow/react'
import type { Project } from '@/domain'
import { isIdentifierAttribute, isReflexive, associationMidpoint, cardinalityToString, type ConceptualType, type Cardinality } from '@/domain'
import { generateMld } from '@/mld'
import type { ViewMode } from '@/store/project-store'

export type EntityNodeData = {
  id: string
  label: string
  viewMode: ViewMode
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
  viewMode: ViewMode
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
  type: string
  otherCardinality: Cardinality | null
  isOpen: boolean
  viewMode: ViewMode
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
export function projectToNodes(
  project: Project,
  opts: { selectedId?: string; viewMode: ViewMode },
): Node[] {
  const { selectedId, viewMode } = opts
  const mld = generateMld(project)

  const entityNodes: Node[] = project.entities.map((e) => {
    const rel = mld.relations.find((r) => r.sourceId === e.id)
    const foreignKeys =
      viewMode === 'MLD'
        ? (rel?.columns.filter((c) => c.isForeignKey) ?? []).map((c) => ({
            name: c.name,
            reflexive: c.references?.table === e.name,
          }))
        : []

    return {
      id: e.id,
      type: 'entity',
      position: e.position,
      selected: e.id === selectedId,
      measured: { width: 180, height: 60 },
      data: {
        id: e.id,
        label: e.name,
        viewMode,
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

  // En MLD, seules les associations N:N (ou avec attributs dans certains cas) restent sous forme de table.
  // En UML, on peut décider de cacher les nœuds d'association s'ils n'ont pas d'attributs.
  for (const a of project.associations) {
    const bothN = a.participants.length === 2 && a.participants.every((p) => p.cardinality.max === 'N')
    const hasAttributes = a.attributes.length > 0

    // Logique d'affichage du nœud d'association
    let shouldShow = true
    if (viewMode === 'MLD' && !bothN && !hasAttributes) {
      shouldShow = false
    }
    if (viewMode === 'UML' && !hasAttributes) {
      // Option : en UML, on préfère souvent les lignes directes.
      // Mais pour rester simple et éditable, on peut les garder ou les transformer.
      // Pour l'instant, gardons les pour permettre l'édition, mais on pourrait les masquer.
      // Looping les masque souvent en UML sauf si "classe-association".
    }

    if (!shouldShow) continue

    const position = a.position ?? associationMidpoint(a, byId)
    let columns: AssociationNodeData['columns']

    if (viewMode === 'MLD') {
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
        viewMode,
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
    viewMode: ViewMode
    onOpen: (associationId: string, participantIndex: number) => void
    onPick: (associationId: string, participantIndex: number, cardinality: Cardinality) => void
    onClose: () => void
    openTarget: { associationId: string; participantIndex: number } | null
  },
): Edge[] {
  const { viewMode } = opts
  const edges: Edge[] = []

  for (const association of project.associations) {
    const reflexive = isReflexive(association)
    const bothN = association.participants.length === 2 && association.participants.every((p) => p.cardinality.max === 'N')
    const hasAttributes = association.attributes.length > 0

    if (viewMode === 'MLD') {
      if (reflexive) {
        // Réflexive en MLD : l'entité a une FK auto-référentielle
        const entityId = association.participants[0].entityId
        edges.push({
          id: `mld-reflexive__${association.id}`,
          source: entityId,
          target: entityId,
          type: 'loop', // Changed to 'loop' for special path handling
          label: '',
          data: {
            associationId: association.id,
            participantIndex: 0,
            type: 'MLD',
            otherCardinality: null,
            isOpen: false,
            viewMode,
            onOpen: () => {},
            onPick: () => {},
            onClose: () => {},
          } satisfies AssocEdgeData,
          markerEnd: { type: 'arrowclosed' as any },
          sourceHandle: 'right',
          targetHandle: 'right',
        })
        continue
      }

      if (bothN) {
        // N:N en MLD : l'association devient une table de jointure, deux FK partent d'elle.
        const p1 = association.participants[0]
        const p2 = association.participants[1]

        if (p1) {
          edges.push({
            id: `mld__${association.id}__${p1.entityId}`,
            source: association.id,
            target: p1.entityId,
            type: 'assoc',
            label: '',
            data: {
              associationId: association.id,
              participantIndex: 0,
              type: 'MLD',
              otherCardinality: null,
              isOpen: false,
              viewMode,
              onOpen: () => {},
              onPick: () => {},
              onClose: () => {},
            } satisfies AssocEdgeData,
            markerEnd: { type: 'arrowclosed' as any },
          })
        }
        if (p2) {
          edges.push({
            id: `mld__${association.id}__${p2.entityId}`,
            source: association.id,
            target: p2.entityId,
            type: 'assoc',
            label: '',
            data: {
              associationId: association.id,
              participantIndex: 1,
              type: 'MLD',
              otherCardinality: null,
              isOpen: false,
              viewMode,
              onOpen: () => {},
              onPick: () => {},
              onClose: () => {},
            } satisfies AssocEdgeData,
            markerEnd: { type: 'arrowclosed' as any },
          })
        }
        continue
      }

      // 1:N en MLD : la FK migre. Arête directe entre les entités.
      if (!bothN && !hasAttributes) {
        const p1 = association.participants[0]
        const p2 = association.participants[1]

        if (p1 && p2) {
          const sourceId = p1.cardinality.max === 1 ? p1.entityId : p2.entityId
          const targetId = p1.cardinality.max === 1 ? p2.entityId : p1.entityId

          edges.push({
            id: `mld__${association.id}`,
            source: sourceId,
            target: targetId,
            type: 'assoc',
            label: '',
            data: {
              associationId: association.id,
              participantIndex: 0,
              type: 'MLD',
              otherCardinality: null,
              isOpen: false,
              viewMode,
              onOpen: () => {},
              onPick: () => {},
              onClose: () => {},
            } satisfies AssocEdgeData,
            markerEnd: { type: 'arrowclosed' as any },
          })
        }
        continue
      }
    }

    // Pour MCD et UML, ou MLD pour les N:N avec attributs (qui restent des pastilles)
    for (const [index, participant] of association.participants.entries()) {
      // Si réflexive, on ne dessine qu'une seule arête qui boucle sur l'entité.
      // La logique suivante gère les arêtes non-réflexives et les réflexives comme des boucles.
      if (reflexive && index === 1) continue // On ne dessine qu'une seule arête pour la réflexive.

      const fromPastille = index === 1 && !reflexive // Pour les réflexives, on veut que le handle soit toujours sur l'entité.
      const otherIndex = index === 0 ? 1 : 0
      const otherParticipant = association.participants[otherIndex]
      const isOpen =
        opts.openTarget?.associationId === association.id &&
        opts.openTarget?.participantIndex === index

      let label = cardinalityToString(participant.cardinality)
      if (viewMode === 'UML') {
        const min = participant.cardinality.min
        const max = participant.cardinality.max === 'N' ? '*' : participant.cardinality.max
        label = min === max ? `${min}` : `${min}..${max}`
      }

      edges.push({
        id: `${association.id}__${participant.entityId}__${index}`,
        source: reflexive ? participant.entityId : (fromPastille ? association.id : participant.entityId),
        target: reflexive ? participant.entityId : (fromPastille ? participant.entityId : association.id),
        sourceHandle: fromPastille ? 'right' : 'source',
        targetHandle: fromPastille ? 'target' : 'left',
        type: viewMode === 'MLD' ? 'assoc' : (reflexive ? 'loop' : 'assoc'), // Set type based on viewMode and reflexivity
        label: viewMode === 'MLD' ? '' : label,
        data: {
          associationId: association.id,
          participantIndex: index,
          type: label,
          otherCardinality: otherParticipant?.cardinality ?? null,
          isOpen,
          viewMode,
          onOpen: opts.onOpen,
          onPick: (c) => opts.onPick(association.id, index, c),
          onClose: opts.onClose,
        } satisfies AssocEdgeData,
        ...(viewMode === 'MLD' ? { markerEnd: { type: 'arrowclosed' as any } } : {}),
        ...(reflexive && viewMode !== 'MLD' && { type: 'loop', sourceHandle: 'right', targetHandle: 'right' } as any), // Only for non-MLD reflexive
      })
    }
  }
  return edges
}
