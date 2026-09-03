import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import type { ConceptualEdgeData } from '@/features/diagram/flow/project-adapter'

const STROKE: Record<ConceptualEdgeData['kind'], string> = {
  inheritance: 'hsl(var(--primary))',
  constraint: 'hsl(var(--muted-foreground))',
  cif: 'hsl(var(--info-foreground))',
  businessRule: 'hsl(var(--muted-foreground))',
}

export default function ConceptualEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const conceptual = data as ConceptualEdgeData | undefined
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const kind = conceptual?.kind ?? 'constraint'
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        stroke: STROKE[kind],
        strokeWidth: kind === 'cif' || kind === 'inheritance' ? 1.75 : 1.25,
        strokeDasharray: conceptual?.dashed ? '6 4' : undefined,
      }}
    />
  )
}
