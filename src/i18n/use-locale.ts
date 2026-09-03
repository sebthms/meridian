import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LOCALE_LABELS, LOCALES, type Locale } from '@/i18n/config'
import { getAppLocale, setAppLocale } from '@/i18n/index'

export function useLocale() {
  const { i18n } = useTranslation()
  const locale = getAppLocale()

  const setLocale = useCallback((next: Locale) => {
    setAppLocale(next)
    void i18n.changeLanguage(next)
  }, [i18n])

  return { locale, setLocale, locales: LOCALES, localeLabels: LOCALE_LABELS }
}
