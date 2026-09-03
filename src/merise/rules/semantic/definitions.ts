import type { RuleDefinition } from '../../types'

export const RULE_W001: RuleDefinition = {
  id: 'MERISE-W001',
  severity: 'warning',
  title: 'Nom peu explicite',
  explanation: 'Préférez un nom métier clair, en majuscules pour les entités et verbe pour les associations.',
}

export const RULE_W002: RuleDefinition = {
  id: 'MERISE-W002',
  severity: 'warning',
  title: 'Attribut potentiellement non atomique',
  explanation: 'Un attribut ne devrait contenir qu’une seule information.',
}

export const RULE_W003: RuleDefinition = {
  id: 'MERISE-W003',
  severity: 'warning',
  title: 'Structure répétitive suspecte',
  explanation: 'Des suffixes _1, _2… suggèrent plutôt une entité séparée.',
}

export const RULE_W004: RuleDefinition = {
  id: 'MERISE-W004',
  severity: 'warning',
  title: 'Dépendance fonctionnelle suspecte',
  explanation: 'Cette propriété semble dépendre d’une autre que de l’identifiant.',
}

export const RULE_W005: RuleDefinition = {
  id: 'MERISE-W005',
  severity: 'warning',
  title: 'Association ternaire ou de dimension supérieure',
  explanation: 'Décomposez en entité intermédiaire et associations binaires.',
}

export const RULE_W016: RuleDefinition = {
  id: 'MERISE-W016',
  severity: 'warning',
  title: 'Identifiant potentiellement instable',
  explanation: 'Préférez une clé technique stable plutôt qu’un nom, e-mail ou adresse.',
  category: 'normalization',
  certainty: 'heuristic',
}

export const RULE_W017: RuleDefinition = {
  id: 'MERISE-W017',
  severity: 'warning',
  title: 'Entité au pluriel',
  explanation: 'En MERISE, une entité se nomme au singulier (CLIENT, pas CLIENTS).',
  category: 'model',
  certainty: 'heuristic',
}

export const RULE_W019: RuleDefinition = {
  id: 'MERISE-W019',
  severity: 'warning',
  title: 'Entité sans propriété descriptive',
  explanation: 'Ajoutez des propriétés métier au-delà de l’identifiant.',
  category: 'model',
  certainty: 'heuristic',
}

export const RULE_W020: RuleDefinition = {
  id: 'MERISE-W020',
  severity: 'warning',
  title: 'Redondance entre entités liées',
  explanation: 'Évitez de dupliquer une propriété déjà portée par une entité associée.',
  category: 'normalization',
  certainty: 'heuristic',
}

export const RULE_W022: RuleDefinition = {
  id: 'MERISE-W022',
  severity: 'warning',
  title: 'Relation 1,1 des deux côtés',
  explanation: 'Vérifiez si les deux entités doivent fusionner ou recevoir une clé étrangère.',
  category: 'model',
  certainty: 'heuristic',
}

export const RULE_W025: RuleDefinition = {
  id: 'MERISE-W025',
  severity: 'warning',
  title: 'Identifiant booléen',
  explanation: 'Un booléen ne distingue que deux occurrences.',
  category: 'model',
  certainty: 'certain',
}

export type SemanticRule = (
  project: import('@/domain').Project,
  issues: import('../../types').ValidationIssue[],
) => void
