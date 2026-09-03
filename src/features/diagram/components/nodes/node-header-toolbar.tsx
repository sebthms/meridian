import { Plus, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

export function NodeHeaderToolbar({
  onAddProperty,
  addLabel,
  onDeleteRequest,
  deleteLabel,
}: {
  onAddProperty: () => void
  addLabel: string
  onDeleteRequest: () => void
  deleteLabel: string
}) {
  return (
    <span className="flex max-w-0 -translate-x-1 items-center gap-0.5 overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover/header:max-w-14 group-hover/header:translate-x-0 group-hover/header:opacity-100">
      <Tooltip><TooltipTrigger asChild><button
        type="button"
        onClick={(event) => { event.stopPropagation(); onAddProperty() }}
        className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={addLabel}
      >
        <Plus className="h-3.5 w-3.5" />
      </button></TooltipTrigger><TooltipContent>{addLabel}</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild><button
        type="button"
        onClick={(event) => { event.stopPropagation(); onDeleteRequest() }}
        className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
        aria-label={deleteLabel}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button></TooltipTrigger><TooltipContent>{deleteLabel}</TooltipContent></Tooltip>
    </span>
  )
}
