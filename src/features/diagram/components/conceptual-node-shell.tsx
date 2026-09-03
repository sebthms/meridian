import { useState, type ReactElement, type ReactNode } from 'react'
import { ConceptualHandles } from '@/features/diagram/components/nodes/conceptual-handles'
import { NodeDeleteConfirm } from '@/features/diagram/components/nodes/node-delete-confirm'
import { ConceptualNodeToolbar } from './conceptual-node-toolbar'
import { AppTooltip } from '@/shared/ui/tooltip'
import type { ConceptualKind } from '@/domain/index'
import { useProjectStore } from '@/store/project-store'
import {
  deleteBusinessRule,
  deleteCif,
  deleteConstraint,
  deleteInheritance,
} from '@/editor/index'

const DELETE: Record<ConceptualKind, (project: Parameters<typeof deleteCif>[0], id: string) => Parameters<typeof deleteCif>[0]> = {
  inheritance: deleteInheritance,
  constraint: deleteConstraint,
  cif: deleteCif,
  businessRule: deleteBusinessRule,
}

export function ConceptualNodeShell({
  kind,
  id,
  label,
  tooltip,
  editLabel,
  deleteLabel,
  children,
}: {
  kind: ConceptualKind
  id: string
  label: string
  tooltip: ReactNode
  editLabel: string
  deleteLabel: string
  children: ReactElement
}) {
  const apply = useProjectStore((state) => state.apply)
  const select = useProjectStore((state) => state.select)
  const openEdit = useProjectStore((state) => state.openEditConceptual)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className="group relative">
      <ConceptualHandles />
      <AppTooltip content={tooltip}>{children}</AppTooltip>
      <ConceptualNodeToolbar
        onEdit={() => openEdit({ kind, id })}
        editLabel={editLabel}
        onDeleteRequest={() => setConfirmingDelete(true)}
        deleteLabel={deleteLabel}
      />
      <NodeDeleteConfirm
        open={confirmingDelete}
        message={<>{deleteLabel} « {label} » ?</>}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          apply(DELETE[kind](useProjectStore.getState().project, id))
          select(undefined)
          setConfirmingDelete(false)
        }}
        widthClass="w-56"
      />
    </div>
  )
}
