import type { MouseEvent } from 'react'
import { BadgeCheck, CheckCircle2, CircleOff } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { cn } from '@/shared/utils/cn'

type PropertyConstraintIconsProps = {
  nullable?: boolean
  unique?: boolean
  className?: string
  iconClassName?: string
  stopPropagation?: boolean
}

export function PropertyConstraintIcons({
  nullable = false,
  unique = false,
  className,
  iconClassName = 'h-3.5 w-3.5',
  stopPropagation = false,
}: PropertyConstraintIconsProps) {
  const handleClick = stopPropagation
    ? (event: MouseEvent) => event.stopPropagation()
    : undefined

  const TriggerTag = stopPropagation ? 'button' : 'span'
  const triggerProps = stopPropagation ? { type: 'button' as const } : {}
  const nullClass = 'text-constraint-null'
  const requiredClass = 'text-constraint-required'
  const uniqueClass = 'text-constraint-unique'
  const triggerClassName = cn(
    'inline-flex',
    stopPropagation && 'nodrag nopan rounded p-0.5 transition-transform duration-150 hover:scale-110 hover:bg-background',
  )

  return (
    <span className={cn('flex shrink-0 items-center gap-1', className)} aria-label={`Nullable : ${nullable ? 'oui' : 'non'}${unique ? ', unique' : ''}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <TriggerTag
            {...triggerProps}
            aria-label={nullable ? 'NULL' : 'NOT NULL'}
            onClick={handleClick}
            className={cn(triggerClassName, nullable ? nullClass : requiredClass)}
          >
            {nullable ? (
              <CircleOff className={cn(iconClassName, 'stroke-current')} aria-hidden />
            ) : (
              <CheckCircle2 className={cn(iconClassName, 'stroke-current')} aria-hidden />
            )}
          </TriggerTag>
        </TooltipTrigger>
        <TooltipContent>{nullable ? 'NULL' : 'NOT NULL'}</TooltipContent>
      </Tooltip>
      {unique && (
        <Tooltip>
          <TooltipTrigger asChild>
            <TriggerTag
              {...triggerProps}
              aria-label="Valeur unique"
              onClick={handleClick}
              className={cn(triggerClassName, uniqueClass)}
            >
              <BadgeCheck className={cn(iconClassName, 'stroke-current')} aria-hidden />
            </TriggerTag>
          </TooltipTrigger>
          <TooltipContent>Valeur unique</TooltipContent>
        </Tooltip>
      )}
    </span>
  )
}
