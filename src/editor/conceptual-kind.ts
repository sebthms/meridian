export const CONCEPTUAL_KINDS = ['inheritance', 'constraint', 'cif', 'businessRule'] as const

export type ConceptualKind = (typeof CONCEPTUAL_KINDS)[number]

export function isConceptualKind(value: string | undefined): value is ConceptualKind {
  return CONCEPTUAL_KINDS.includes(value as ConceptualKind)
}
