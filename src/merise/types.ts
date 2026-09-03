export type Severity = 'error' | 'warning' | 'info'
export type RuleContext = {
  category?: 'model' | 'normalization' | 'export'
  certainty?: 'certain' | 'heuristic' | 'manual'
  source?: { label: string; url: string }
}

export type ValidationIssue = RuleContext & {
  id: string
  ruleId: string
  severity: Severity
  title: string
  explanation: string
  targetIds: string[]
}

export type RuleDefinition = RuleContext & {
  id: string
  severity: Severity
  title: string
  explanation: string
}

export function makeIssue(
  rule: RuleDefinition,
  targetIds: string[],
  explanation?: string,
  occurrence?: string,
): ValidationIssue {
  return {
    id: `${rule.id}:${targetIds.join('|') || 'root'}${occurrence === undefined ? '' : `:${encodeURIComponent(occurrence)}`}`,
    ruleId: rule.id,
    severity: rule.severity,
    title: rule.title,
    explanation: explanation ?? rule.explanation,
    targetIds,
    category: rule.category ?? 'model',
    certainty: rule.certainty ?? (rule.severity === 'error' ? 'certain' : 'heuristic'),
    source: rule.source,
  }
}
