import type { Project } from '@/domain'
import { structuralRules } from './rules/structural'
import { semanticRules } from './rules/semantic'
import type { ValidationIssue } from './types'

export type ValidationResult = {
  issues: ValidationIssue[]
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  infos: ValidationIssue[]
}

/**
 * Runs the full MERISE validation pipeline.
 *
 * Issues are filtered by the project's ignore system:
 *  - ignoredRules:      suppress an entire rule (by ruleId)
 *  - ignoredIssueIds:   suppress a specific occurrence (by issue id)
 */
export function validateProject(project: Project): ValidationResult {
  const raw: ValidationIssue[] = []

  structuralRules.forEach((run) => run(project, raw))
  semanticRules.forEach((run) => run(project, raw))

  const ignoredRules = new Set(project.ignoredRules ?? [])
  const ignoredIssueIds = new Set(project.ignoredIssueIds ?? [])

  const issues = raw.filter(
    (issue) => !ignoredRules.has(issue.ruleId) && !ignoredIssueIds.has(issue.id),
  )

  return {
    issues,
    errors: issues.filter((i) => i.severity === 'error'),
    warnings: issues.filter((i) => i.severity === 'warning'),
    infos: issues.filter((i) => i.severity === 'info'),
  }
}

/** Returns true when the model has no blocking errors. */
export function isModelValid(project: Project): boolean {
  return validateProject(project).errors.length === 0
}