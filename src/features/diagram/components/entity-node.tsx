import { memo, useState } from 'react'
import { type NodeProps } from '@xyflow/react'
import { KeyRound } from 'lucide-react'
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell,
} from '@/features/diagram/components/flow/database-schema-node'
import { EntityHandles } from '@/features/diagram/components/nodes/entity-handles'
import { NodeRenameField } from '@/features/diagram/components/nodes/node-rename-field'
import { NodeHeaderToolbar } from '@/features/diagram/components/nodes/node-header-toolbar'
import { NodeDeleteConfirm } from '@/features/diagram/components/nodes/node-delete-confirm'
import { cn } from '@/shared/utils/cn'
import { PropertyRow } from './property-row'
import type { EntityNodeData } from '@/features/diagram/flow/project-adapter'
import type { ConceptualType } from '@/domain/index'
import { useProjectStore } from '@/store/project-store'
import { renameEntity, deleteEntity, removeAttribute } from '@/editor/index'
import { useRename } from '@/features/diagram/hooks/use-rename'

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
      <EntityHandles />

      <DatabaseSchemaNodeHeader className={cn('group/header', isUML && 'bg-info/10')}>
        <div className="flex w-full items-center justify-between gap-2 px-1">
          <NodeRenameField
            rename={rename}
            label={d.label}
            emptyLabel="Sans nom"
            displayClassName="text-sm font-semibold text-foreground"
          />
          {!rename.editing && (
            <NodeHeaderToolbar
              onAddProperty={() => openAddProperty({ kind: 'entity', id: d.id })}
              addLabel="Ajouter une propriété"
              onDeleteRequest={() => setConfirmingDelete(true)}
              deleteLabel="Supprimer l'entité"
            />
          )}
          <NodeDeleteConfirm
            open={confirmingDelete}
            message={<>Supprimer l'entité « {d.label} » ?</>}
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={handleDelete}
          />
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
              <KeyRound className={cn('h-2.5 w-2.5 shrink-0', fk.reflexive ? 'text-success' : 'text-info')} aria-hidden />
              <span className={cn('truncate', fk.reflexive ? 'font-semibold text-success' : 'text-foreground')}>{fk.name}</span>
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}
      </DatabaseSchemaNodeBody>
    </DatabaseSchemaNode>
  )
}

export default memo(EntityNode)
