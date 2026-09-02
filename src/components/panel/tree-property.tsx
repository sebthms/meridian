import { KeyRound, TableProperties } from 'lucide-react'
import type { Attribute, Entity } from '@/domain'
import { cn } from '@/lib/utils'
import { treePropertyDetails } from '@/domain/tree-property'

export function TreeProperty({ attribute, entity }: { attribute: Attribute; entity?: Entity }) {
  const details = treePropertyDetails(attribute, entity)
  return (
    <div className="min-w-0 space-y-1 py-1.5 text-[11px]" aria-label={`Propriété ${attribute.name || 'Sans nom'}`}>
      <div className={cn('flex items-start gap-1.5', details.isIdentifier ? 'text-warning' : 'text-foreground')}>
        {details.isIdentifier ? <KeyRound className="mt-0.5 h-3 w-3 shrink-0" aria-label="Identifiant" /> : <TableProperties className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />}
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{attribute.name || 'Sans nom'}</span>
      </div>
      <div className="ml-[18px] space-y-1">
        <p className="break-words font-mono text-[10px] text-muted-foreground [overflow-wrap:anywhere]">{[details.type, ...details.qualifiers].join(' · ')}</p>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground" aria-label="Contraintes">
          {details.constraints.map((constraint) => <span key={constraint}>{constraint}</span>)}
        </div>
      </div>
    </div>
  )
}
