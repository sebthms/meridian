import { lazy, Suspense, useCallback, useState } from 'react'
import { useTheme } from '@/hooks/use-theme'
import { Canvas } from '@/components/canvas/Canvas'
import { Modal } from '@/components/ui/Modal'

const IssuesPanel = lazy(() =>
  import('@/components/issues/IssuesPanel').then(({ IssuesPanel }) => ({ default: IssuesPanel })),
)
const SqlPanel = lazy(() =>
  import('@/components/sql/SqlPanel').then(({ SqlPanel }) => ({ default: SqlPanel })),
)

type PanelView = 'issues' | 'sql'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<PanelView | null>(null)

  const close = useCallback(() => setView(null), [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="min-w-0 flex-1">
        <Canvas colorMode={theme} onToggleTheme={toggleTheme} onOpenModal={setView} />
      </main>

      <Modal open={view === 'issues'} onClose={close} title="Problèmes de validation">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          {view === 'issues' && <IssuesPanel />}
        </Suspense>
      </Modal>

      {view === 'sql' && (
        <Suspense fallback={null}>
          <SqlPanel onClose={close} />
        </Suspense>
      )}
    </div>
  )
}
