import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { ConceptualNodeShell } from './conceptual-node-shell'
import { cn } from '@/lib/utils'
import type { InheritanceNodeData } from '@/editor/nodes/adapter'
import { inheritanceCoverageLabel, inheritanceExclusivityLabel } from '@/domain'

function InheritanceNode({ data, selected }: NodeProps) {
  const d = data as InheritanceNodeData

  return (
    <ConceptualNodeShell
      kind="inheritance"
      id={d.id}
      label={d.label || 'Héritage'}
      tooltip={`${inheritanceCoverageLabel(d.coverage)} · ${inheritanceExclusivityLabel(d.exclusivity)}`}
      editLabel="Modifier l’héritage"
      deleteLabel="Supprimer l’héritage"
    >
      <div
        className={cn(
          'flex h-[84px] w-[84px] rotate-45 flex-col items-center justify-center rounded-md border-2 bg-card text-center shadow-sm transition-[box-shadow,border-color] duration-200',
          selected ? 'border-primary shadow-lg ring-2 ring-primary/30' : 'border-primary/50',
        )}
      >
        <div className="-rotate-45 px-1">
          <p className="text-sm font-semibold tracking-wide text-foreground">{d.mark}</p>
          <p className="max-w-[64px] truncate text-[10px] text-muted-foreground">{d.label || 'Héritage'}</p>
        </div>
      </div>
    </ConceptualNodeShell>
  )
}

export default memo(InheritanceNode)
