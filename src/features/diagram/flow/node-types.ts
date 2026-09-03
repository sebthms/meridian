import type { ConceptualType, ViewMode, InheritanceCoverage, InheritanceExclusivity, ModelConstraintKind, BusinessRuleLevel } from '@/domain'

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
