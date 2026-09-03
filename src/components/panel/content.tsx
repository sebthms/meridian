import { lazy, Suspense } from 'react'
import { RotateCcw } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { sidebarLayout } from '../../shared/layout/panel-layout'
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
}: {
  panelView: PanelView
  onClosePanel: () => void
  colorMode?: 'light' | 'dark'
  onToggleTheme?: () => void
}) {
  const resetIgnoredRules = useProjectStore((state) => state.resetIgnoredRules)
  const issues = useProjectStore((state) => state.issues)
  if (panelView === 'issues') {
    return (
      <div className={sidebarLayout.stack}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-xs text-destructive">
              {issues.filter((issue) => issue.severity === 'error').length} erreur{issues.filter((issue) => issue.severity === 'error').length > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-yellow-500">
              {issues.filter((issue) => issue.severity === 'warning').length} avertissement{issues.filter((issue) => issue.severity === 'warning').length > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-blue-500">
              {issues.filter((issue) => issue.severity === 'info').length} information{issues.filter((issue) => issue.severity === 'info').length > 1 ? 's' : ''}
            </span>
          </div>
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
  if (panelView === 'settings') return <SettingsPanel open variant="panel" embedded onClose={onClosePanel} />
  return null
}
