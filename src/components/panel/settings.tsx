import { Moon, Sun } from 'lucide-react'
import { PanelShell } from '@/components/panel/shell'
import { ClearProjectsButton } from '@/components/shared/clear-projects-button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function SettingsPanel({
  open,
  onClose,
  colorMode,
  onToggleTheme,
  variant = 'modal',
  embedded = false,
}: {
  open: boolean
  onClose: () => void
  colorMode: 'light' | 'dark'
  onToggleTheme: () => void
  variant?: 'modal' | 'panel'
  embedded?: boolean
}) {
  const content = (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Thème</p>
        <Tooltip><TooltipTrigger asChild><button type="button" aria-label={colorMode === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} onClick={onToggleTheme} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">{colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></TooltipTrigger><TooltipContent>{colorMode === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}</TooltipContent></Tooltip>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Vider les données ?</p>
        <ClearProjectsButton
          onCleared={onClose}
          popoverPosition="below"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
        />
      </div>
    </section>
  )

  return (
    <PanelShell
      open={open}
      onClose={onClose}
      ariaLabel="Paramètres"
      title="Paramètres"
      variant={variant}
      embedded={embedded}
      modalClassName="max-w-md"
      panelClassName="w-80"
    >
      {content}
    </PanelShell>
  )
}
