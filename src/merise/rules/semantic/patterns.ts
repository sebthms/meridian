import { physicalIdentifier } from '@/sql/naming'

export const SUSPICIOUS_ENTITY_NAMES = /^(entit[ée][0-9]*|table_temp|objet|entity[0-9]*|table|data|info|record|temp|obj)$/i
export const SUSPICIOUS_ASSOCIATION_NAMES = /^(association|assoc|lien|link|relation|ref|reference|join|table)$/i
export const PLURAL_ENTITY_SUFFIX = /(?:s|aux|eaux|x)$/i

export const NON_ATOMIC_SPLITTERS: RegExp[] = [
  /,/,
  /;/,
  /\//,
  /\s(?:et|and|ou|or)\s/i,
  /\s(?:rue|avenue|bd|boulevard)\s/i,
]

export const REPEATED_ATTR_SUFFIX = /^(.+?)(?:_(\d+)|(\d+))$/

export const UNSTABLE_IDENTIFIER_NAMES = new Set([
  'nom',
  'prenom',
  'name',
  'firstname',
  'lastname',
  'email',
  'e_mail',
  'mail',
  'telephone',
  'tel',
  'phone',
  'adresse',
  'address',
  'date_naissance',
  'birth_date',
  'siret',
  'ssn',
  'numero_secu',
  'cp',
  'code_postal',
  'ville',
  'city',
  'iban',
  'numero',
])

export const CALCULATED_FIELD_RULES: Array<{ names: Set<string>; dependencies: string[]; allRequired?: boolean }> = [
  { names: new Set(['age']), dependencies: ['date_naissance', 'birth_date', 'date_of_birth'] },
  { names: new Set(['montant_ttc']), dependencies: ['montant_ht', 'montant_tva'], allRequired: true },
  { names: new Set(['line_total', 'montant_ligne']), dependencies: ['quantity', 'quantite', 'unit_price', 'prix_unitaire'], allRequired: false },
  { names: new Set(['total', 'somme', 'montant_total']), dependencies: ['montant', 'prix', 'quantite', 'quantity'], allRequired: false },
  { names: new Set(['solde', 'balance']), dependencies: ['debit', 'credit', 'montant'], allRequired: false },
  { names: new Set(['duree', 'duration']), dependencies: ['date_debut', 'date_fin', 'start_date', 'end_date'], allRequired: true },
  { names: new Set(['nb_', 'count_']), dependencies: [], allRequired: false },
]

export function normalizedAttrName(name: string): string {
  return physicalIdentifier(name)
}

export function isCalculatedCandidate(
  name: string,
  siblingNames: Map<string, string>,
): { dependencies: string[] } | null {
  const normalized = normalizedAttrName(name)
  for (const rule of CALCULATED_FIELD_RULES) {
    const matches = [...rule.names].some((candidate) => normalized === candidate || normalized.startsWith(candidate))
    if (!matches) continue
    const present = rule.dependencies.filter((dependency) => siblingNames.has(normalizedAttrName(dependency)))
    if (rule.allRequired === false && present.length > 0) return { dependencies: present }
    if (present.length === rule.dependencies.length && rule.dependencies.length > 0) return { dependencies: present }
    if (normalized.startsWith('nb_') || normalized.startsWith('count_')) return { dependencies: present }
  }
  if (/^(total|somme|moyenne|average|ttc|ht|tva)$/i.test(normalized)) {
    return { dependencies: [] }
  }
  return null
}
