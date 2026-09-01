import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Infobulle accessible, affichée au survol et au focus du contrôle. */
export function InfoPopover({
  label,
  children,
  side = 'top',
}: {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom'
}) {
  return (
    <span className="group/info relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-[70] w-max max-w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-[11px] font-normal text-popover-foreground opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100',
          side === 'top'
            ? 'bottom-full mb-2 translate-y-1 group-hover/info:translate-y-0 group-focus-within/info:translate-y-0'
            : 'top-full mt-2 -translate-y-1 group-hover/info:translate-y-0 group-focus-within/info:translate-y-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}
