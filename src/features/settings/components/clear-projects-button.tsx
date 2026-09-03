import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmPopover } from '@/shared/components/confirm-popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { useProjectStore } from '@/store/project-store'
import { cn } from '@/shared/utils/cn'

export function ClearProjectsButton({ onCleared, className, popoverPosition = 'above' }: { onCleared?: () => void; className?: string; popoverPosition?: 'above' | 'below' }) {
  const projects = useProjectStore((state) => state.projects)
  const clearAllProjects = useProjectStore((state) => state.clearAllProjects)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="relative flex w-full items-center gap-6">
      <div className="text-xs text-muted-foreground">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Supprimer les diagrammes ?</span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="Vider les données locales" onClick={() => setConfirming((value) => !value)} disabled={projects.length === 0} className={cn('text-destructive', className)}>
            <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Vider les données locales</TooltipContent>
      </Tooltip>
      {confirming && (
        <div className={popoverPosition === 'below' ? 'absolute left-0 top-9 z-50 w-64' : 'absolute bottom-11 left-0 z-50 w-64'}>
          <ConfirmPopover
            message="Vider tous les diagrammes ?"
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              clearAllProjects()
              setConfirming(false)
              onCleared?.()
            }}
          />
        </div>
      )}
    </div>
  )
}
