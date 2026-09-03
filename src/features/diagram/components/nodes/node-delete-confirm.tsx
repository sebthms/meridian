import type { ReactNode } from 'react'
import { ConfirmPopover } from '@/shared/components/confirm-popover'

export function NodeDeleteConfirm({
  open,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean
  message: ReactNode
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="absolute right-1 top-8 z-40">
      <ConfirmPopover message={message} onCancel={onCancel} onConfirm={onConfirm} confirmLabel="Supprimer" />
    </div>
  )
}
