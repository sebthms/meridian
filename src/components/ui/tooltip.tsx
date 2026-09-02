import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

type ContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
type TooltipDefaults = Pick<ContentProps, 'side' | 'align' | 'sideOffset' | 'className'>
const TooltipDefaultsContext = React.createContext<TooltipDefaults>({})

/** One provider for the app. Position, delay and appearance can be overridden globally. */
function TooltipProvider({ children, delayDuration = 300, contentProps = {}, ...props }:
  React.ComponentProps<typeof TooltipPrimitive.Provider> & { contentProps?: TooltipDefaults }) {
  return (
    <TooltipDefaultsContext.Provider value={contentProps}>
      <TooltipPrimitive.Provider delayDuration={delayDuration} {...props}>{children}</TooltipPrimitive.Provider>
    </TooltipDefaultsContext.Provider>
  )
}

const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, ContentProps>(
  ({ className, sideOffset, ...props }, ref) => {
    const defaults = React.useContext(TooltipDefaultsContext)
    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          data-slot="tooltip-content"
          side={defaults.side}
          align={defaults.align}
          sideOffset={sideOffset ?? defaults.sideOffset ?? 4}
          collisionPadding={8}
          className={cn(
            'z-[200] w-fit max-w-[min(20rem,calc(100vw-1rem))] rounded-md bg-foreground px-3 py-1.5 text-xs text-background break-words',
            defaults.className,
            className,
          )}
          {...props}
        />
      </TooltipPrimitive.Portal>
    )
  },
)
TooltipContent.displayName = 'TooltipContent'

/** Composition keeping the child's click handlers and accessible name. */
function AppTooltip({ children, content, delayDuration, ...props }: Omit<ContentProps, 'children' | 'content'> & {
  children: React.ReactElement
  content: React.ReactNode
  delayDuration?: number
}) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        {React.isValidElement<{ disabled?: boolean }>(children) && children.props.disabled ? <span tabIndex={0} className="inline-flex">{children}</span> : children}
      </TooltipTrigger>
      <TooltipContent {...props}>{content}</TooltipContent>
    </Tooltip>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, AppTooltip }
