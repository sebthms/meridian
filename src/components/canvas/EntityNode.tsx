import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Check, KeyRound, Plus, Trash2, X } from 'lucide-react'
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell,
} from '@/components/database-schema-node'
import { cn } from '@/lib/utils'
import { PropertyRow } from './PropertyRow'
import type { EntityNodeData } from '@/editor/nodes/adapter'
import type { ConceptualType } from '@/domain'
import { useProjectStore } from '@/store/project-store'
import { renameEntity, deleteEntity, removeAttribute } from '@/editor'
import { isValidModelName, modelNameError } from '@/domain'
import { useRename } from './useRename'
import { ConfirmPopover } from '@/components/ui/ConfirmPopover'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const sourceHandleClass =
  '!h-3 !w-3 !opacity-0'
const targetHandleClass =
  '!h-3 !w-3 !opacity-0'

/**
 * Nœud Entité au style « table de schéma » (DatabaseSchemaNode).
 * - Quand l'entité est sélectionnée : icônes « crayon » (renommer),
 *   « + » (ajout de propriété) et « corbeille » (suppression) en bout de ligne.
 * Le handle source (en haut) sert au drag & drop vers une association.
 * Le handle cible (à gauche) reçoit les arêtes mais reste masqué.
 */
function EntityNode({ data, selected }: NodeProps) {
  const d = data as EntityNodeData
  const project = useProjectStore((s) => s.project)
  const apply = useProjectStore((s) => s.apply)
  const select = useProjectStore((s) => s.select)
  const openAddProperty = useProjectStore((s) => s.openAddProperty)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isUML = d.viewMode === 'UML'
  const isMLD = d.viewMode === 'MLD'

  const rename = useRename(d.label, (name) => {
    const next = renameEntity(project, d.id, name)
    if (next !== project) apply(next)
  })

  const handleDelete = () => {
    apply(deleteEntity(project, d.id))
    select(undefined)
    setConfirmingDelete(false)
  }

  return (
    <DatabaseSchemaNode
      className={cn(
        'group min-w-[190px]',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg',
        isUML && 'border-info/40 shadow-info/10',
        isMLD && 'border-node-border shadow-foreground/5',
      )}
    >
      {/* Les handles restent montés dans toutes les vues : les arêtes MLD sont
          elles aussi reliées directement aux entités. */}
      <Handle
        type="source"
        id="source"
        position={Position.Top}
        aria-label="Relier à une association"
        className={sourceHandleClass}
      />
      {/* Handle cible (gauche) : reçoit l'arête, invisible mais fonctionnel */}
      <Handle
        type="target"
        id="target"
        position={Position.Left}
        aria-label="Point de réception"
        className={targetHandleClass}
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        aria-label="Point de départ réflexif"
        className={sourceHandleClass}
      />
      <Handle
        type="target"
        id="bottom"
        position={Position.Bottom}
        aria-label="Point de réception réflexif"
        className={targetHandleClass}
      />
      <Handle
        type="source"
        id="reflexive-source"
        position={Position.Bottom}
        style={{ left: '30%' }}
        aria-label="Point de départ réflexif"
        className={sourceHandleClass}
      />
      <Handle
        type="target"
        id="reflexive-target-0"
        position={Position.Bottom}
        style={{ left: '42%' }}
        aria-label="Premier point de réception réflexif"
        className={targetHandleClass}
      />
      <Handle
        type="target"
        id="reflexive-target-1"
        position={Position.Bottom}
        style={{ left: '70%' }}
        aria-label="Second point de réception réflexif"
        className={targetHandleClass}
      />

      <DatabaseSchemaNodeHeader className={cn('group/header', isUML && 'bg-info/10')}>
        <div className="flex w-full items-center justify-between gap-2 px-1">
          {rename.editing ? (
            <span className="flex items-center gap-1">
              <div className="flex flex-col gap-0.5">
                <input
                  ref={rename.inputRef}
                  value={rename.draft}
                  onChange={(e) => rename.setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') rename.commit()
                    if (e.key === 'Escape') rename.cancel()
                  }}
                  className="nodrag nopan w-28 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary"
                  placeholder="Sans nom"
                  pattern="[A-Za-z_][A-Za-z0-9_]*"
                />
                {rename.draft.trim() && !isValidModelName(rename.draft.trim()) && <span className="max-w-40 text-[9px] font-normal text-destructive">{modelNameError('Le nom')}</span>}
              </div>
              <TooltipProvider><Tooltip><TooltipTrigger><button
                type="button"
                onClick={rename.commit}
                className="nodrag nopan rounded p-0.5 text-success hover:bg-accent"
                aria-label="Valider"
              >
                <Check className="h-3.5 w-3.5" />
              </button></TooltipTrigger><TooltipContent>Valider</TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger><button
                type="button"
                onClick={rename.cancel}
                className="nodrag nopan rounded p-0.5 text-muted-foreground hover:bg-accent"
                aria-label="Annuler"
              >
                <X className="h-3.5 w-3.5" />
              </button></TooltipTrigger><TooltipContent>Annuler</TooltipContent></Tooltip></TooltipProvider>
            </span>
          ) : (
            <span onDoubleClick={(event) => { event.stopPropagation(); rename.start() }} aria-label="Double-cliquer pour renommer" className="cursor-text truncate text-sm font-semibold text-foreground">
              {d.label || 'Sans nom'}
            </span>
          )}

          {!rename.editing && (
            <span className="flex max-w-0 -translate-x-1 items-center gap-0.5 overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover/header:max-w-14 group-hover/header:translate-x-0 group-hover/header:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openAddProperty({ kind: 'entity', id: d.id })
                }}
                className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Ajouter une propriété"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <TooltipProvider><Tooltip><TooltipTrigger><button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmingDelete(true)
                }}
                className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                aria-label="Supprimer l'entité"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button></TooltipTrigger><TooltipContent>Supprimer l'entité</TooltipContent></Tooltip></TooltipProvider>
            </span>
          )}
          {confirmingDelete && <div className="absolute right-1 top-8 z-40 w-52"><ConfirmPopover message={<>Supprimer l'entité « {d.label} » ?</>} onCancel={() => setConfirmingDelete(false)} onConfirm={handleDelete} confirmLabel="Supprimer" /></div>}
          </div>

      </DatabaseSchemaNodeHeader>

      <DatabaseSchemaNodeBody>
        {d.attributes.map((a) => (
          <DatabaseSchemaTableRow key={a.id}>
            <DatabaseSchemaTableCell className="p-0">
              <PropertyRow name={a.name} type={a.conceptualType as ConceptualType} isIdentifier={a.isIdentifier} nullable={a.nullable} unique={a.unique} onEdit={() => openAddProperty({ kind: 'entity', id: d.id, attributeId: a.id })} onDelete={() => apply(removeAttribute(project, d.id, a.id))} />
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}

        {d.foreignKeys.map((fk) => (
          <DatabaseSchemaTableRow key={fk.name}>
            <DatabaseSchemaTableCell className="flex items-center gap-1.5 py-1.5 pl-2 pr-2">
              <KeyRound
                className={cn(
                  'h-2.5 w-2.5 shrink-0',
                  fk.reflexive ? 'text-success' : 'text-info',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'truncate',
                  fk.reflexive ? 'font-semibold text-success' : 'text-foreground',
                )}
              >
                {fk.name}
              </span>
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}
      </DatabaseSchemaNodeBody>
    </DatabaseSchemaNode>
  )
}

export default memo(EntityNode)
