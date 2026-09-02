import { lazy, Suspense } from 'react'
import { RotateCcw } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PanelView } from './view'
import { ProjectTreePanel } from './project-tree'
import { ProjectManagerPanel } from './project-manager'
import { SettingsPanel } from './settings'
import { SqlPanel } from './sql'

const IssuesPanel = lazy(() =>
  import('./issues').then(({ IssuesPanel }) => ({ default: IssuesPanel })),
)

export function PanelContent({
  panelView,
  onClosePanel,
  colorMode,
  onToggleTheme,
}: {
  panelView: PanelView
  onClosePanel: () => void
  colorMode: 'light' | 'dark'
  onToggleTheme: () => void
}) {
  const resetIgnoredRules = useProjectStore((state) => state.resetIgnoredRules)

  if (panelView === 'issues') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-end px-4 pb-2 pt-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Réafficher les règles ignorées" onClick={resetIgnoredRules} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Réafficher les règles ignorées</TooltipContent>
          </Tooltip>
        </div>
        <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Chargement…</p>}>
          <IssuesPanel />
        </Suspense>
      </div>
    )
  }

  if (panelView === 'tree') return <ProjectTreePanel embedded />
  if (panelView === 'projects') return <ProjectManagerPanel open variant="panel" embedded onClose={onClosePanel} />
  if (panelView === 'sql') return <SqlPanel />
  if (panelView === 'settings') return <SettingsPanel open variant="panel" embedded onClose={onClosePanel} colorMode={colorMode} onToggleTheme={onToggleTheme} />
  return null
}
