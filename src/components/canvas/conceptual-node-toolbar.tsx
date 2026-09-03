import { Pencil, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ConceptualNodeToolbar({
  onEdit,
  editLabel,
  onDeleteRequest,
  deleteLabel,
}: {
  onEdit: () => void
  editLabel: string
  onDeleteRequest: () => void
  deleteLabel: string
}) {
  return (
    <span className="absolute -right-1 -top-1 z-10 flex max-w-0 items-center gap-0.5 overflow-hidden rounded-md bg-card/95 opacity-0 shadow-sm transition-[max-width,opacity] duration-200 group-hover:max-w-16 group-hover:opacity-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onEdit() }}
            className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={editLabel}
          >
            <Pencil className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{editLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onDeleteRequest() }}
            className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            aria-label={deleteLabel}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{deleteLabel}</TooltipContent>
      </Tooltip>
    </span>
  )
}
