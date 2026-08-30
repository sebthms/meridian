import type { RuleDefinition } from '../../types'

export const RULE_W001: RuleDefinition = {
  id: 'MERISE-W001',
  severity: 'warning',
  title: 'Nom suspect',
  explanation: 'Choisissez un nom métier explicite.',
}

export const RULE_W002: RuleDefinition = {
  id: 'MERISE-W002',
  severity: 'warning',
  title: 'Attribut potentiellement non atomique',
  explanation:
    'Cet attribut semble contenir plusieurs informations. Vérifiez qu\u2019il représente bien une propriété atomique au niveau conceptuel.',
}

export const RULE_W003: RuleDefinition = {
  id: 'MERISE-W003',
  severity: 'warning',
  title: 'Structure répétitive suspecte',
  explanation:
    'Plusieurs attributs semblent représenter des occurrences répétées. Une entité/association supplémentaire pourrait être nécessaire.',
}

export const RULE_W004: RuleDefinition = {
  id: 'MERISE-W004',
  severity: 'warning',
  title: 'Dépendance fonctionnelle suspecte',
  explanation:
    'Cet attribut semble dépendre d\u2019un autre attribut plutôt que de l\u2019identifiant. Vérifiez qu\u2019il n\u2019existe pas une dépendance transitive.',
}

export const RULE_W005: RuleDefinition = {
  id: 'MERISE-W005',
  severity: 'warning',
  title: 'Association ternaire ou de dimension supérieure',
  explanation:
    'Les associations à 3 participations ou plus ne sont pas prises en charge dans cette version. En MERISE, on peut les décomposer en transformant l\u2019association en entité et les liens en associations binaires.',
}

export type SemanticRule = (
  project: import('@/domain').Project,
  issues: import('../../types').ValidationIssue[],
) => void