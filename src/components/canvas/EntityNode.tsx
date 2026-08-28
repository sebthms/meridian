import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Check, Circle, KeyRound, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell,
} from '@/components/database-schema-node'
import { cn } from '@/lib/utils'
import { TypeIcon } from './type-icon'
import type { EntityNodeData } from '@/editor/nodes/adapter'
import type { ConceptualType } from '@/domain'
import { useProjectStore } from '@/store/project-store'
import { renameEntity, deleteEntity } from '@/editor'
import { useRename } from './useRename'

/**
 * Nœud Entité au style « table de schéma » (DatabaseSchemaNode).
 * - Double-clic sur le nom → renommage inline (✓/✕).
 * - Quand l'entité est sélectionnée : icônes « + » (ajout de propriété)
 *   et « corbeille » (suppression) en bout de ligne (space-between).
 * Le handle source (en haut) sert au drag & drop vers une association.
 * Le handle cible (à gauche) reçoit les arêtes mais reste masqué.
 */
function EntityNode({ data, selected }: NodeProps) {
  const d = data as EntityNodeData
  const project = useProjectStore((s) => s.project)
  const apply = useProjectStore((s) => s.apply)
  const select = useProjectStore((s) => s.select)
  const openAddProperty = useProjectStore((s) => s.openAddProperty)

  const rename = useRename(d.label, (name) => {
    const next = renameEntity(project, d.id, name)
    if (next !== project) apply(next)
  })

  const handleDelete = () => {
    apply(deleteEntity(project, d.id))
    select(undefined)
  }

  return (
    <DatabaseSchemaNode className={cn('min-w-[170px]', selected && 'shadow-lg')}>
      {/* Handle source : en haut de l'en-tête → tirez vers une association */}
      <Handle
        type="source"
        id="source"
        position={Position.Top}
        title="Relier à une association"
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary"
      />
      {/* Handle cible (gauche) : reçoit l'arête, invisible mais fonctionnel */}
      <Handle
        type="target"
        id="target"
        position={Position.Left}
        title="Relier à une association"
        className="!h-2.5 !w-2.5 !opacity-0"
      />

      <DatabaseSchemaNodeHeader>
        <div className="flex w-full items-center justify-between gap-2 px-1">
          {rename.editing ? (
            <span className="flex items-center gap-1">
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
              />
              <button
                type="button"
                onClick={rename.commit}
                className="nodrag nopan rounded p-0.5 text-emerald-600 hover:bg-accent"
                title="Valider"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={rename.cancel}
                className="nodrag nopan rounded p-0.5 text-muted-foreground hover:bg-accent"
                title="Annuler"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation()
                rename.start()
              }}
              className="cursor-text truncate text-sm font-semibold text-foreground"
              title="Double-cliquez pour renommer"
            >
              {d.label || 'Sans nom'}
            </span>
          )}


          {selected && !rename.editing && (
            <span className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openAddProperty({ kind: 'entity', id: d.id })
                }}
                className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Ajouter une propriété"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                title="Supprimer l'entité"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
            )}
          </div>

      </DatabaseSchemaNodeHeader>

      <DatabaseSchemaNodeBody>
        {d.attributes.map((a) => (
          <DatabaseSchemaTableRow key={a.id}>
            <DatabaseSchemaTableCell className="flex items-center gap-1.5 py-1.5 pl-2 pr-2 pt-2.5">
              {a.isIdentifier ? (
                <KeyRound className="h-2.5 w-2.5 shrink-0 text-yellow-300" aria-hidden />
              ) : (
                <Circle className="h-2 w-2 shrink-0 text-muted-foreground/60" aria-hidden />
              )}
              <span
                className={cn(
                  'truncate',
                  a.isIdentifier && 'font-semibold text-amber-600',
                )}
              >
                {a.name || '…'}
              </span>
              <TypeIcon type={a.conceptualType as ConceptualType} className="ml-auto text-muted-foreground" />
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}

        {d.foreignKeys.map((fk) => (
          <DatabaseSchemaTableRow key={fk.name}>
            <DatabaseSchemaTableCell className="flex items-center gap-1.5 py-1.5 pl-2 pr-2">
              {fk.reflexive ? (
                <RefreshCw className="h-2.5 w-2.5 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="h-2.5 w-2.5 shrink-0 text-muted-foreground/50" aria-hidden />
              )}
              <span
                className={cn(
                  'truncate',
                  fk.reflexive ? 'font-semibold text-emerald-600' : 'text-foreground',
                )}
              >
                {fk.name}
              </span>
              <span className="ml-auto shrink-0 rounded-sm bg-muted px-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                FK
              </span>
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}
      </DatabaseSchemaNodeBody>
    </DatabaseSchemaNode>
  )
}

export default memo(EntityNode)
