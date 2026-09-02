import {
  CheckCircle2,
  ChevronLeft,
  Database,
  FolderOpen,
  ListTree,
  Moon,
  Network,
  PanelLeftOpen,
  Trash2,
  Sun,
} from 'lucide-react'
import { useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmPopover } from '@/components/ui/ConfirmPopover'
import { useProjectStore } from '@/store/project-store'
import { ProjectTreePanel } from './ProjectTreePanel'
import { ProjectManagerModal } from '@/components/projects/ProjectManagerModal'
import { SettingsModal } from '@/components/projects/SettingsModal'
import { SqlPanel } from '@/components/sql/SqlPanel'
import { cn } from '@/lib/utils'

type PanelView = 'tree' | 'projects' | 'sql' | 'settings'

const navigation = [
  { id: 'tree' as const, label: 'Structure', description: 'Entités et associations', icon: ListTree },
  { id: 'projects' as const, label: 'Diagrammes', description: 'Gérer vos modèles', icon: FolderOpen },
  { id: 'sql' as const, label: 'SQL PostgreSQL', description: 'Prévisualiser et exporter', icon: Database },
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
  const projects = useProjectStore((state) => state.projects)
  const clearAllProjects = useProjectStore((state) => state.clearAllProjects)
  const { open, isMobile } = useSidebar()
  const [confirmingClear, setConfirmingClear] = useState(false)

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
                <p className="truncate text-sm font-semibold tracking-tight">MERISE Diagrams</p>
                <p className="truncate text-[11px] text-muted-foreground">Atelier de modélisation</p>
              </div>
            </div>
            <SidebarTrigger className="size-8 shrink-0 rounded-lg" aria-label="Fermer la barre latérale">
              <ChevronLeft className="size-4" />
            </SidebarTrigger>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2.5">
            <p className="truncate text-xs font-medium">{project.name || 'Projet sans nom'}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {project.entities.length} entité{project.entities.length > 1 ? 's' : ''} · {project.associations.length} association{project.associations.length > 1 ? 's' : ''}
            </p>
          </div>
        </SidebarHeader>

        <SidebarSeparator />
        <SidebarContent className="scrollbar-subtle">
          <SidebarGroup className="p-3">
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
              Espace de travail
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <TooltipProvider delayDuration={150}>
              <SidebarMenu className="flex-row gap-1">
                {navigation.map(({ id, label, description, icon: Icon }) => (
                  <SidebarMenuItem key={id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          type="button"
                          isActive={panelView === id}
                          onClick={() => selectPanel(id)}
                          aria-label={label}
                          className="h-9 flex-1 justify-start gap-2 rounded-xl px-3 text-xs data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                        >
                          <Icon className="size-4" aria-hidden />
                          <span>{label}</span>
                          {id === 'tree' && <span className="sr-only">{project.entities.length + project.associations.length} éléments</span>}
                          {id === 'sql' && issues.some((issue) => issue.severity === 'error') && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" aria-label="SQL bloqué par des erreurs" />}
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{label} · {description}</TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              </TooltipProvider>
            </SidebarGroupContent>
          </SidebarGroup>

          {panelView && (
            <SidebarGroup className="-mt-3 min-h-0 flex-1 gap-0 p-3 pt-0">
              <SidebarGroupContent className="min-h-0 flex-1 overflow-hidden bg-transparent">
                <div key={panelView} className="scrollbar-subtle h-full min-h-0 overflow-y-auto animate-panel-in">
                  {panelView === 'tree' && <ProjectTreePanel embedded />}
                  {panelView === 'projects' && <ProjectManagerModal open panel embedded onClose={onClosePanel} />}
                  {panelView === 'sql' && <SqlPanel />}
                  {panelView === 'settings' && <SettingsModal open panel embedded onClose={onClosePanel} colorMode={colorMode} onToggleTheme={onToggleTheme} />}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="gap-2 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between gap-2">
                <TooltipProvider delayDuration={150}>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton type="button" onClick={onToggleTheme} aria-label={colorMode === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} className="size-9 justify-center rounded-xl p-0 text-muted-foreground hover:text-foreground">
                          {colorMode === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="top">{colorMode === 'dark' ? 'Thème clair' : 'Thème sombre'}</TooltipContent>
                    </Tooltip>
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton type="button" onClick={() => setConfirmingClear((value) => !value)} disabled={projects.length === 0} aria-label="Vider les données locales" className="size-9 justify-center rounded-xl p-0 text-muted-foreground hover:text-destructive disabled:opacity-40">
                            <Trash2 className="size-4" aria-hidden />
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="top">Vider les données locales</TooltipContent>
                      </Tooltip>
                      {confirmingClear && <div className="absolute bottom-11 left-0 z-50 w-64"><ConfirmPopover message="Vider tous les diagrammes ?" onCancel={() => setConfirmingClear(false)} onConfirm={() => { clearAllProjects(); setConfirmingClear(false); onClosePanel() }} /></div>}
                    </div>
                  </div>
                </TooltipProvider>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-success" aria-hidden />
                  <span>Sauvegardé</span>
                </div>
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
        <button
          type="button"
          onClick={() => onOpenPanel('tree')}
          className={cn('pointer-events-auto absolute left-4 top-6 z-[85] flex size-10 items-center justify-center rounded-xl border border-border/70 bg-card/95 text-muted-foreground shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 hover:text-foreground', isMobile && 'left-3 top-3')}
          aria-label="Ouvrir la barre latérale"
        >
          <PanelLeftOpen className="size-4" aria-hidden />
        </button>
      )}
    </>
  )
}
