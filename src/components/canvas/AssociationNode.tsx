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
import type { AssociationNodeData } from '@/editor/nodes/adapter'
import { useProjectStore } from '@/store/project-store'
import { updateAssociationName, deleteAssociation } from '@/editor/commands'
import { useRename } from './useRename'
import { TypeIcon, TypeLabel, GenericPropertyIcon } from './type-icon'

/**
 * Nœud d'association.
 * - N:N : la pastille se transforme en TABLE associative (colonnes = clés + propriétés).
 * - Sinon : simple pastille avec propriétés portées.
 * Quand l'association est sélectionnée : icônes « crayon » (renommer),
 * « + » (ajout de propriété) et « corbeille » (suppression) en bout de ligne,
 * masquées pendant le renommage.
 * Les arêtes arrivent via le handle gauche et partent via le handle droite.
 */
function AssociationNode({ data, selected }: NodeProps) {
  const d = data as AssociationNodeData
  const isTable = (d.columns?.length ?? 0) > 0
  const project = useProjectStore((s) => s.project)
  const apply = useProjectStore((s) => s.apply)
  const select = useProjectStore((s) => s.select)
  const openAddProperty = useProjectStore((s) => s.openAddProperty)
  const showTypeLabels = useProjectStore((s) => s.showTypeLabels)
  const rename = useRename(d.label, (name) =>
    apply(updateAssociationName(project, d.id, name)),
  )

  const handleDelete = () => {
    apply(deleteAssociation(project, d.id))
    select(undefined)
  }

  const actions = selected && !rename.editing && (
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
          openAddProperty({ kind: 'association', id: d.id })
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
        title="Supprimer l'association"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
  )

  return (
    <div className="relative">
      {/* Reçoit le lien de la 1ʳᵉ entité (gauche) */}
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary"
      />
      {/* Relie vers la 2ᵉ entité (droite) */}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary"
      />

      {isTable ? (
        <DatabaseSchemaNode className={cn('min-w-[170px]', selected && 'shadow-lg')}>
          <DatabaseSchemaNodeHeader>
            <div className="flex w-full items-center justify-between gap-2 px-1">
              <span className="flex min-w-0 items-center gap-1">
                <RenameView rename={rename} label={d.label} />

              </span>
              {actions}
            </div>
          </DatabaseSchemaNodeHeader>
          <DatabaseSchemaNodeBody>
            {d.columns!.map((c) => (
              <DatabaseSchemaTableRow key={c.name}>
                <DatabaseSchemaTableCell className="flex items-center gap-1.5 py-1.5 pl-2 pr-2 ">
                  {c.isPrimaryKey ? (
                    <KeyRound className="h-3 w-3 shrink-0 text-blue-500" aria-hidden />
                  ) : c.isForeignKey ? (
                    <KeyRound
                      className={cn(
                        'h-3 w-3 shrink-0',
                        c.reflexive ? 'text-emerald-600' : 'text-blue-500',
                      )}
                      aria-hidden
                    />
                  ) : (
                    <GenericPropertyIcon />
                  )}
                  <span
                    className={cn(
                      'truncate',
                      c.reflexive ? 'font-semibold text-blue-500' : 'text-foreground',
                    )}
                  >
                    {c.name}
                  </span>
                </DatabaseSchemaTableCell>
              </DatabaseSchemaTableRow>
            ))}
          </DatabaseSchemaNodeBody>
        </DatabaseSchemaNode>
      ) : (
        <div
          className={cn(
            'flex min-w-[90px] flex-col items-center rounded-full border-2 bg-card px-3 py-1 text-center shadow-sm transition-shadow',
            selected ? 'border-primary shadow-lg ring-2 ring-primary/30' : 'border-border',
          )}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <RenameView rename={rename} label={d.label} />
            {actions}
          </div>
          {d.attributes && d.attributes.length > 0 && (
            <div className="mt-1 w-full space-y-0.5 border-t border-border/60 pt-1">
              {d.attributes.map((at) => (
                <div
                  key={at.id}
                  className="flex items-center gap-1  text-[10px] text-muted-foreground"
                >
                  <TypeIcon type={at.conceptualType} className="shrink-0" />
                  <span className="truncate">{at.name || '…'}</span>
                  {showTypeLabels && (
                    <TypeLabel type={at.conceptualType} className="ml-auto" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RenameView({
  rename,
  label,
}: {
  rename: ReturnType<typeof useRename>
  label: string
}) {
  const { editing, draft, setDraft, inputRef, commit, cancel } = rename

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          className="nodrag nopan w-24 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary"
          placeholder="Nom"
        />
        <button
          type="button"
          onClick={commit}
          className="nodrag nopan rounded p-0.5 text-emerald-600 hover:bg-accent"
          title="Valider"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={cancel}
          className="nodrag nopan rounded p-0.5 text-muted-foreground hover:bg-accent"
          title="Annuler"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    )
  }

  return (
    <span className="cursor-default text-xs font-semibold">
      {label || 'Association'}
    </span>
  )
}

export default memo(AssociationNode)
