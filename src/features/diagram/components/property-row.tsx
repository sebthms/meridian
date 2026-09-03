import { useState } from 'react'
import { KeyRound, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ConceptualType } from '@/domain/index'
import { GenericPropertyIcon, TypeLabel } from '@/features/diagram/components/icons/type-icon'
import { PropertyConstraintIcons } from '@/features/diagram/components/property-constraint-icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { ConfirmPopover } from '@/shared/components/confirm-popover'

export function PropertyRow({ name, type, isIdentifier = false, nullable = false, unique = false, onEdit, onDelete }: {
  name: string
  type: ConceptualType
  isIdentifier?: boolean
  nullable?: boolean
  unique?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="group/property relative flex min-h-8 items-center gap-2 px-2 text-xs transition-colors duration-200 ease-out hover:bg-accent/60">
      {isIdentifier ? (
        <KeyRound className="h-3 w-3 shrink-0 text-warning" aria-label="Identifiant" />
      ) : (
        <GenericPropertyIcon className="shrink-0" />
      )}
      <span className={isIdentifier ? 'min-w-0 flex-1 truncate text-warning' : 'min-w-0 flex-1 truncate'}>{name || '…'}</span>
      <TypeLabel type={type} />
      <PropertyConstraintIcons nullable={nullable} unique={unique} stopPropagation />
      <span className="flex max-w-0 -translate-x-1 items-center gap-0.5 overflow-hidden opacity-0 transition-[max-width,opacity,transform] duration-200 ease-out group-hover/property:max-w-14 group-hover/property:translate-x-0 group-hover/property:opacity-100">
          <Tooltip><TooltipTrigger asChild><button type="button" aria-label={t('common.edit')} onClick={(event) => { event.stopPropagation(); onEdit() }} className="nodrag nopan shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"><Pencil className="h-3 w-3" /></button></TooltipTrigger><TooltipContent>{t('common.edit')}</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><button type="button" aria-label={t('common.delete')} onClick={(event) => { event.stopPropagation(); setConfirming(true) }} className="nodrag nopan shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button></TooltipTrigger><TooltipContent>{t('common.delete')}</TooltipContent></Tooltip>
      </span>
      {confirming && (
        <div className="nodrag nopan absolute right-1 top-7 z-20">
          <ConfirmPopover message={t('entity.deleteProperty', { name })} onCancel={() => setConfirming(false)} onConfirm={onDelete} confirmLabel={t('common.delete')} />
        </div>
      )}
    </div>
  )
}
