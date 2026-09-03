import type { Cardinality, ViewMode } from '@/domain'

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
