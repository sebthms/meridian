import type { Project } from '@/domain'
import type { ValidationIssue } from '../../types'
import { makeIssue } from '../../types'
import { RULE_E003 } from './definitions'
import {
  entityHasName,
  entityHasIdentifier,
  attributeHasName,
  noDuplicateAttributes,
  identifierIsValid,
  attributeTypeIsValid,
  physicalNamesAreUnique,
} from './entity-rules'
import {
  associationHasName,
  associationIsConnected,
  cardinalityIsValid,
  cardinalityIsComplete,
} from './association-rules'
import {
  inheritanceReferencesAreValid,
  inheritanceHasNoCycle,
  constraintReferencesAreValid,
  cifReferencesAreValid,
  businessRulesAreValid,
} from './conceptual-rules'

export const structuralRules: Array<(project: Project, issues: ValidationIssue[]) => void> = [
  entityHasName,
  entityHasIdentifier,
  attributeHasName,
  noDuplicateAttributes,
  identifierIsValid,
  attributeTypeIsValid,
  associationHasName,
  associationIsConnected,
  cardinalityIsValid,
  cardinalityIsComplete,
  physicalNamesAreUnique,
  inheritanceReferencesAreValid,
  inheritanceHasNoCycle,
  constraintReferencesAreValid,
  cifReferencesAreValid,
  businessRulesAreValid,
]

export { RULE_E003 }
export { makeIssue }
