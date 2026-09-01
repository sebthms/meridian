import { useState } from 'react'
import { BadgeCheck, CheckCircle2, CircleOff, KeyRound, Pencil, Trash2 } from 'lucide-react'
import type { ConceptualType } from '@/domain'
import { GenericPropertyIcon, TypeLabel } from './type-icon'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { ConfirmPopover } from '@/components/ui/ConfirmPopover'

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
        <KeyRound className="h-3 w-3 shrink-0 text-amber-500" aria-label="Identifiant" />
      ) : (
        <GenericPropertyIcon className="shrink-0" />
      )}
      <span className={isIdentifier ? 'min-w-0 flex-1 truncate text-amber-600 dark:text-amber-400' : 'min-w-0 flex-1 truncate'}>{name || '…'}</span>
      <TypeLabel type={type} />
      <span className="flex shrink-0 items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground" aria-label={`Nullable : ${nullable ? 'oui' : 'non'}${unique ? ', unique' : ''}`}>
        <InfoPopover label={nullable ? 'NULL' : 'NOT NULL'}>
          <button type="button" aria-label={nullable ? 'NULL' : 'NOT NULL'} onClick={(event) => event.stopPropagation()} className="nodrag nopan rounded p-0.5 transition-transform duration-150 hover:scale-110 hover:bg-background hover:text-foreground">
            {nullable ? <CircleOff className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />}
          </button>
        </InfoPopover>
        {unique && (
          <InfoPopover label="UNIQUE : chaque valeur doit être différente.">
            <button type="button" aria-label="Valeur unique" onClick={(event) => event.stopPropagation()} className="nodrag nopan rounded p-0.5 transition-transform duration-150 hover:scale-110 hover:bg-background hover:text-foreground">
              <BadgeCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
            </button>
          </InfoPopover>
        )}
      </span>
      <span className="flex max-w-0 -translate-x-1 items-center gap-0.5 overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover/property:max-w-14 group-hover/property:translate-x-0 group-hover/property:opacity-100">
        <InfoPopover label="Modifier"><button type="button" aria-label="Modifier" onClick={(event) => { event.stopPropagation(); onEdit() }} className="nodrag nopan shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"><Pencil className="h-3 w-3" /></button></InfoPopover>
        <InfoPopover label="Supprimer"><button type="button" aria-label="Supprimer" onClick={(event) => { event.stopPropagation(); setConfirming(true) }} className="nodrag nopan shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-3 w-3" /></button></InfoPopover>
      </span>
      {confirming && <div className="nodrag nopan absolute right-1 top-7 z-20 w-44 text-[11px]"><ConfirmPopover message={<>Supprimer « {name} » ?</>} onCancel={() => setConfirming(false)} onConfirm={onDelete} confirmLabel="Supprimer" /></div>}
    </div>
  )
}
