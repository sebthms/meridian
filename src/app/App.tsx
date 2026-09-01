import { lazy, Suspense, useCallback, useState } from 'react'
import { useTheme } from '@/hooks/use-theme'
import { Canvas } from '@/components/canvas/Canvas'
import { SidePanel } from '@/components/ui/SidePanel'
import { ProjectManagerModal } from '@/components/projects/ProjectManagerModal'
import { useProjectStore } from '@/store/project-store'
import { RotateCcw } from 'lucide-react'
import { InfoPopover } from '@/components/ui/InfoPopover'

const IssuesPanel = lazy(() =>
  import('@/components/issues/IssuesPanel').then(({ IssuesPanel }) => ({ default: IssuesPanel })),
)
type PanelView = 'issues' | 'tree' | 'sql' | 'projects' | 'settings'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<PanelView | null>(null)
  const hasProjects = useProjectStore((state) => state.projects.length > 0)
  const resetIgnoredRules = useProjectStore((state) => state.resetIgnoredRules)

  const close = useCallback(() => setView(null), [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="min-w-0 flex-1">
        {hasProjects ? <Canvas colorMode={theme} onToggleTheme={toggleTheme} onOpenModal={setView} panelView={view === 'issues' ? null : view} onClosePanel={close} /> : <div className="h-full bg-background" />}
      </main>

      {view === 'issues' && <SidePanel title="Problèmes de validation" onClose={close} actions={<InfoPopover label="Réafficher les règles ignorées"><button type="button" aria-label="Réafficher les règles ignorées" onClick={resetIgnoredRules} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></button></InfoPopover>}><Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Chargement…</p>}><IssuesPanel /></Suspense></SidePanel>}

      {!hasProjects && <div className="fixed left-4 top-4 z-50"><ProjectManagerModal open panel onClose={() => undefined} /></div>}
    </div>
  )
}
