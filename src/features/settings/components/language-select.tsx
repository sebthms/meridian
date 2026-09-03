import { useTranslation } from 'react-i18next'
import { LOCALE_LABELS, type Locale } from '@/i18n/config'
import { useLocale } from '@/i18n/use-locale'
import { settingsFieldClass } from '@/features/settings/components/settings-row'
import { cn } from '@/shared/utils/cn'

export function LanguageSelect() {
  const { t } = useTranslation()
  const { locale, setLocale, locales } = useLocale()

  return (
    <div
      id="language-select"
      role="listbox"
      aria-label={t('settings.language')}
      className={cn(settingsFieldClass, 'grid grid-cols-2 gap-1 bg-muted/40 p-1 shadow-none')}
    >
      {locales.map((value) => {
        const selected = locale === value
        return (
          <button
            key={value}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => setLocale(value as Locale)}
            className={cn(
              'h-7 rounded-sm text-xs font-medium transition-colors',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {LOCALE_LABELS[value]}
          </button>
        )
      })}
    </div>
  )
}
