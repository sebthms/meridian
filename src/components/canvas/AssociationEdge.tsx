import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import type { AssocEdgeData } from '@/editor/nodes/adapter'
import { CardinalityPopover } from './CardinalityPopover'

/**
 * Arête d'association : affiche le type (1:N, N:N, 1:1, réflexive) comme
 * étiquette cliquable qui ouvre le popover de changement de cardinalité.
 * Le popover est rendu dans l'arête afin de suivre le déplacement des nœuds.
 */
function AssociationEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  } = props
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  const d = data as AssocEdgeData

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <button
          type="button"
          onClick={() => d.onOpen(d.associationId, d.participantIndex)}
          className="nodrag nopan absolute rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          title="Changer la cardinalité de cette extrémité"
        >
          {d.type}
        </button>
        {d.isOpen && (
          <CardinalityPopover
            associationId={d.associationId}
            participantIndex={d.participantIndex}
            anchor={{ x: labelX, y: labelY }}
            onPick={d.onPick}
            onClose={d.onClose}
          />
        )}
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(AssociationEdge)
