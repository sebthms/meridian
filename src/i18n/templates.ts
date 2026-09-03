import templateProjectsEn from '@/features/project-library/templates/projects.en.json'
import templateProjectsFr from '@/features/project-library/templates/projects.fr.json'
import type { Project } from '@/domain'
import type { Locale } from '@/i18n/config'

const byLocale: Record<Locale, Record<string, Project>> = {
  fr: templateProjectsFr as unknown as Record<string, Project>,
  en: templateProjectsEn as unknown as Record<string, Project>,
}

export function getTemplateProjects(locale: Locale): Record<string, Project> {
  return byLocale[locale]
}
