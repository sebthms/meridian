import { PanelShell } from '@/shared/components/panel-shell'
import { sidebarLayout } from '@/shared/layout/panel-layout'
import { ClearProjectsButton } from '@/features/settings/components/clear-projects-button'
import { LanguageSelect } from '@/features/settings/components/language-select'
import { PaletteSelect } from '@/features/settings/components/palette-select'
import { SettingsRow } from '@/features/settings/components/settings-row'
import { useTheme } from '@/shared/theme/use-theme'
import { useTranslation } from 'react-i18next'

export function SettingsPanel({
  open,
  onClose,
  variant = 'modal',
  embedded = false,
}: {
  open: boolean
  onClose: () => void
  variant?: 'modal' | 'panel'
  embedded?: boolean
}) {
  const { t } = useTranslation()
  const { palette, setPalette } = useTheme()

  const content = (
    <section className={sidebarLayout.section}>
      <SettingsRow label={t('settings.palette')} htmlFor="palette-select">
        <PaletteSelect value={palette} onChange={setPalette} />
      </SettingsRow>

      <SettingsRow label={t('settings.language')} htmlFor="language-select">
        <LanguageSelect />
      </SettingsRow>

      <SettingsRow label={t('settings.localData')}>
        <ClearProjectsButton onCleared={onClose} />
      </SettingsRow>
    </section>
  )

  return (
    <PanelShell
      open={open}
      onClose={onClose}
      ariaLabel={t('settings.title')}
      title={t('settings.title')}
      variant={variant}
      embedded={embedded}
      modalClassName="max-w-md"
      panelClassName="w-80"
    >
      {content}
    </PanelShell>
  )
}
