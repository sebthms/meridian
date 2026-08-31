import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Check, KeyRound, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell,
} from '@/components/database-schema-node'
import { cn } from '@/lib/utils'
import { TypeIcon, TypeLabel } from './type-icon'
import type { EntityNodeData } from '@/editor/nodes/adapter'
import type { ConceptualType } from '@/domain'
import { useProjectStore } from '@/store/project-store'
import { renameEntity, deleteEntity } from '@/editor'
import { useRename } from './useRename'

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
  const showTypeLabels = useProjectStore((s) => s.showTypeLabels)

  const isUML = d.viewMode === 'UML'
  const isMLD = d.viewMode === 'MLD'

  const rename = useRename(d.label, (name) => {
    const next = renameEntity(project, d.id, name)
    if (next !== project) apply(next)
  })

  const handleDelete = () => {
    apply(deleteEntity(project, d.id))
    select(undefined)
  }

  return (
    <DatabaseSchemaNode
      className={cn(
        'min-w-[170px]',
        selected && 'shadow-lg',
        isUML && 'border-blue-400/50 shadow-blue-500/10',
        isMLD && 'border-slate-400/50 shadow-slate-500/10',
      )}
    >
      {/* Les handles restent montés dans toutes les vues : les arêtes MLD sont
          elles aussi reliées directement aux entités. */}
      <Handle
        type="source"
        id="source"
        position={Position.Top}
        title="Relier à une association"
        className={cn(
          '!h-2.5 !w-2.5 !border-2 !border-background !bg-primary',
          isMLD && '!opacity-0',
        )}
      />
      {/* Handle cible (gauche) : reçoit l'arête, invisible mais fonctionnel */}
      <Handle
        type="target"
        id="target"
        position={Position.Left}
        title="Relier à une association"
        className="!h-2.5 !w-2.5 !opacity-0"
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !opacity-0"
      />
      <Handle
        type="target"
        id="bottom"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !opacity-0"
      />

      <DatabaseSchemaNodeHeader className={cn(isUML && 'bg-blue-50/50 dark:bg-blue-950/20')}>
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
            <span className="cursor-default truncate text-sm font-semibold text-foreground">
              {d.label || 'Sans nom'}
            </span>
          )}

          {selected && !rename.editing && (
            <span className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  rename.start()
                }}
                className="nodrag nopan rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Renommer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
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
                <TypeIcon type={a.conceptualType as ConceptualType} className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
              )}
              <span
                className={cn(
                  'truncate',
                  a.isIdentifier && 'font-semibold text-amber-600',
                )}
              >
                {a.name || '…'}
              </span>
              {showTypeLabels && (
                <TypeLabel type={a.conceptualType as ConceptualType} className="ml-auto" />
              )}
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}

        {d.foreignKeys.map((fk) => (
          <DatabaseSchemaTableRow key={fk.name}>
            <DatabaseSchemaTableCell className="flex items-center gap-1.5 py-1.5 pl-2 pr-2">
              <KeyRound
                className={cn(
                  'h-2.5 w-2.5 shrink-0',
                  fk.reflexive ? 'text-emerald-600' : 'text-blue-500',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'truncate',
                  fk.reflexive ? 'font-semibold text-emerald-600' : 'text-foreground',
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
