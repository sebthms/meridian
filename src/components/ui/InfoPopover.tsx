import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

/** Adaptateur historique vers le tooltip shadcn partagé par toute l’application. */
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
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="whitespace-nowrap text-[11px]">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
