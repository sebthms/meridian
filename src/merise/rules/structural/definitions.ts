import type { Project } from '@/domain'
import type { RuleDefinition, ValidationIssue } from '../../types'

export const RULE_E001: RuleDefinition = {
  id: 'MERISE-E001',
  severity: 'error',
  title: 'Entité sans nom',
  explanation: 'Une entité doit posséder un nom.',
  autoFixable: false,
}

export const RULE_E002: RuleDefinition = {
  id: 'MERISE-E002',
  severity: 'error',
  title: 'Entité sans identifiant',
  explanation:
    "Chaque occurrence d'une entité doit pouvoir être distinguée des autres. Ajoutez une propriété identifiante.",
  autoFixable: false,
}

export const RULE_E003: RuleDefinition = {
  id: 'MERISE-E003',
  severity: 'error',
  title: 'Attribut sans nom',
  explanation: 'Un attribut doit posséder un nom.',
  autoFixable: true,
}

export const RULE_E004: RuleDefinition = {
  id: 'MERISE-E004',
  severity: 'error',
  title: 'Attribut dupliqué',
  explanation: 'Deux attributs ne peuvent pas avoir le même nom dans une même entité ou association.',
  autoFixable: false,
}

export const RULE_E005: RuleDefinition = {
  id: 'MERISE-E005',
  severity: 'error',
  title: 'Identifiant invalide',
  explanation: 'Un identifiant doit référencer au moins un attribut existant, sans répéter une même composante.',
  autoFixable: false,
}

export const RULE_E006: RuleDefinition = {
  id: 'MERISE-E006',
  severity: 'error',
  title: 'Association sans nom',
  explanation: 'Une association doit posséder un nom.',
  autoFixable: false,
}

export const RULE_E007: RuleDefinition = {
  id: 'MERISE-E007',
  severity: 'error',
  title: 'Association mal connectée',
  explanation: 'Dans le MVP, une association doit avoir deux participations valides.',
  autoFixable: false,
}

export const RULE_E008: RuleDefinition = {
  id: 'MERISE-E008',
  severity: 'error',
  title: 'Cardinalité invalide',
  explanation:
    'Une cardinalité doit être une des quatre formes : 0,1 · 1,1 · 0,N · 1,N.',
  autoFixable: false,
}

export const RULE_E009: RuleDefinition = {
  id: 'MERISE-E009',
  severity: 'error',
  title: 'Association sans cardinalités complètes',
  explanation: 'Chaque extrémité d\u2019une association doit avoir une cardinalité.',
  autoFixable: false,
}

export const RULE_E010: RuleDefinition = {
  id: 'MERISE-E010',
  severity: 'error',
  title: 'Référence vers entité supprimée',
  explanation: 'Aucun objet ne doit conserver un identifiant orphelin.',
  autoFixable: false,
}

export const RULE_E011: RuleDefinition = {
  id: 'MERISE-E011',
  severity: 'error',
  title: 'Type conceptuel invalide',
  explanation: 'Une propriété doit utiliser un type conceptuel pris en charge par le modèle.',
  autoFixable: false,
}

export const RULE_E012: RuleDefinition = {
  id: 'MERISE-E012',
  severity: 'error',
  title: 'Nom physique dupliqué',
  explanation: 'Deux objets produisent le même nom PostgreSQL après normalisation.',
  autoFixable: false,
}

/** Structural rules that never mutate the model. */
export type StructuralRule = (
  project: Project,
  issues: ValidationIssue[],
) => void
