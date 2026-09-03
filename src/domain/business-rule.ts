export const BUSINESS_RULE_LEVELS = ['info', 'warning', 'error'] as const
export type BusinessRuleLevel = (typeof BUSINESS_RULE_LEVELS)[number]

export type BusinessRule = {
  id: string
  name: string
  description: string
  level: BusinessRuleLevel
  targetIds: string[]
  position: { x: number; y: number }
}

export function isBusinessRuleLevel(value: unknown): value is BusinessRuleLevel {
  return BUSINESS_RULE_LEVELS.includes(value as BusinessRuleLevel)
}

export function isBusinessRule(value: unknown): value is BusinessRule {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<BusinessRule>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    isBusinessRuleLevel(item.level) &&
    Array.isArray(item.targetIds) &&
    item.targetIds.every((id) => typeof id === 'string') &&
    typeof item.position === 'object' &&
    item.position !== null
  )
}

export function createBusinessRule(
  id: string,
  name = 'REGLE',
  position = { x: 0, y: 0 },
): BusinessRule {
  return {
    id,
    name,
    description: '',
    level: 'info',
    targetIds: [],
    position,
  }
}

export const BUSINESS_RULE_LEVEL_LABEL: Record<BusinessRuleLevel, string> = {
  info: 'Information',
  warning: 'Avertissement',
  error: 'Erreur',
}
