import { MarkerType, type Edge } from '@xyflow/react'
import { isReflexive, cardinalityToString, normalizeProject, type Project, type ViewMode, type Cardinality } from '@/domain'
import { generateMld } from '@/mld'
import type { AssocEdgeData, ConceptualEdgeData } from './edge-types'

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
  const mld = viewMode === 'MLD' ? generateMld(project) : null

  for (const association of project.associations) {
    const reflexive = isReflexive(association)
    const bothN = association.participants.length === 2 && association.participants.every((p) => p.cardinality.max === 'N')
    const hasAssociativeTable =
      mld?.relations.some((relation) => relation.sourceId === association.id) ?? false

    if (viewMode === 'MLD') {
      if (hasAssociativeTable) {
        // Une table associative possède deux FK, y compris lorsqu'elles
        // référencent toutes les deux la même table (réflexive N:N).
        const p1 = association.participants[0]
        const p2 = association.participants[1]

        if (p1) {
          edges.push({
            id: `mld__${association.id}__${p1.entityId}__0`,
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
            markerEnd: { type: MarkerType.ArrowClosed },
            sourceHandle: reflexive ? 'reflexive-source-0' : 'right',
            targetHandle: reflexive ? 'reflexive-target-0' : 'target',
          })
        }
        if (p2) {
          edges.push({
            id: `mld__${association.id}__${p2.entityId}__1`,
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
            markerEnd: { type: MarkerType.ArrowClosed },
            sourceHandle: reflexive ? 'reflexive-source-1' : 'right',
            targetHandle: reflexive ? 'reflexive-target-1' : 'target',
          })
        }
        continue
      }

      if (reflexive) {
        // Sans table associative, la pastille disparaît et la FK migre dans
        // la table de l'entité sous la forme d'une autoréférence.
        const entityId = association.participants[0].entityId
        edges.push({
          id: `mld-reflexive__${association.id}`,
          source: entityId,
          target: entityId,
          type: 'loop',
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
          markerEnd: { type: MarkerType.ArrowClosed },
          sourceHandle: 'right',
          targetHandle: 'bottom',
        })
        continue
      }

      // 1:N en MLD : la FK migre. Arête directe entre les entités.
      if (!bothN) {
        const p1 = association.participants[0]
        const p2 = association.participants[1]

        if (p1 && p2) {
          // La FK migre vers le côté "1".
          // Source: entité qui reçoit la FK, Target: entité qui donne la PK.
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
            markerEnd: { type: MarkerType.ArrowClosed },
            sourceHandle: 'source',
            targetHandle: 'target',
          })
        }
        continue
      }
    }

    // Pour MCD et UML (ou MLD pour les N:N avec attributs qui restent des pastilles)
    for (const [index, participant] of association.participants.entries()) {
      // Une réflexive MERISE conserve deux branches : une pour chaque rôle et
      // cardinalité. La seconde part donc de la pastille comme une association
      // binaire classique, même si les deux participants sont la même entité.
      const fromPastille = index === 1
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
        source: fromPastille ? association.id : participant.entityId,
        target: fromPastille ? participant.entityId : association.id,
        sourceHandle: fromPastille
          ? reflexive
            ? 'reflexive-source-1'
            : 'right'
          : reflexive
            ? 'reflexive-source'
            : 'source',
        targetHandle: fromPastille
          ? reflexive
            ? 'reflexive-target-1'
            : 'target'
          : reflexive
            ? 'reflexive-target-0'
            : 'left',
        type: 'assoc',
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
        ...(viewMode === 'MLD' ? { markerEnd: { type: MarkerType.ArrowClosed } } : {}),
      })
    }
  }

  const conceptual = normalizeProject(project)
  for (const inheritance of conceptual.inheritances) {
    if (inheritance.parentEntityId) {
      edges.push({
        id: `inh__${inheritance.id}__parent`,
        source: inheritance.parentEntityId,
        target: inheritance.id,
        type: 'conceptual',
        data: { kind: 'inheritance' } satisfies ConceptualEdgeData,
      })
    }
    for (const childId of inheritance.childEntityIds) {
      edges.push({
        id: `inh__${inheritance.id}__${childId}`,
        source: inheritance.id,
        target: childId,
        type: 'conceptual',
        data: { kind: 'inheritance' } satisfies ConceptualEdgeData,
      })
    }
  }
  for (const constraint of conceptual.constraints) {
    for (const targetId of constraint.targetIds) {
      edges.push({
        id: `cst__${constraint.id}__${targetId}`,
        source: constraint.id,
        target: targetId,
        type: 'conceptual',
        data: { kind: 'constraint', dashed: true } satisfies ConceptualEdgeData,
      })
    }
  }
  for (const cif of conceptual.cifs) {
    if (cif.sourceEntityId) {
      edges.push({
        id: `cif__${cif.id}__source`,
        source: cif.sourceEntityId,
        target: cif.id,
        type: 'conceptual',
        data: { kind: 'cif' } satisfies ConceptualEdgeData,
      })
    }
    if (cif.targetEntityId) {
      edges.push({
        id: `cif__${cif.id}__target`,
        source: cif.id,
        target: cif.targetEntityId,
        type: 'conceptual',
        data: { kind: 'cif' } satisfies ConceptualEdgeData,
      })
    }
  }
  for (const rule of conceptual.businessRules) {
    for (const targetId of rule.targetIds) {
      edges.push({
        id: `br__${rule.id}__${targetId}`,
        source: rule.id,
        target: targetId,
        type: 'conceptual',
        data: { kind: 'businessRule', dashed: true } satisfies ConceptualEdgeData,
      })
    }
  }
  return edges
}
