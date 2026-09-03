import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/shared/modal'

type PanelShellProps = {
  open: boolean
  onClose: () => void
  ariaLabel: string
  title?: string
  variant: 'modal' | 'panel'
  embedded?: boolean
  modalClassName?: string
  panelClassName?: string
  children: ReactNode
}

export function PanelShell({
  open,
  onClose,
  ariaLabel,
  title,
  variant,
  embedded = false,
  modalClassName,
  panelClassName,
  children,
}: PanelShellProps) {
  if (!open) return null

  if (variant === 'modal') {
    return (
      <Modal open onClose={onClose} title={title ?? ariaLabel} className={modalClassName}>
        {children}
      </Modal>
    )
  }

  return (
    <aside
      className={cn(
        'relative z-50 w-full',
        !embedded && 'rounded-xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur',
        panelClassName,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </aside>
  )
}
