import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmPopover } from '@/shared/components/confirm-popover'
import { settingsFieldClass } from '@/features/settings/components/settings-row'
import { useProjectStore } from '@/store/project-store'
import { cn } from '@/shared/utils/cn'

export function ClearProjectsButton({ onCleared }: { onCleared?: () => void }) {
  const { t } = useTranslation()
  const projects = useProjectStore((state) => state.projects)
  const clearAllProjects = useProjectStore((state) => state.clearAllProjects)
  const [confirming, setConfirming] = useState(false)
  const disabled = projects.length === 0

  return (
    <div className="relative">
      <button
        type="button"
        id="clear-projects-button"
        aria-label={t('settings.clearProjects')}
        disabled={disabled}
        onClick={() => setConfirming(true)}
        className={cn(
          settingsFieldClass,
          'justify-between gap-3 px-3 text-xs hover:bg-destructive/5 hover:border-destructive/40 disabled:pointer-events-none disabled:opacity-40',
        )}
      >
        <span className="truncate text-muted-foreground">{t('settings.clearPrompt')}</span>
        <Trash2 className="size-4 shrink-0 text-destructive" aria-hidden />
      </button>
      {confirming && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50">
          <ConfirmPopover
            message={t('settings.clearConfirm')}
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              clearAllProjects()
              setConfirming(false)
              onCleared?.()
            }}
            confirmLabel={t('common.delete')}
          />
        </div>
      )}
    </div>
  )
}
