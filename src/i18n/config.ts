export const LOCALES = ['fr', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'
export const LOCALE_STORAGE_KEY = 'merise-locale'

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
}
