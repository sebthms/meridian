import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmPopover } from '@/components/shared/confirm-popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useProjectStore } from '@/store/project-store'
import { Label } from '../ui/label'
import { cn } from '@/lib/utils'

export function ClearProjectsButton({ onCleared, className, popoverPosition = 'above' }: { onCleared?: () => void; className?: string; popoverPosition?: 'above' | 'below' }) {
  const projects = useProjectStore((state) => state.projects)
  const clearAllProjects = useProjectStore((state) => state.clearAllProjects)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="relative flex w-full justify-between gap-1">
       <div className="text-xs text-muted-foreground">
              <span className="text-xs text-muted-foreground">Supprimer les diagrammes ?</span>
            </div>
            <div className="pr-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Vider les données locales"
            onClick={() => setConfirming((value) => !value)}
            disabled={projects.length === 0}
            className={cn('text-destructive', className)}
          >
           
            <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Vider les données locales</TooltipContent>
      </Tooltip>
      </div>
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
