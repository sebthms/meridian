import type { Node } from '@xyflow/react'
import { isIdentifierAttribute, isReflexive, associationMidpoint, inheritanceMark, CONSTRAINT_KIND_META, normalizeProject, type Project, type ViewMode } from '@/domain'
import { generateMld } from '@/mld'
import type { EntityNodeData, AssociationNodeData, InheritanceNodeData, ConstraintNodeData, CifNodeData, BusinessRuleNodeData } from './node-types'

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
