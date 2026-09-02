import { Check, X } from 'lucide-react'
import { isValidModelName, modelNameError } from '@/domain'
import type { RenameState } from '@/hooks/use-rename'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function NodeRenameField({
  rename,
  label,
  emptyLabel,
  inputWidth = 'w-28',
  displayClassName,
}: {
  rename: RenameState
  label: string
  emptyLabel: string
  inputWidth?: string
  displayClassName?: string
}) {
  if (rename.editing) {
    return (
      <span className="flex items-center gap-1">
        <div className="flex flex-col gap-0.5">
          <input
            ref={rename.inputRef}
            value={rename.draft}
            onChange={(event) => rename.setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') rename.commit()
              if (event.key === 'Escape') rename.cancel()
            }}
            className={cn('nodrag nopan rounded-md border border-border bg-background px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary', inputWidth)}
            placeholder={emptyLabel}
            pattern="[A-Za-z_][A-Za-z0-9_]*"
          />
          {rename.draft.trim() && !isValidModelName(rename.draft.trim()) && (
            <span className="max-w-40 text-[9px] font-normal text-destructive">{modelNameError('Le nom')}</span>
          )}
        </div>
        <Tooltip><TooltipTrigger asChild><button type="button" onClick={rename.commit} className="nodrag nopan rounded p-0.5 text-success hover:bg-accent" aria-label="Valider"><Check className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>Valider</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><button type="button" onClick={rename.cancel} className="nodrag nopan rounded p-0.5 text-muted-foreground hover:bg-accent" aria-label="Annuler"><X className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>Annuler</TooltipContent></Tooltip>
      </span>
    )
  }

  return (
    <span
      onDoubleClick={(event) => { event.stopPropagation(); rename.start() }}
      aria-label="Double-cliquer pour renommer"
      className={cn('cursor-text truncate', displayClassName)}
    >
      {label || emptyLabel}
    </span>
  )
}
