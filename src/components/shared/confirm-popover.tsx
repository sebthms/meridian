import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ConfirmPopover({
  message,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirmer',
  children,
}: {
  message: ReactNode
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  children?: ReactNode
}) {
  return (
    <Popover open>
      <PopoverAnchor asChild><span className="absolute inset-0" aria-hidden /></PopoverAnchor>
      <PopoverContent side="top" align="end" className="w-56 p-2 text-xs" onOpenAutoFocus={(event) => event.preventDefault()}>
        {children ?? <p>{message}</p>}
        <div className="mt-2 flex justify-end gap-1">
          <Tooltip><TooltipTrigger asChild><button type="button" aria-label="Annuler" onClick={onCancel} className="rounded p-1.5 hover:bg-accent"><X className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>Annuler</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button type="button" aria-label={confirmLabel} onClick={onConfirm} className="rounded bg-destructive p-1.5 text-destructive-foreground hover:bg-destructive/90"><Check className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>{confirmLabel}</TooltipContent></Tooltip>
        </div>
      </PopoverContent>
    </Popover>
  )
}
