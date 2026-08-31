import { lazy, Suspense, useCallback, useState } from 'react'
import { useTheme } from '@/hooks/use-theme'
import { Canvas } from '@/components/canvas/Canvas'
import { Modal } from '@/components/ui/Modal'

const IssuesPanel = lazy(() =>
  import('@/components/issues/IssuesPanel').then(({ IssuesPanel }) => ({ default: IssuesPanel })),
)
const MldPanel = lazy(() =>
  import('@/components/mld/MldPanel').then(({ MldPanel }) => ({ default: MldPanel })),
)
const SqlPanel = lazy(() =>
  import('@/components/sql/SqlPanel').then(({ SqlPanel }) => ({ default: SqlPanel })),
)

type ModalView = 'issues' | 'mld' | 'sql'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<ModalView | null>(null)

  const close = useCallback(() => setView(null), [])

  const panel = (() => {
    if (view === 'issues') return <IssuesPanel />
    if (view === 'mld') return <MldPanel />
    if (view === 'sql') return <SqlPanel />
    return null
  })()

  const title = {
    issues: 'Problèmes de validation',
    mld: 'Modèle logique (MLD)',
    sql: 'SQL (PostgreSQL)',
  } satisfies Record<ModalView, string>

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="min-w-0 flex-1">
        <Canvas colorMode={theme} onToggleTheme={toggleTheme} onOpenModal={setView} />
      </main>

      <Modal open={view !== null} onClose={close} title={view ? title[view] : ''}>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          {panel}
        </Suspense>
      </Modal>
    </div>
  )
}
