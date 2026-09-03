import { memo } from 'react'
import type { Node, NodeProps } from '@xyflow/react'
import { ArrowRightLeft } from 'lucide-react'
import { ConceptualNodeShell } from './conceptual-node-shell'
import { cn } from '@/shared/utils/cn'
import type { CifNodeData } from '@/features/diagram/flow/project-adapter'

function CifNode({ data: d, selected }: NodeProps<Node<CifNodeData>>) {
  const path = [d.sourceLabel || '…', d.targetLabel || '…'].join(' → ')

  return (
    <ConceptualNodeShell
      kind="cif"
      id={d.id}
      label={d.label || 'CIF'}
      tooltip={d.description ? `${path} — ${d.description}` : path}
      editLabel="Modifier la CIF"
      deleteLabel="Supprimer la CIF"
    >
      <div
        className={cn(
          'flex min-w-[118px] items-center gap-2 rounded-lg border-2 bg-card px-2.5 py-1.5 shadow-sm',
          selected ? 'border-primary shadow-lg ring-2 ring-primary/30' : 'border-border',
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">CIF</p>
          <p className="truncate text-xs font-medium text-foreground">{d.label || 'CIF'}</p>
        </div>
      </div>
    </ConceptualNodeShell>
  )
}

export default memo(CifNode)
