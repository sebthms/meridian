import type { Attribute } from '../../../domain/attribute'
import { getPrimaryIdentifier, type Entity } from '../../../domain/entity'
import { attributeToSql } from '@/sql/model'

export function treePropertyDetails(attribute: Attribute, entity?: Entity) {
  const identifiers = entity?.identifiers.filter((key) => key.attributeIds.includes(attribute.id)) ?? []
  const primary = entity && getPrimaryIdentifier(entity)
  const constraints: string[] = []
  for (const key of identifiers) {
    const position = key.attributeIds.indexOf(attribute.id) + 1
    const label = key === primary ? 'PK' : `AK${entity!.identifiers.filter((item) => item !== primary).indexOf(key) + 1}`
    constraints.push(key.attributeIds.length > 1 ? `${label} ${position}/${key.attributeIds.length}` : label)
  }
  constraints.push(identifiers.length > 0 || !attribute.nullable ? 'NOT NULL' : 'NULL')
  if (attribute.unique || identifiers.some((key) => key.attributeIds.length === 1)) constraints.push('UNIQUE')
  if (identifiers.some((key) => key.attributeIds.length > 1)) constraints.push('UNIQUE composé')
  let type: string
  try {
    type = attributeToSql(attribute)
  } catch {
    type = 'Type invalide'
  }
  const config = attribute.typeConfig
  const qualifiers = [
    config?.text?.charset === 'ASCII' ? 'ASCII' : config?.text?.charset === 'UNICODE' ? 'Unicode' : undefined,
    config?.numeric?.kind === 'INTEGER' ? `${config.numeric.bits ?? 32} bits` : undefined,
    config?.numeric?.kind === 'COUNTER' ? 'Auto-incrément' : undefined,
  ].filter(Boolean)
  return { type, qualifiers, constraints, isIdentifier: identifiers.length > 0 }
}
