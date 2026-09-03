import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover'
import { cn } from '@/shared/utils/cn'

const iconButtonClass =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'

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
      <PopoverAnchor asChild>
        <span className="absolute inset-0" aria-hidden />
      </PopoverAnchor>
      <PopoverContent
        side="top"
        align="end"
        className="w-auto p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <p className="whitespace-nowrap text-xs leading-none text-foreground">{children ?? message}</p>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label="Annuler"
              onClick={onCancel}
              className={cn(iconButtonClass, 'text-muted-foreground hover:bg-accent hover:text-foreground')}
            >
              <X className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={confirmLabel}
              onClick={onConfirm}
              className={cn(iconButtonClass, 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            >
              <Check className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
