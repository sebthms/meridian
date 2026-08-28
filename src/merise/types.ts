export type Severity = 'error' | 'warning' | 'info'

export type ValidationIssue = {
  id: string
  ruleId: string
  severity: Severity
  title: string
  explanation: string
  targetIds: string[]
}

export type RuleDefinition = {
  id: string
  severity: Severity
  title: string
  explanation: string
  autoFixable?: boolean
}

export function makeIssue(
  rule: RuleDefinition,
  targetIds: string[],
  explanation?: string,
): ValidationIssue {
  return {
    id: `${rule.id}:${targetIds.join('|') || 'root'}`,
    ruleId: rule.id,
    severity: rule.severity,
    title: rule.title,
    explanation: explanation ?? rule.explanation,
    targetIds,
  }
}