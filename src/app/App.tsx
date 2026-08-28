import { useState } from 'react'
import { useTheme } from '@/hooks/use-theme'
import { Canvas } from '@/components/canvas/Canvas'
import { Modal } from '@/components/ui/Modal'
import { IssuesPanel } from '@/components/issues/IssuesPanel'
import { MldPanel } from '@/components/mld/MldPanel'
import { SqlPanel } from '@/components/sql/SqlPanel'

type ModalView = 'issues' | 'mld' | 'sql'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState<ModalView | null>(null)

  const close = () => setView(null)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="min-w-0 flex-1">
        <Canvas colorMode={theme} onToggleTheme={toggleTheme} onOpenModal={setView} />
      </main>

      <Modal open={view === 'issues'} onClose={close} title="Problèmes de validation">
        <IssuesPanel />
      </Modal>
      <Modal open={view === 'mld'} onClose={close} title="Modèle logique (MLD)">
        <MldPanel />
      </Modal>
      <Modal open={view === 'sql'} onClose={close} title="SQL (PostgreSQL)">
        <SqlPanel />
      </Modal>
    </div>
  )
}