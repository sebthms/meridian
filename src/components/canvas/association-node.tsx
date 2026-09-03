import { memo, useState } from 'react'
import { type NodeProps } from '@xyflow/react'
import { KeyRound } from 'lucide-react'
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell,
} from '@/components/canvas/flow/database-schema-node'
import { AssociationHandles } from '@/components/canvas/nodes/association-handles'
import { NodeRenameField } from '@/components/canvas/nodes/node-rename-field'
import { NodeHeaderToolbar } from '@/components/canvas/nodes/node-header-toolbar'
import { NodeDeleteConfirm } from '@/components/canvas/nodes/node-delete-confirm'
import { GenericPropertyIcon } from '@/components/canvas/icons/type-icon'
import { cn } from '@/lib/utils'
import type { AssociationNodeData } from '@/editor/nodes/adapter'
import { useProjectStore } from '@/store/project-store'
import { updateAssociationName, deleteAssociation, removeAssociationAttribute } from '@/editor/commands'
import { useRename } from '@/hooks/use-rename'
import { PropertyRow } from './property-row'

function AssociationNode({ data, selected }: NodeProps) {
  const d = data as AssociationNodeData
  const isTable = (d.columns?.length ?? 0) > 0 && d.viewMode === 'MLD'
  const project = useProjectStore((s) => s.project)
  const apply = useProjectStore((s) => s.apply)
  const select = useProjectStore((s) => s.select)
  const openAddProperty = useProjectStore((s) => s.openAddProperty)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const rename = useRename(d.label, (name) => apply(updateAssociationName(project, d.id, name)))
  const isUML = d.viewMode === 'UML'

  const handleDelete = () => {
    apply(deleteAssociation(project, d.id))
    select(undefined)
    setConfirmingDelete(false)
  }

  const headerChrome = (
    <>
      <NodeRenameField
        rename={rename}
        label={d.label}
        emptyLabel="Association"
        inputWidth="w-24"
        displayClassName={isTable ? 'text-sm font-semibold text-foreground' : 'text-xs font-semibold'}
      />
      {!rename.editing && (
        <NodeHeaderToolbar
          onAddProperty={() => openAddProperty({ kind: 'association', id: d.id })}
          addLabel="Ajouter une propriété"
          onDeleteRequest={() => setConfirmingDelete(true)}
          deleteLabel="Supprimer l'association"
        />
      )}
      <NodeDeleteConfirm
        open={confirmingDelete}
        message={<>Supprimer l'association « {d.label} » ?</>}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        widthClass="w-56"
      />
    </>
  )

  return (
    <div className="group relative">
      <AssociationHandles />

      {isTable ? (
        <DatabaseSchemaNode className={cn('min-w-[170px]', selected && 'shadow-lg')}>
          <DatabaseSchemaNodeHeader className="group/header">
            <div className="flex w-full items-center justify-between gap-2 px-1">{headerChrome}</div>
          </DatabaseSchemaNodeHeader>
          <DatabaseSchemaNodeBody>
            {d.columns!.map((c) => (
              <DatabaseSchemaTableRow key={c.name}>
                <DatabaseSchemaTableCell className="flex items-center gap-1.5 py-1.5 pl-2 pr-2">
                  {c.isPrimaryKey ? (
                    <KeyRound className="h-3 w-3 shrink-0 text-warning" aria-hidden />
                  ) : c.isForeignKey ? (
                    <KeyRound className={cn('h-3 w-3 shrink-0', c.reflexive ? 'text-success' : 'text-info')} aria-hidden />
                  ) : (
                    <GenericPropertyIcon />
                  )}
                  <span className={cn('truncate', c.isPrimaryKey ? 'font-semibold text-warning' : c.isForeignKey ? 'font-semibold text-info' : c.reflexive ? 'font-semibold text-info' : 'text-foreground')}>{c.name}</span>
                </DatabaseSchemaTableCell>
              </DatabaseSchemaTableRow>
            ))}
          </DatabaseSchemaNodeBody>
        </DatabaseSchemaNode>
      ) : (
        <div className={cn(
          'flex min-w-[90px] flex-col items-center rounded-full border-2 bg-card px-3 py-1 text-center shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md',
          selected ? 'border-primary shadow-lg ring-2 ring-primary/30' : 'border-border',
          isUML && 'rounded-md border-info/40 shadow-info/10',
        )}>
          <div className="group/header flex w-full items-center justify-between gap-2">{headerChrome}</div>
          {d.attributes && d.attributes.length > 0 && (
            <div className="mt-1 w-full space-y-0.5 border-t border-border/60 pt-1">
              {d.attributes.map((at) => (
                <PropertyRow key={at.id} name={at.name} type={at.conceptualType} nullable={at.nullable} unique={at.unique} onEdit={() => openAddProperty({ kind: 'association', id: d.id, attributeId: at.id })} onDelete={() => apply(removeAssociationAttribute(project, d.id, at.id))} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(AssociationNode)
