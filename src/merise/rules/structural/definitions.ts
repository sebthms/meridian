import type { Project } from '@/domain'
import type { RuleDefinition, ValidationIssue } from '../../types'

export const RULE_E001: RuleDefinition = {
  id: 'MERISE-E001',
  severity: 'error',
  title: 'Entité sans nom',
  explanation: 'Donnez un nom métier à chaque entité.',
}

export const RULE_E002: RuleDefinition = {
  id: 'MERISE-E002',
  severity: 'error',
  title: 'Entité sans identifiant',
  explanation: 'Ajoutez au moins une propriété identifiante par entité.',
}

export const RULE_E003: RuleDefinition = {
  id: 'MERISE-E003',
  severity: 'error',
  title: 'Attribut sans nom',
  explanation: 'Chaque propriété doit avoir un nom.',
}

export const RULE_E004: RuleDefinition = {
  id: 'MERISE-E004',
  severity: 'error',
  title: 'Attribut dupliqué',
  explanation: 'Deux propriétés ne peuvent pas porter le même nom dans un même objet.',
}

export const RULE_E005: RuleDefinition = {
  id: 'MERISE-E005',
  severity: 'error',
  title: 'Identifiant invalide',
  explanation: 'Un identifiant doit référencer des propriétés existantes, sans doublon.',
}

export const RULE_E006: RuleDefinition = {
  id: 'MERISE-E006',
  severity: 'error',
  title: 'Association sans nom',
  explanation: 'Nommez l’association avec un verbe métier.',
}

export const RULE_E007: RuleDefinition = {
  id: 'MERISE-E007',
  severity: 'error',
  title: 'Association mal connectée',
  explanation: 'Reliez exactement deux entités existantes.',
}

export const RULE_E008: RuleDefinition = {
  id: 'MERISE-E008',
  severity: 'error',
  title: 'Cardinalité invalide',
  explanation: 'Utilisez 0,1 · 1,1 · 0,N ou 1,N.',
}

export const RULE_E009: RuleDefinition = {
  id: 'MERISE-E009',
  severity: 'error',
  title: 'Association sans cardinalités complètes',
  explanation: 'Renseignez une cardinalité à chaque extrémité.',
}

export const RULE_E010: RuleDefinition = {
  id: 'MERISE-E010',
  severity: 'error',
  title: 'Référence vers entité supprimée',
  explanation: 'Supprimez ou recâblez les liens vers des objets absents.',
}

export const RULE_E011: RuleDefinition = {
  id: 'MERISE-E011',
  severity: 'error',
  title: 'Type conceptuel invalide',
  explanation: 'Choisissez un type conceptuel pris en charge.',
}

export const RULE_E012: RuleDefinition = {
  id: 'MERISE-E012',
  severity: 'error',
  title: 'Nom physique dupliqué',
  explanation: 'Distinguez les noms qui deviennent identiques en SQL.',
}

export const RULE_E020: RuleDefinition = {
  id: 'MERISE-E020',
  severity: 'error',
  title: 'Héritage sans parent valide',
  explanation: 'Pointez une entité parente existante, distincte de ses enfants.',
}

export const RULE_E021: RuleDefinition = {
  id: 'MERISE-E021',
  severity: 'error',
  title: 'Héritage — enfant invalide',
  explanation: 'Chaque enfant doit être une entité existante, sans doublon.',
}

export const RULE_E022: RuleDefinition = {
  id: 'MERISE-E022',
  severity: 'error',
  title: 'Cycle d’héritage',
  explanation: 'Un héritage ne doit pas former de boucle.',
}

export const RULE_E023: RuleDefinition = {
  id: 'MERISE-E023',
  severity: 'error',
  title: 'Contrainte — référence invalide',
  explanation: 'La contrainte ne doit viser que des objets présents dans le diagramme.',
}

export const RULE_E024: RuleDefinition = {
  id: 'MERISE-E024',
  severity: 'error',
  title: 'Contrainte sans nom',
  explanation: 'Nommez chaque contrainte d’intégrité.',
}

export const RULE_E025: RuleDefinition = {
  id: 'MERISE-E025',
  severity: 'error',
  title: 'CIF — entités invalides',
  explanation: 'Une CIF relie deux entités distinctes et existantes.',
}

export const RULE_E026: RuleDefinition = {
  id: 'MERISE-E026',
  severity: 'error',
  title: 'CIF — dépendance fonctionnelle absente',
  explanation: 'Reliez d’abord les entités par une association avec cardinalité max 1 côté cible.',
}

export const RULE_E027: RuleDefinition = {
  id: 'MERISE-E027',
  severity: 'error',
  title: 'Règle métier incomplète',
  explanation: 'Renseignez le nom et la description de la règle métier.',
}

export const RULE_E028: RuleDefinition = {
  id: 'MERISE-E028',
  severity: 'error',
  title: 'Règle métier — référence invalide',
  explanation: 'La règle métier ne doit viser que des objets présents dans le diagramme.',
}

export const RULE_BR001: RuleDefinition = {
  id: 'MERISE-BR001',
  severity: 'info',
  title: 'Règle métier',
  explanation: 'Règle métier documentée sur le modèle.',
}

export type StructuralRule = (
  project: Project,
  issues: ValidationIssue[],
) => void
