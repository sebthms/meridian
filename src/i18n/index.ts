import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from './config'
import { en, fr } from './messages'

function detectLocale(): Locale {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCALE
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
  } catch {
    /* localStorage unavailable */
  }
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')) return 'en'
  return DEFAULT_LOCALE
}

const locale = detectLocale()
if (typeof document !== 'undefined') {
  document.documentElement.lang = locale
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: locale,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
})

export function initI18n() {
  /* compat — init au chargement du module */
}

export function setAppLocale(next: Locale) {
  void i18n.changeLanguage(next)
  if (typeof document !== 'undefined') document.documentElement.lang = next
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  } catch {
    /* localStorage unavailable */
  }
}

export function getAppLocale(): Locale {
  const lng = i18n.language
  return lng === 'en' ? 'en' : 'fr'
}

export default i18n
