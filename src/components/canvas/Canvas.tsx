import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Link2,
  LoaderCircle,
  Plus,
  Redo2,
  Save,
  Undo2,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import { useProjectStore } from '@/store/project-store'
import { projectToNodes, projectToEdges } from '@/editor/nodes/adapter'
import { AddPropertyModal } from './AddPropertyModal'
import {
  createEntityCommand,
  createAssociationCommand,
  createAssociationBetween,
  addAssociationParticipant,
  moveEntity,
  moveAssociation,
  updateCardinality,
  deleteEntity,
  deleteAssociation,
} from '@/editor'
import { type Cardinality } from '@/domain'
import type { ValidationIssue } from '@/merise'
import { cn } from '@/lib/utils'
import EntityNode from './EntityNode'
import AssociationNode from './AssociationNode'
import AssociationEdge from './AssociationEdge'
import { ConfirmPopover } from '@/components/ui/ConfirmPopover'
import { SidebarProvider } from '@/components/ui/sidebar'
import { DiagramSidebar } from './DiagramSidebar'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const nodeTypes = { entity: EntityNode, association: AssociationNode }
const edgeTypes = { assoc: AssociationEdge, loop: AssociationEdge }

type Status = 'valid' | 'warning' | 'error'

function statusOf(issues: ValidationIssue[]): Status {
  if (issues.some((i) => i.severity === 'error')) return 'error'
  if (issues.some((i) => i.severity === 'warning')) return 'warning'
  return 'valid'
}

function statusLabel(status: Status): string {
  if (status === 'error') return 'Problèmes bloquants'
  if (status === 'warning') return 'Avertissements de conception'
  return 'Modèle valide'
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
  return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
}

function DockButton({ className, title, 'aria-label': ariaLabel, children, ...props }: ComponentProps<'button'> & { children: ReactNode }) {
  return (
      <TooltipProvider><Tooltip><TooltipTrigger><button
      type="button"
      aria-label={ariaLabel ?? title}
      className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40', className)}
      {...props}
      >
        {children}
    </button>
    </TooltipTrigger><TooltipContent>{title ?? ariaLabel ?? 'Action'}</TooltipContent></Tooltip></TooltipProvider>
  )
}

function DockSeparator() {
  return <div className="my-0.5 h-px w-5 bg-border" aria-hidden />
}

export function Canvas({
  colorMode,
  onToggleTheme,
  onOpenModal,
  panelView,
  onClosePanel,
}: {
  colorMode: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenModal: (view: 'issues' | 'tree' | 'sql' | 'projects' | 'settings') => void
  panelView?: 'tree' | 'projects' | 'sql' | 'settings' | null
  onClosePanel: () => void
}) {
  const project = useProjectStore((s) => s.project)
  const issues = useProjectStore((s) => s.issues)
  const saveStatus = useProjectStore((s) => s.saveStatus)
  const selectedId = useProjectStore((s) => s.selectedElementId)
  const select = useProjectStore((s) => s.select)
  const apply = useProjectStore((s) => s.apply)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const past = useProjectStore((s) => s.past)
  const future = useProjectStore((s) => s.future)
  const viewMode = useProjectStore((s) => s.viewMode)
  const setViewMode = useProjectStore((s) => s.setViewMode)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [cardinalityTarget, setCardinalityTarget] = useState<{
    associationId: string
    participantIndex: number
  } | null>(null)
  const [confirmingSelectionDelete, setConfirmingSelectionDelete] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(352)
  const selectedNodes = nodes.filter((node) => node.selected)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key !== 'Delete' || target.closest('input, textarea, [contenteditable="true"]') || selectedNodes.length === 0) return
      event.preventDefault()
      setConfirmingSelectionDelete(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedNodes.length])

  const confirmSelectionDelete = () => {
    let next = project
    for (const node of selectedNodes) {
      next = node.type === 'entity' ? deleteEntity(next, node.id) : deleteAssociation(next, node.id)
    }
    apply(next)
    setConfirmingSelectionDelete(false)
  }

  const onPickCardinality = useCallback(
    (associationId: string, participantIndex: number, cardinality: Cardinality) => {
      apply(updateCardinality(project, associationId, participantIndex, cardinality))
      setCardinalityTarget(null)
    },
    [apply, project],
  )

  // nœuds/arêtes dérivés du modèle métier (adapter), jamais l'inverse.
  useEffect(() => {
    setNodes(projectToNodes(project, { selectedId, viewMode }))
    setEdges(
      projectToEdges(project, {
        viewMode,
        onOpen: (associationId, participantIndex) =>
          setCardinalityTarget({ associationId, participantIndex }),
        onPick: onPickCardinality,
        onClose: () => setCardinalityTarget(null),
        openTarget: cardinalityTarget,
      }),
    )
  }, [
    project,
    selectedId,
    viewMode,
    cardinalityTarget,
    onPickCardinality,
    setNodes,
    setEdges,
  ])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      // Connexion manuelle : on relie une entité à une pastille d'association.
      const sourceEntity = project.entities.find((e) => e.id === connection.source)
      const targetEntity = project.entities.find((e) => e.id === connection.target)
      const sourceAssoc = project.associations.find((a) => a.id === connection.source)
      const targetAssoc = project.associations.find((a) => a.id === connection.target)

      // cas 1 : entité → pastille
      if (sourceEntity && targetAssoc) {
        apply(addAssociationParticipant(project, targetAssoc.id, sourceEntity.id))
        return
      }
      // cas 2 : pastille → entité
      if (sourceAssoc && targetEntity) {
        apply(addAssociationParticipant(project, sourceAssoc.id, targetEntity.id))
        return
      }
      // cas 3 : entité → entité → création directe d'une association binaire
      if (sourceEntity && targetEntity) {
        apply(createAssociationBetween(project, sourceEntity.id, targetEntity.id, 'N:N'))
        return
      }
    },
    [project, apply],
  )

  const status = statusOf(issues)

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        colorMode={colorMode}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => select(node.id)}
        onPaneClick={() => select(undefined)}
        onNodeDragStop={(_, node) => {
          if (node.type === 'entity') apply(moveEntity(project, node.id, node.position))
          if (node.type === 'association') apply(moveAssociation(project, node.id, node.position))
        }}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        selectionOnDrag
        deleteKeyCode={null}
      >
        <Background />
        <Controls className="!m-4 !overflow-hidden !rounded-xl !border-border/60 !bg-card/90 !shadow-lg [&>button]:!border-border/60 [&>button]:!bg-card [&>button]:!text-muted-foreground [&>button:hover]:!bg-accent [&>button:hover]:!text-foreground" />
        <SidebarProvider
          open={Boolean(panelView)}
          onOpenChange={(open) => { if (!open) onClosePanel() }}
          className="pointer-events-none absolute inset-0 z-[80] min-h-0 w-full"
          style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
        >
          <DiagramSidebar
            panelView={panelView}
            onOpenPanel={onOpenModal}
            onClosePanel={onClosePanel}
            colorMode={colorMode}
            onToggleTheme={onToggleTheme}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
          />
        </SidebarProvider>

        <Panel position="top-right" className="!m-4">
          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/90 p-1 shadow-lg backdrop-blur">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground" aria-label={saveStatus === 'saving' ? 'Sauvegarde en cours' : 'Diagramme sauvegardé'}>
                    {saveStatus === 'saving' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {saveStatus === 'saving' ? 'Sauvegarde en cours' : 'Diagramme sauvegardé'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="mx-0.5 h-5 w-px bg-border" aria-hidden />
            <DockButton title={statusLabel(status)} onClick={() => onOpenModal('issues')}>
              <StatusIcon status={status} />
            </DockButton>
          </div>
        </Panel>

        {/* Dock intégré au canvas (remplace la topbar) */}
        <Panel position="bottom-center" className="!m-4">
          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/90 p-1 shadow-lg backdrop-blur">
            <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('MCD')}
                className={cn(
                  'px-2 py-1 text-[10px] font-bold uppercase transition-all',
                  viewMode === 'MCD'
                    ? 'rounded-md bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                MCD
              </button>
              <button
                type="button"
                onClick={() => setViewMode('UML')}
                className={cn(
                  'px-2 py-1 text-[10px] font-bold uppercase transition-all',
                  viewMode === 'UML'
                    ? 'rounded-md bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                UML
              </button>
              <button
                type="button"
                onClick={() => setViewMode('MLD')}
                className={cn(
                  'px-2 py-1 text-[10px] font-bold uppercase transition-all',
                  viewMode === 'MLD'
                    ? 'rounded-md bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                MLD
              </button>
            </div>

            <DockSeparator />
            <DockButton title="Ajouter une entité" onClick={() => apply(createEntityCommand(project))}><Plus className="h-4 w-4" aria-hidden /></DockButton>
            <DockButton title="Ajouter une association" onClick={() => apply(createAssociationCommand(project))}><Link2 className="h-4 w-4" aria-hidden /></DockButton>
            <DockSeparator />
            <DockButton title="Annuler (Ctrl+Z)" onClick={undo} disabled={past.length === 0}><Undo2 className="h-4 w-4" aria-hidden /></DockButton>
            <DockButton title="Rétablir (Ctrl+Y)" onClick={redo} disabled={future.length === 0}><Redo2 className="h-4 w-4" aria-hidden /></DockButton>
          </div>
        </Panel>
      </ReactFlow>

      <AddPropertyModal />
      {confirmingSelectionDelete && (
        <div className="absolute bottom-20 left-1/2 z-50 w-64 -translate-x-1/2">
          <ConfirmPopover message={`Supprimer les ${selectedNodes.length} éléments sélectionnés ?`} onCancel={() => setConfirmingSelectionDelete(false)} onConfirm={confirmSelectionDelete} confirmLabel="Supprimer" />
        </div>
      )}
    </div>
  )
}
