import { memo } from 'react'
import type { Node, NodeProps } from '@xyflow/react'
import { ScrollText } from 'lucide-react'
import { ConceptualNodeShell } from './conceptual-node-shell'
import { cn } from '@/shared/utils/cn'
import type { BusinessRuleNodeData } from '@/features/diagram/flow/project-adapter'
import { BUSINESS_RULE_LEVEL_LABEL } from '@/domain/index'

const LEVEL_BAR: Record<BusinessRuleNodeData['level'], string> = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  error: 'bg-destructive',
}

function BusinessRuleNode({ data: d, selected }: NodeProps<Node<BusinessRuleNodeData>>) {

  return (
    <ConceptualNodeShell
      kind="businessRule"
      id={d.id}
      label={d.label || 'Règle métier'}
      tooltip={`${BUSINESS_RULE_LEVEL_LABEL[d.level]}${d.description ? ` — ${d.description}` : ''}`}
      editLabel="Modifier la règle métier"
      deleteLabel="Supprimer la règle"
    >
      <div
        className={cn(
          'flex min-w-[168px] max-w-[220px] overflow-hidden rounded-lg border bg-card shadow-sm',
          selected ? 'border-primary shadow-lg ring-2 ring-primary/30' : 'border-border',
        )}
      >
        <span className={cn('w-1 shrink-0', LEVEL_BAR[d.level])} aria-hidden />
        <div className="min-w-0 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ScrollText className="h-3 w-3 shrink-0" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide">{BUSINESS_RULE_LEVEL_LABEL[d.level]}</span>
          </div>
          <p className="truncate text-xs font-medium text-foreground">{d.label || 'Règle métier'}</p>
          {d.description ? <p className="line-clamp-2 text-[10px] text-muted-foreground">{d.description}</p> : null}
        </div>
      </div>
    </ConceptualNodeShell>
  )
}

export default memo(BusinessRuleNode)
