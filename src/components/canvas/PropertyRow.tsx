import { useState } from 'react'
import { BadgeCheck, CheckCircle2, CircleOff, KeyRound, Pencil, Trash2 } from 'lucide-react'
import type { ConceptualType } from '@/domain'
import { GenericPropertyIcon, TypeLabel } from './type-icon'

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
  const [constraintHelp, setConstraintHelp] = useState<'null' | 'unique' | null>(null)
  const nullLabel = nullable ? 'NULL autorisé' : 'NOT NULL — valeur obligatoire'
  const constraintLabel = constraintHelp === 'unique' ? 'Valeur unique' : nullLabel
  return (
    <div className="group/property relative flex min-h-8 items-center gap-2 px-2 text-xs transition-colors duration-200 ease-out hover:bg-accent/60">
      {isIdentifier ? (
        <KeyRound className="h-3 w-3 shrink-0 text-amber-500" aria-label="Identifiant" />
      ) : (
        <GenericPropertyIcon className="shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate">{name || '…'}</span>
      <TypeLabel type={type} />
      <span className="flex shrink-0 items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground" aria-label={`Nullable : ${nullable ? 'oui' : 'non'}${unique ? ', unique' : ''}`}>
        <button
          type="button"
          title={nullLabel}
          aria-label={nullLabel}
          aria-expanded={constraintHelp === 'null'}
          onClick={(event) => { event.stopPropagation(); setConstraintHelp((open) => open === 'null' ? null : 'null') }}
          className="nodrag nopan rounded p-0.5 transition-transform duration-150 hover:scale-110 hover:bg-background hover:text-foreground"
        >
          {nullable ? <CircleOff className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />}
        </button>
        {unique && (
          <button
            type="button"
            title="Valeur unique"
            aria-label="Valeur unique"
            aria-expanded={constraintHelp === 'unique'}
            onClick={(event) => { event.stopPropagation(); setConstraintHelp((open) => open === 'unique' ? null : 'unique') }}
            className="nodrag nopan rounded p-0.5 transition-transform duration-150 hover:scale-110 hover:bg-background hover:text-foreground"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
          </button>
        )}
      </span>
      {constraintHelp && (
        <div className="nodrag nopan absolute right-1 top-7 z-30 w-48 rounded-md border bg-popover p-2 text-[11px] normal-case tracking-normal text-popover-foreground shadow-xl">
          <p className="font-medium">{constraintLabel}</p>
          <p className="mt-0.5 text-muted-foreground">
            {constraintHelp === 'unique'
              ? 'Deux lignes ne peuvent pas avoir la même valeur.'
              : nullable ? 'La propriété peut rester vide.' : 'La propriété doit toujours avoir une valeur.'}
          </p>
        </div>
      )}
      <span className="flex max-w-0 -translate-x-1 items-center gap-0.5 overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover/property:max-w-14 group-hover/property:translate-x-0 group-hover/property:opacity-100">
        <button type="button" title="Modifier" onClick={(event) => { event.stopPropagation(); onEdit() }} className="nodrag nopan shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"><Pencil className="h-3 w-3" /></button>
        <button type="button" title="Supprimer" onClick={(event) => { event.stopPropagation(); setConfirming(true) }} className="nodrag nopan shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
      </span>
      {confirming && <div className="nodrag nopan absolute right-1 top-7 z-20 w-44 rounded-lg border bg-popover p-2 shadow-xl"><p className="mb-2 text-[11px]">Supprimer « {name} » ?</p><div className="flex justify-end gap-1"><button onClick={() => setConfirming(false)} className="rounded px-2 py-1 text-[10px] hover:bg-accent">Annuler</button><button onClick={onDelete} className="rounded bg-red-600 px-2 py-1 text-[10px] text-white">Supprimer</button></div></div>}
    </div>
  )
}
