import { describe, expect, it } from 'vitest'
import { makeEntity } from '@/test-support/project-fixtures'
import { treePropertyDetails } from './tree-property-details'

describe('Présentation des propriétés', () => {
  it('décrit la clé principale sans modifier l’entité', () => {
    const entity = makeEntity('CLIENT', { attrs: [['id', 'INTEGER']], identifierAttrNames: ['id'] })
    const before = JSON.stringify(entity)
    expect(treePropertyDetails(entity.attributes[0], entity)).toMatchObject({
      type: 'INTEGER', isIdentifier: true, constraints: ['PK', 'NOT NULL', 'UNIQUE'],
    })
    expect(JSON.stringify(entity)).toBe(before)
  })

  it('décrit une propriété nullable sans entité', () => {
    expect(treePropertyDetails({ id: 'a', name: 'libelle', conceptualType: 'TEXT', nullable: true })).toMatchObject({
      type: 'TEXT', isIdentifier: false, constraints: ['NULL'],
    })
  })

  it('conserve le fallback pour un type invalide', () => {
    expect(treePropertyDetails({ id: 'a', name: 'nombre', conceptualType: 'DECIMAL', typeConfig: { numeric: { kind: 'DECIMAL', precision: -1 } } }).type).toBe('Type invalide')
  })
})
