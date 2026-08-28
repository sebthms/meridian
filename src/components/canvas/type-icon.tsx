
import type { ConceptualType } from '@/domain'
import { Binary, Calendar, Hash, Percent, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<ConceptualType, typeof Type> = {
  TEXT: Type,
  INTEGER: Hash,
  DECIMAL: Percent,
  DATE: Calendar,
  BOOLEAN: Binary,
}

export function TypeIcon({
  type,
  className,
}: {
  type: ConceptualType
  className?: string
}) {
  const Icon = TYPE_ICON[type] ?? Type
  return <Icon className={cn('h-3 w-3 shrink-0', className)} aria-hidden />
}
