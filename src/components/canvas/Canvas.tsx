import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileCode2,
  Link2,
  Moon,
  Plus,
  Redo2,
  Sun,
  Undo2,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ComponentProps } from 'react'
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
} from '@/editor'
import { type Cardinality } from '@/domain'
import type { ValidationIssue } from '@/merise'
import { cn } from '@/lib/utils'
import { downloadProject, downloadText } from '@/persistence'
import { generateMld } from '@/mld'
import { generateSql } from '@/sql'
import EntityNode from './EntityNode'
import AssociationNode from './AssociationNode'
import AssociationEdge from './AssociationEdge'

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
  if (status === 'error') return <AlertCircle className="h-4 w-4 text-red-500" aria-hidden />
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
  return <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
}

function DockButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    />
  )
}

function DockSeparator() {
  return <div className="mx-0.5 h-5 w-px bg-border" aria-hidden />
}

export function Canvas({
  colorMode,
  onToggleTheme,
  onOpenModal,
}: {
  colorMode: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenModal: (view: 'issues' | 'mld' | 'sql') => void
}) {
  const project = useProjectStore((s) => s.project)
  const issues = useProjectStore((s) => s.issues)
  const selectedId = useProjectStore((s) => s.selectedElementId)
  const select = useProjectStore((s) => s.select)
  const apply = useProjectStore((s) => s.apply)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const past = useProjectStore((s) => s.past)
  const future = useProjectStore((s) => s.future)
  const viewMode = useProjectStore((s) => s.viewMode)
  const setViewMode = useProjectStore((s) => s.setViewMode)
  const showTypeLabels = useProjectStore((s) => s.showTypeLabels)
  const toggleTypeLabels = useProjectStore((s) => s.toggleTypeLabels)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [cardinalityTarget, setCardinalityTarget] = useState<{
    associationId: string
    participantIndex: number
  } | null>(null)

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
        onSelectionChange={(params) => {
          const first = params.nodes[0]
          if (first) select(first.id)
          else if (params.edges.length === 0) select(undefined)
        }}
        onNodeDragStop={(_, node) => {
          if (node.type === 'entity') apply(moveEntity(project, node.id, node.position))
          if (node.type === 'association') apply(moveAssociation(project, node.id, node.position))
        }}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
      >
        <Background />
        <Controls />

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

            <DockButton title="Ajouter une entité" onClick={() => apply(createEntityCommand(project))}>
              <Plus className="h-4 w-4" aria-hidden />
            </DockButton>
            <DockButton
              title="Ajouter une association"
              onClick={() => apply(createAssociationCommand(project))}
            >
              <Link2 className="h-4 w-4" aria-hidden />
            </DockButton>

            <DockSeparator />

            <DockButton title="Annuler (Ctrl+Z)" onClick={undo} disabled={past.length === 0}>
              <Undo2 className="h-4 w-4" aria-hidden />
            </DockButton>
            <DockButton title="Rétablir (Ctrl+Y)" onClick={redo} disabled={future.length === 0}>
              <Redo2 className="h-4 w-4" aria-hidden />
            </DockButton>

            <DockSeparator />

            <DockButton title={statusLabel(status)} onClick={() => onOpenModal('issues')}>
              <StatusIcon status={status} />
            </DockButton>
            <DockButton title="Aperçu MLD" onClick={() => onOpenModal('mld')}>
              <FileCode2 className="h-4 w-4" aria-hidden />
            </DockButton>
            <DockButton title="Aperçu SQL" onClick={() => onOpenModal('sql')}>
              <Database className="h-4 w-4" aria-hidden />
            </DockButton>

            <DockSeparator />

            <DockButton
              title={colorMode === 'dark' ? 'Mode clair' : 'Mode sombre'}
              onClick={onToggleTheme}
            >
              {colorMode === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
            </DockButton>
            <button
              type="button"
              onClick={toggleTypeLabels}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors hover:bg-accent',
                showTypeLabels ? 'text-foreground' : 'text-muted-foreground',
              )}
              title={showTypeLabels ? 'Masquer les types' : 'Afficher les types'}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded border border-current text-[9px] font-bold">
                {showTypeLabels ? 'T' : '–'}
              </span>
              <span className="hidden xl:inline">Types</span>
            </button>

            <DockSeparator />

            <DockButton title="Exporter .json" onClick={() => downloadProject(project)}>
              <Download className="h-4 w-4" aria-hidden />
            </DockButton>
            <DockButton
              title="Exporter .sql"
              onClick={() =>
                downloadText(
                  generateSql(generateMld(project)),
                  `${project.name || 'modele'}.sql`,
                  'text/sql',
                )
              }
            >
              <Database className="h-4 w-4" aria-hidden />
            </DockButton>
          </div>
        </Panel>
      </ReactFlow>

      <AddPropertyModal />
    </div>
  )
}
