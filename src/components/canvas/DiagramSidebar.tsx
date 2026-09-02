import {
  AlertCircle,
  ChevronLeft,
  Database,
  FolderOpen,
  ListTree,
  Moon,
  Network,
  PanelLeftOpen,
  Settings,
  Sun,
} from 'lucide-react'
import { type PointerEvent as ReactPointerEvent } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { AppTooltip, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ClearProjectsButton } from '@/components/shared/clear-projects-button'
import { useProjectStore } from '@/store/project-store'
import { PanelContent, type PanelView } from '@/components/panel'
import { cn } from '@/lib/utils'

const navigation: Array<{ id: PanelView; label: string; description: string; icon: typeof FolderOpen }> = [
  { id: 'issues', label: 'Validation', description: 'Problèmes et avertissements', icon: AlertCircle },
  { id: 'projects', label: 'Diagrammes', description: 'Gérer vos modèles', icon: FolderOpen },
  { id: 'tree', label: 'Arborescence', description: 'Entités et associations', icon: ListTree },
  { id: 'sql', label: 'Script SQL', description: 'Prévisualiser et exporter', icon: Database },
  { id: 'settings', label: 'Paramètres', description: 'Thème et données locales', icon: Settings },
]

export function DiagramSidebar({
  panelView,
  onOpenPanel,
  onClosePanel,
  colorMode,
  onToggleTheme,
  width,
  onWidthChange,
}: {
  panelView?: PanelView | null
  onOpenPanel: (view: PanelView) => void
  onClosePanel: () => void
  colorMode: 'light' | 'dark'
  onToggleTheme: () => void
  width: number
  onWidthChange: (width: number) => void
}) {
  const project = useProjectStore((state) => state.project)
  const issues = useProjectStore((state) => state.issues)
  const { open, isMobile } = useSidebar()

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startWidth = width
    const onMove = (moveEvent: PointerEvent) => {
      onWidthChange(Math.min(560, Math.max(320, startWidth + moveEvent.clientX - startX)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  const selectPanel = (view: PanelView) => {
    if (panelView === view) onClosePanel()
    else onOpenPanel(view)
  }

  const hasErrors = issues.some((issue) => issue.severity === 'error')
  const hasWarnings = issues.some((issue) => issue.severity === 'warning')

  return (
    <>
      <Sidebar
        side="left"
        collapsible="offcanvas"
        variant="floating"
        className="pointer-events-auto z-[90] [&_[data-sidebar=sidebar]]:border-transparent [&_[data-sidebar=sidebar]]:bg-background/95 [&_[data-sidebar=sidebar]]:shadow-2xl [&_[data-sidebar=sidebar]]:backdrop-blur-xl"
      >
        <SidebarHeader className="gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Network className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">Diagramme - <span className="text-muted-foreground">{project.name || 'Projet sans nom'}</span></p>
                <p className="truncate text-[11px] text-muted-foreground"> {project.entities.length} entité{project.entities.length > 1 ? 's' : ''} · {project.associations.length} association{project.associations.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <AppTooltip content="Fermer la barre latérale"><SidebarTrigger className="size-8 shrink-0 rounded-lg" aria-label="Fermer la barre latérale">
              <ChevronLeft className="size-4" />
            </SidebarTrigger></AppTooltip>
          </div>
        </SidebarHeader>

        <SidebarSeparator />
        <SidebarContent className="scrollbar-subtle">
          <SidebarGroup className="p-3">
            <SidebarGroupContent>
              <SidebarMenu className="flex-row gap-1">
                {navigation.map(({ id, label, description, icon: Icon }) => (
                  <SidebarMenuItem key={id}>
                    <AppTooltip content={`${label} · ${description}`} side="bottom">
                      <SidebarMenuButton
                        type="button"
                        isActive={panelView === id}
                        onClick={() => selectPanel(id)}
                        aria-label={label}
                        className="relative size-9 shrink-0 justify-center rounded-xl p-0 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                      >
                        <Icon className="size-4" aria-hidden />
                        {id === 'issues' && hasErrors && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" aria-label="Erreurs bloquantes" />}
                        {id === 'issues' && !hasErrors && hasWarnings && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-warning" aria-label="Avertissements" />}
                        {id === 'sql' && hasErrors && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" aria-label="SQL bloqué par des erreurs" />}
                      </SidebarMenuButton>
                    </AppTooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {panelView && (
            <SidebarGroup className="-mt-3 min-h-0 flex-1 gap-0 p-3 pt-0">
              <SidebarGroupContent className="min-h-0 flex-1 overflow-hidden bg-transparent">
                <div key={panelView} className="scrollbar-subtle h-full min-h-0 overflow-y-auto animate-panel-in">
                  <PanelContent panelView={panelView} onClosePanel={onClosePanel} colorMode={colorMode} onToggleTheme={onToggleTheme} />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="gap-2 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton type="button" onClick={onToggleTheme} aria-label={colorMode === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} className="size-9 justify-center rounded-xl p-0 text-muted-foreground hover:text-foreground">
                      {colorMode === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="top">{colorMode === 'dark' ? 'Thème clair' : 'Thème sombre'}</TooltipContent>
                </Tooltip>
                <ClearProjectsButton
                  onCleared={onClosePanel}
                  className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-destructive disabled:opacity-40"
                />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {open && !isMobile && (
        <div
          role="separator"
          aria-label="Redimensionner la barre latérale"
          aria-orientation="vertical"
          onPointerDown={startResize}
          className="pointer-events-auto absolute bottom-3 left-[var(--sidebar-width)] top-3 z-[95] w-2 -translate-x-1/2 cursor-ew-resize rounded-full transition-colors hover:bg-primary/30"
        />
      )}

      {!open && (
        <AppTooltip content="Ouvrir la barre latérale" side="right">
          <button
            type="button"
            onClick={() => onOpenPanel('tree')}
            className={cn('pointer-events-auto absolute left-4 top-6 z-[85] flex size-10 items-center justify-center rounded-xl border border-border/70 bg-card/95 text-muted-foreground shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 hover:text-foreground', isMobile && 'left-3 top-3')}
            aria-label="Ouvrir la barre latérale"
          >
            <PanelLeftOpen className="size-4" aria-hidden />
          </button>
        </AppTooltip>
      )}
    </>
  )
}
