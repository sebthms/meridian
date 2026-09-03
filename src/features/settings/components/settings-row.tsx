import type { ReactNode } from 'react'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/utils/cn'

export const settingsFieldClass =
  'flex h-9 w-full items-center rounded-md border border-input bg-background text-sm shadow-sm transition-colors'

export function SettingsRow({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}
