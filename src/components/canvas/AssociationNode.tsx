import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Check, KeyRound, RefreshCw, X } from 'lucide-react'
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
import { updateAssociationName } from '@/editor/commands'
import { useRename } from './useRename'

/**
 * Nœud d'association.
 * - N:N : la pastille se transforme en TABLE associative (colonnes = clés).
 * - Sinon : simple pastille renommable (double-clic pour éditer le nom).
 * Les arêtes arrivent via le handle gauche et partent via le handle droite.
 */
function AssociationNode({ data, selected }: NodeProps) {
  const d = data as AssociationNodeData
  const isTable = (d.columns?.length ?? 0) > 0
  const project = useProjectStore((s) => s.project)
  const apply = useProjectStore((s) => s.apply)
  const rename = useRename(d.label, (name) =>
    apply(updateAssociationName(project, d.id, name)),
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
            <RenameView rename={rename} label={d.label} />
            {!rename.editing && (
              <span className="ml-2 text-[9px] uppercase tracking-wide text-muted-foreground">
                table
              </span>
            )}
          </DatabaseSchemaNodeHeader>
          <DatabaseSchemaNodeBody>
            {d.columns!.map((c) => (
              <DatabaseSchemaTableRow key={c.name}>
                <DatabaseSchemaTableCell className="flex items-center gap-1.5 py-0.5 pl-2 pr-2">
                  {c.reflexive ? (
                    <RefreshCw className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
                  ) : c.isPrimaryKey ? (
                    <KeyRound className="h-3 w-3 shrink-0 text-amber-600" aria-hidden />
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden />
                  )}
                  <span
                    className={cn(
                      'truncate',
                      c.reflexive ? 'font-semibold text-emerald-600' : 'text-foreground',
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
          onDoubleClick={() => {
            if (!rename.editing) rename.start()
          }}
          className={cn(
            'flex min-w-[90px] flex-col items-center rounded-full border-2 bg-card px-3 py-1 text-center shadow-sm transition-shadow',
            selected ? 'border-primary shadow-lg ring-2 ring-primary/30' : 'border-border',
          )}
        >
          <RenameView rename={rename} label={d.label} />
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
  const { editing, draft, setDraft, inputRef, start, commit, cancel } = rename

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
    <span
      onDoubleClick={(e) => {
        e.stopPropagation()
        start()
      }}
      className="cursor-text text-xs font-semibold"
      title="Double-cliquez pour renommer"
    >
      {label || 'Association'}
    </span>
  )
}

export default memo(AssociationNode)
