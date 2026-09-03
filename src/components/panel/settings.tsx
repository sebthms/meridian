import { Moon, Sun } from 'lucide-react'
import { PanelShell } from '@/components/panel/shell'
import { ClearProjectsButton } from '@/components/shared/clear-projects-button'
import { PaletteSelect } from '@/components/panel/palette-select'
import { useTheme } from '@/hooks/use-theme'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function SettingsPanel({
  open,
  onClose,
  variant = 'modal',
  embedded = false,
}: {
  open: boolean
  onClose: () => void
  variant?: 'modal' | 'panel'
  embedded?: boolean
}) {
  const { theme, palette, setPalette, toggleTheme } = useTheme()

  const content = (
    <section className="space-y-4">
      <div className="w-full space-y-2">
        <Label htmlFor="palette-select">Palette</Label>
        <PaletteSelect value={palette} onChange={setPalette} />
      </div>

      <div className="flex w-full flex-col space-y-2">
        <Label htmlFor="clear-projects-button">Vos données locales</Label>
        <ClearProjectsButton
          onCleared={onClose}
          popoverPosition="below"
          className="w-full rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
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
