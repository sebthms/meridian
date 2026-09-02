import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './tooltip'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl',
          className,
        )}
      > 
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <TooltipProvider><Tooltip><TooltipTrigger><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <X className="h-4 w-4" aria-hidden />
            </button></TooltipTrigger><TooltipContent>Fermer</TooltipContent></Tooltip></TooltipProvider>
        </div>
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
