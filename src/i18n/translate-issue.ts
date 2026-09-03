import type { TFunction } from 'i18next'
import type { ValidationIssue } from '@/merise'

export function translateIssueTitle(issue: ValidationIssue, t: TFunction): string {
  const key = `rules.${issue.ruleId}.title`
  const translated = t(key)
  return translated === key ? issue.title : translated
}

export function translateIssueExplanation(issue: ValidationIssue, t: TFunction): string {
  const key = `rules.${issue.ruleId}.explanation`
  const translated = t(key)
  return translated === key ? issue.explanation : translated
}
