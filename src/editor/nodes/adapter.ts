import type { Edge, Node } from '@xyflow/react'
import type { Project } from '@/domain'
import {
  isIdentifierAttribute,
  isReflexive,
  associationMidpoint,
  cardinalityToString,
  inheritanceMark,
  CONSTRAINT_KIND_META,
  normalizeProject,
  type ConceptualType,
  type Cardinality,
  type InheritanceCoverage,
  type InheritanceExclusivity,
  type ModelConstraintKind,
  type BusinessRuleLevel,
} from '@/domain'
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
    nullable?: boolean
    unique?: boolean
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
    nullable?: boolean
    unique?: boolean
  }>
}

export type InheritanceNodeData = {
  id: string
  label: string
  viewMode: ViewMode
  parentLabel: string
  childLabels: string[]
  coverage: InheritanceCoverage
  exclusivity: InheritanceExclusivity
  mark: string
}

export type ConstraintNodeData = {
  id: string
  label: string
  viewMode: ViewMode
  kind: ModelConstraintKind
  mark: string
  kindLabel: string
  description: string
  targetLabels: string[]
}

export type CifNodeData = {
  id: string
  label: string
  viewMode: ViewMode
  sourceLabel: string
  targetLabel: string
  description: string
}

export type BusinessRuleNodeData = {
  id: string
  label: string
  viewMode: ViewMode
  description: string
  level: BusinessRuleLevel
  targetLabels: string[]
}

export type ConceptualEdgeData = {
  kind: 'inheritance' | 'constraint' | 'cif' | 'businessRule'
  dashed?: boolean
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
          nullable: a.nullable,
          unique: a.unique,
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
    const hasAttributes = a.attributes.length > 0
    const hasAssociativeTable = mld.relations.some((relation) => relation.sourceId === a.id)

    // Logique d'affichage du nœud d'association
    let shouldShow = true
    if (viewMode === 'MLD') shouldShow = hasAssociativeTable
    if (viewMode === 'UML' && !hasAttributes) {
      // Option : en UML, on préfère souvent les lignes directes.
      // Mais pour rester simple et éditable, on peut les garder ou les transformer.
      // Pour l'instant, gardons les pour permettre l'édition, mais on pourrait les masquer.
      // Looping les masque souvent en UML sauf si "classe-association".
    }

    if (!shouldShow) continue

    const defaultPosition = associationMidpoint(a, byId)
    const entityPosition = byId.get(a.participants[0]?.entityId ?? '')
    const storedPosition = a.position ?? defaultPosition
    // Les anciennes associations réflexives étaient créées exactement sur
    // l'entité, ce qui masquait la pastille et ses deux branches.
    const position =
      isReflexive(a) &&
      entityPosition &&
      Math.abs(storedPosition.x - entityPosition.x) < 40 &&
      Math.abs(storedPosition.y - entityPosition.y) < 40
        ? { x: entityPosition.x + 240, y: entityPosition.y + 80 }
        : storedPosition
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
          nullable: at.nullable,
          unique: at.unique,
        })),
      } satisfies AssociationNodeData,
    })
  }

  const conceptual = normalizeProject(project)
  const entityName = (id: string) => conceptual.entities.find((entity) => entity.id === id)?.name || ''
  const objectName = (id: string) =>
    conceptual.entities.find((entity) => entity.id === id)?.name
    || conceptual.associations.find((association) => association.id === id)?.name
    || conceptual.inheritances.find((item) => item.id === id)?.name
    || conceptual.constraints.find((item) => item.id === id)?.name
    || conceptual.cifs.find((item) => item.id === id)?.name
    || conceptual.businessRules.find((item) => item.id === id)?.name
    || ''

  const inheritanceNodes: Node[] = conceptual.inheritances.map((item) => ({
    id: item.id,
    type: 'inheritance',
    position: item.position,
    selected: item.id === selectedId,
    measured: { width: 88, height: 88 },
    data: {
      id: item.id,
      label: item.name,
      viewMode,
      parentLabel: entityName(item.parentEntityId),
      childLabels: item.childEntityIds.map(entityName).filter(Boolean),
      coverage: item.coverage,
      exclusivity: item.exclusivity,
      mark: inheritanceMark(item),
    } satisfies InheritanceNodeData,
  }))

  const constraintNodes: Node[] = conceptual.constraints.map((item) => ({
    id: item.id,
    type: 'constraint',
    position: item.position,
    selected: item.id === selectedId,
    measured: { width: 72, height: 72 },
    data: {
      id: item.id,
      label: item.name,
      viewMode,
      kind: item.kind,
      mark: CONSTRAINT_KIND_META[item.kind].mark,
      kindLabel: CONSTRAINT_KIND_META[item.kind].label,
      description: item.description,
      targetLabels: item.targetIds.map(objectName).filter(Boolean),
    } satisfies ConstraintNodeData,
  }))

  const cifNodes: Node[] = conceptual.cifs.map((item) => ({
    id: item.id,
    type: 'cif',
    position: item.position,
    selected: item.id === selectedId,
    measured: { width: 120, height: 56 },
    data: {
      id: item.id,
      label: item.name,
      viewMode,
      sourceLabel: entityName(item.sourceEntityId),
      targetLabel: entityName(item.targetEntityId),
      description: item.description,
    } satisfies CifNodeData,
  }))

  const businessRuleNodes: Node[] = conceptual.businessRules.map((item) => ({
    id: item.id,
    type: 'businessRule',
    position: item.position,
    selected: item.id === selectedId,
    measured: { width: 160, height: 72 },
    data: {
      id: item.id,
      label: item.name,
      viewMode,
      description: item.description,
      level: item.level,
      targetLabels: item.targetIds.map(objectName).filter(Boolean),
    } satisfies BusinessRuleNodeData,
  }))

  return [...entityNodes, ...associationNodes, ...inheritanceNodes, ...constraintNodes, ...cifNodes, ...businessRuleNodes]
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
            markerEnd: { type: 'arrowclosed' as any },
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
            markerEnd: { type: 'arrowclosed' as any },
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
          markerEnd: { type: 'arrowclosed' as any },
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
            markerEnd: { type: 'arrowclosed' as any },
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
        ...(viewMode === 'MLD' ? { markerEnd: { type: 'arrowclosed' as any } } : {}),
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
