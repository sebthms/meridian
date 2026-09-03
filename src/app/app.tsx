import { useCallback, useState } from 'react'
import { useTheme } from '@/shared/theme/use-theme'
import { Canvas } from '@/components/canvas/canvas'
import { ProjectManagerPanel } from '@/components/panel/index'
import type { PanelView } from '@/components/panel/index'
import { useProjectStore } from '@/store/project-store'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [panelView, setPanelView] = useState<PanelView | null>(null)
  const hasProjects = useProjectStore((state) => state.projects.length > 0)
  const closePanel = useCallback(() => setPanelView(null), [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="min-w-0 flex-1">
        {hasProjects ? (
          <Canvas
            colorMode={theme}
            onToggleTheme={toggleTheme}
            onOpenPanel={setPanelView}
            panelView={panelView}
            onClosePanel={closePanel}
          />
        ) : (
          <div className="h-full bg-background" />
        )}
      </main>

      {!hasProjects && (
        <div className="fixed left-4 top-4 z-50">
          <ProjectManagerPanel open variant="panel" onClose={() => undefined} />
        </div>
      )}
    </div>
  )
}
