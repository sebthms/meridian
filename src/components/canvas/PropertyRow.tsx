import { useState } from 'react'
import { KeyRound, Pencil, Trash2 } from 'lucide-react'
import type { ConceptualType } from '@/domain'
import { GenericPropertyIcon, TypeLabel } from '@/components/canvas/icons/type-icon'
import { PropertyConstraintIcons } from '@/components/canvas/property-constraint-icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmPopover } from '@/components/shared/confirm-popover'

export function PropertyRow({ name, type, isIdentifier = false, nullable = false, unique = false, onEdit, onDelete }: {
  name: string
  type: ConceptualType
  isIdentifier?: boolean
  nullable?: boolean
  unique?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="group/property relative flex min-h-8 items-center gap-2 px-2 text-xs transition-colors duration-200 ease-out hover:bg-accent/60">
      {isIdentifier ? (
        <KeyRound className="h-3 w-3 shrink-0 text-warning" aria-label="Identifiant" />
      ) : (
        <GenericPropertyIcon className="shrink-0" />
      )}
      <span className={isIdentifier ? 'min-w-0 flex-1 truncate text-warning' : 'min-w-0 flex-1 truncate'}>{name || '…'}</span>
      <TypeLabel type={type} />
      <PropertyConstraintIcons nullable={nullable} unique={unique} stopPropagation />
      <span className="flex max-w-0 -translate-x-1 items-center gap-0.5 overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover/property:max-w-14 group-hover/property:translate-x-0 group-hover/property:opacity-100">
          <Tooltip><TooltipTrigger asChild><button type="button" aria-label="Modifier" onClick={(event) => { event.stopPropagation(); onEdit() }} className="nodrag nopan shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"><Pencil className="h-3 w-3" /></button></TooltipTrigger><TooltipContent>Modifier</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><button type="button" aria-label="Supprimer" onClick={(event) => { event.stopPropagation(); setConfirming(true) }} className="nodrag nopan shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
      </span>
      {confirming && <div className="nodrag nopan absolute right-1 top-7 z-20 w-44 text-[11px]"><ConfirmPopover message={<>Supprimer « {name} » ?</>} onCancel={() => setConfirming(false)} onConfirm={onDelete} confirmLabel="Supprimer" /></div>}
    </div>
  )
}
