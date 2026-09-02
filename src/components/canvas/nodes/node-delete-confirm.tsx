import type { ReactNode } from 'react'
import { ConfirmPopover } from '@/components/shared/confirm-popover'

export function NodeDeleteConfirm({
  open,
  message,
  onCancel,
  onConfirm,
  widthClass = 'w-52',
}: {
  open: boolean
  message: ReactNode
  onCancel: () => void
  onConfirm: () => void
  widthClass?: string
}) {
  if (!open) return null
  return (
    <div className={`absolute right-1 top-8 z-40 ${widthClass}`}>
      <ConfirmPopover message={message} onCancel={onCancel} onConfirm={onConfirm} confirmLabel="Supprimer" />
    </div>
  )
}
