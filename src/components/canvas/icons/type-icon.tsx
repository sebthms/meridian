import type { ConceptualType } from '@/domain'
import { Binary, Calendar, Hash, Percent, TableProperties, Type } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

const TYPE_ICON: Record<ConceptualType, typeof Type> = {
  TEXT: Type,
  INTEGER: Hash,
  DECIMAL: Percent,
  DATE: Calendar,
  BOOLEAN: Binary,
}

const TYPE_LABEL: Record<ConceptualType, string> = {
  TEXT: 'Texte',
  INTEGER: 'Entier',
  DECIMAL: 'Décimal',
  DATE: 'Date',
  BOOLEAN: 'Booléen',
}

export function TypeIcon({ type, className }: { type: ConceptualType; className?: string }) {
  const Icon = TYPE_ICON[type] ?? Type
  return <Icon className={cn('h-3 w-3 shrink-0', className)} aria-hidden />
}

export function TypeLabel({ type, className }: { type: ConceptualType; className?: string }) {
  return (
    <span className={cn('shrink-0 text-[9px] uppercase tracking-wide text-muted-foreground', className)}>
      {TYPE_LABEL[type] ?? type}
    </span>
  )
}

export function GenericPropertyIcon({ className }: { className?: string }) {
  return <TableProperties className={cn('h-3 w-3 shrink-0 text-muted-foreground', className)} aria-hidden />
}
