import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { InfoPopover } from './InfoPopover'
import { Popover, PopoverAnchor, PopoverContent } from './popover'

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
          <InfoPopover label="Annuler"><button type="button" aria-label="Annuler" onClick={onCancel} className="rounded p-1.5 hover:bg-accent"><X className="h-3.5 w-3.5" /></button></InfoPopover>
          <InfoPopover label={confirmLabel}><button type="button" aria-label={confirmLabel} onClick={onConfirm} className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700"><Check className="h-3.5 w-3.5" /></button></InfoPopover>
        </div>
      </PopoverContent>
    </Popover>
  )
}
