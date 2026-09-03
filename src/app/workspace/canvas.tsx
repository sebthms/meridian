import {
  ArrowRightLeft,
  Link2,
  Network,
  Box,
  Database,
  GitFork,
  Plus,
  Redo2,
  ScrollText,
  ShieldAlert,
  Undo2,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ReactFlow,
  Background,
  Panel,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnectStartParams,
} from '@xyflow/react'
import { ConnectionProvider } from '@/features/diagram/context/connection-context'
import { useProjectStore } from '@/store/project-store'
import { projectToNodes, projectToEdges } from '@/features/diagram/flow/project-adapter'
import { generateMld } from '@/mld'
import { AddPropertyModal } from '../../features/diagram/components/add-property-modal'
import { ConceptualEditModal } from '../../features/diagram/components/conceptual-edit-modal'
import { CanvasControls } from '../../features/diagram/components/canvas-controls'
import {
  createEntityCommand,
  createAssociationCommand,
  createInheritanceCommand,
  createConstraintCommand,
  createCifCommand,
  createBusinessRuleCommand,
  applyCanvasConnection,
  applyNodeMove,
  deleteCanvasNode,
  isConceptualKind,
  updateCardinality,
} from '@/editor/index'
import { type Cardinality } from '@/domain/index'
import { cn } from '@/shared/utils/cn'
import EntityNode from '../../features/diagram/components/entity-node'
import AssociationNode from '../../features/diagram/components/association-node'
import AssociationEdge from '../../features/diagram/components/association-edge'
import InheritanceNode from '../../features/diagram/components/inheritance-node'
import ConstraintNode from '../../features/diagram/components/constraint-node'
import CifNode from '../../features/diagram/components/cif-node'
import BusinessRuleNode from '../../features/diagram/components/business-rule-node'
import ConceptualEdge from '../../features/diagram/components/conceptual-edge'
import { ConfirmPopover } from '@/shared/components/confirm-popover'
import { SidebarProvider } from '@/shared/ui/sidebar'
import { DiagramSidebar } from './diagram-sidebar'
import type { PanelView } from './panel-view'
import { AppTooltip } from '@/shared/ui/tooltip'

const nodeTypes = {
  entity: EntityNode,
  association: AssociationNode,
  inheritance: InheritanceNode,
  constraint: ConstraintNode,
  cif: CifNode,
  businessRule: BusinessRuleNode,
}
const edgeTypes = { assoc: AssociationEdge, loop: AssociationEdge, conceptual: ConceptualEdge }

function DockButton({ className, title, 'aria-label': ariaLabel, children, ...props }: ComponentProps<'button'> & { children: ReactNode }) {
  return (
      <AppTooltip content={title ?? ariaLabel ?? 'Action'}><button
      type="button"
      aria-label={ariaLabel ?? title}
      className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40', className)}
      {...props}
      >
        {children}
    </button>
    </AppTooltip>
  )
}

function DockSeparator() {
  return <div className="my-0.5 h-px w-5 bg-border" aria-hidden />
}

export function Canvas({
  colorMode,
  onToggleTheme,
  onOpenPanel,
  panelView,
  onClosePanel,
}: {
  colorMode: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenPanel: (view: PanelView) => void
  panelView?: PanelView | null
  onClosePanel: () => void
}) {
  const { t } = useTranslation()
  const project = useProjectStore((s) => s.project)
  const selectedId = useProjectStore((s) => s.selectedElementId)
  const select = useProjectStore((s) => s.select)
  const apply = useProjectStore((s) => s.apply)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const canUndo = useProjectStore((s) => s.past.length > 0)
  const canRedo = useProjectStore((s) => s.future.length > 0)
  const viewMode = useProjectStore((s) => s.viewMode)
  const setViewMode = useProjectStore((s) => s.setViewMode)
  const openEditConceptual = useProjectStore((s) => s.openEditConceptual)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [connectionState, setConnectionState] = useState({ isConnecting: false, sourceNodeId: null as string | null })
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
      next = deleteCanvasNode(next, node)
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
    const mld = viewMode === 'MLD' ? generateMld(project) : undefined
    setNodes(projectToNodes(project, { selectedId, viewMode, mld }))
    setEdges(
      projectToEdges(project, {
        viewMode,
        mld,
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

  const endConnection = useCallback(() => {
    setConnectionState({ isConnecting: false, sourceNodeId: null })
  }, [])

  const onConnectStart = useCallback((_: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
    setConnectionState({ isConnecting: true, sourceNodeId: params.nodeId })
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => {
      endConnection()
      if (!connection.source || !connection.target) return
      apply(applyCanvasConnection(project, connection.source, connection.target))
    },
    [project, apply, endConnection],
  )

  return (
    <div className="relative h-full w-full">
      <ConnectionProvider value={connectionState}>
      <ReactFlow
        colorMode={colorMode}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => select(node.id)}
        onNodeDoubleClick={(_, node) => {
          if (isConceptualKind(node.type)) openEditConceptual({ kind: node.type, id: node.id })
        }}
        onPaneClick={() => select(undefined)}
        onNodeDragStop={(_, node) => apply(applyNodeMove(project, node))}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={endConnection}
        connectionMode={ConnectionMode.Loose}
        selectionOnDrag
        deleteKeyCode={null}
      >
        <Background />
        <CanvasControls />
        <SidebarProvider
          open={Boolean(panelView)}
          onOpenChange={(open) => { if (!open) onClosePanel() }}
          className="pointer-events-none absolute inset-0 z-[80] min-h-0 w-full"
          style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
        >
          <DiagramSidebar
            panelView={panelView}
            onOpenPanel={onOpenPanel}
            onClosePanel={onClosePanel}
            colorMode={colorMode}
            onToggleTheme={onToggleTheme}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
          />
        </SidebarProvider>

        {/* Dock intégré au canvas (remplace la topbar) */}
        <Panel position="bottom-center" className="!m-4 max-w-[calc(100vw-2rem)]">
          <div className="flex flex-wrap items-center justify-center gap-1 rounded-xl border border-border/60 bg-card/90 p-1 shadow-lg backdrop-blur">
            <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
              <DockButton title={t('dock.mcd')} aria-label={t('dock.mcd')} onClick={() => setViewMode('MCD')} className={cn(viewMode === 'MCD' ? 'rounded-md bg-background text-foreground shadow-sm' : 'text-muted-foreground')}><Network className="h-4 w-4" aria-hidden /></DockButton>
              <DockButton title={t('dock.uml')} aria-label={t('dock.uml')} onClick={() => setViewMode('UML')} className={cn(viewMode === 'UML' ? 'rounded-md bg-background text-foreground shadow-sm' : 'text-muted-foreground')}><Box className="h-4 w-4" aria-hidden /></DockButton>
              <DockButton title={t('dock.mld')} aria-label={t('dock.mld')} onClick={() => setViewMode('MLD')} className={cn(viewMode === 'MLD' ? 'rounded-md bg-background text-foreground shadow-sm' : 'text-muted-foreground')}><Database className="h-4 w-4" aria-hidden /></DockButton>
            </div>

            <DockSeparator />
            <DockButton title={t('dock.addEntity')} onClick={() => apply(createEntityCommand(project))}><Plus className="h-4 w-4" aria-hidden /></DockButton>
            <DockButton title={t('dock.addAssociation')} onClick={() => apply(createAssociationCommand(project))}><Link2 className="h-4 w-4" aria-hidden /></DockButton>
            <DockButton title={t('dock.addInheritance')} onClick={() => apply(createInheritanceCommand(project))}><GitFork className="h-4 w-4" aria-hidden /></DockButton>
            <DockButton title={t('dock.addConstraint')} onClick={() => apply(createConstraintCommand(project))}><ShieldAlert className="h-4 w-4" aria-hidden /></DockButton>
            <DockButton title={t('dock.addCif')} onClick={() => apply(createCifCommand(project))}><ArrowRightLeft className="h-4 w-4" aria-hidden /></DockButton>
            <DockButton title={t('dock.addBusinessRule')} onClick={() => apply(createBusinessRuleCommand(project))}><ScrollText className="h-4 w-4" aria-hidden /></DockButton>
            <DockSeparator />
            <DockButton title={t('dock.undo')} onClick={undo} disabled={!canUndo}><Undo2 className="h-4 w-4" aria-hidden /></DockButton>
            <DockButton title={t('dock.redo')} onClick={redo} disabled={!canRedo}><Redo2 className="h-4 w-4" aria-hidden /></DockButton>
          </div>
        </Panel>
      </ReactFlow>
      </ConnectionProvider>

      <AddPropertyModal />
      <ConceptualEditModal />
      {confirmingSelectionDelete && (
        <div className="absolute bottom-20 left-1/2 z-50 -translate-x-1/2">
          <ConfirmPopover message={t('dock.deleteSelection', { count: selectedNodes.length })} onCancel={() => setConfirmingSelectionDelete(false)} onConfirm={confirmSelectionDelete} confirmLabel={t('common.delete')} />
        </div>
      )}
    </div>
  )
}
