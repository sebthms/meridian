import { KeyRound, TableProperties } from 'lucide-react'
import type { Attribute, Entity } from '@/domain/index'
import { treePropertyDetails } from '@/features/diagram/presentation/tree-property-details'
import { cn } from '@/shared/utils/cn';

export function TreeProperty({ attribute, entity }: { attribute: Attribute; entity?: Entity }) {
  const details = treePropertyDetails(attribute, entity)
  return (
    <div className="min-w-0 flex items-center gap-1.5 py-1.5 text-[11px]" aria-label={`Propriété ${attribute.name || 'Sans nom'}`}>
      {details.isIdentifier ? <KeyRound className="mt-0.5 h-3 w-3 shrink-0 text-warning" aria-label="Identifiant" /> : <TableProperties className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />}
      <span className={cn('min-w-0 break-words [overflow-wrap:anywhere]', details.isIdentifier ? 'text-warning' : 'text-foreground')}>{attribute.name || 'Sans nom'}</span>
      <span className="ml-auto break-words font-mono text-[10px] text-muted-foreground [overflow-wrap:anywhere]">{[details.type, ...details.qualifiers].join(' · ')}</span>
      {details.constraints.map((constraint) => <div key={constraint} className="flex items-center gap-1">
        <span className="text-[9px] text-muted-foreground">•</span>
        <span className="text-[9px] text-muted-foreground">{constraint}</span>
      
      </div>)}
    </div>
  )
}
