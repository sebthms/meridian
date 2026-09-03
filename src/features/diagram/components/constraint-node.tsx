import { memo } from 'react'
import type { Node, NodeProps } from '@xyflow/react'
import { ConceptualNodeShell } from './conceptual-node-shell'
import { cn } from '@/shared/utils/cn'
import type { ConstraintNodeData } from '@/features/diagram/flow/project-adapter'

function ConstraintNode({ data: d, selected }: NodeProps<Node<ConstraintNodeData>>) {

  return (
    <ConceptualNodeShell
      kind="constraint"
      id={d.id}
      label={d.label || 'Contrainte'}
      tooltip={`${d.kindLabel}${d.description ? ` — ${d.description}` : ''}`}
      editLabel="Modifier la contrainte"
      deleteLabel="Supprimer la contrainte"
    >
      <div
        className={cn(
          'flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 bg-card text-center shadow-sm',
          selected ? 'border-primary shadow-lg ring-2 ring-primary/30' : 'border-muted-foreground/40',
        )}
      >
        <p className="text-sm font-semibold text-foreground">{d.mark}</p>
        <p className="max-w-[52px] truncate text-[9px] text-muted-foreground">{d.label || 'Contrainte'}</p>
      </div>
    </ConceptualNodeShell>
  )
}

export default memo(ConstraintNode)
