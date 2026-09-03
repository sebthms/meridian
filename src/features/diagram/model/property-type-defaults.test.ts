import { describe, it, expect } from 'vitest'
import { propertyTypeDefaults } from './property-type-defaults'

describe('Valeurs initiales des propriétés', () => {
  it('réinitialise toutes les familles et restitue les types historiques', () => {
    const attribute = { id: 'a', name: 'a', conceptualType: 'DATE' as const }
    const before = propertyTypeDefaults(attribute)
    before.dateTimeKind = 'TIME'
    before.textCharset = 'BINARY'
    expect(propertyTypeDefaults(attribute).dateTimeKind).toBe('DATE')
    expect(propertyTypeDefaults(attribute).textCharset).toBe('ASCII')
    expect(propertyTypeDefaults({ ...attribute, conceptualType: 'DECIMAL' }).numericKind).toBe('DECIMAL')
    expect(propertyTypeDefaults({ ...attribute, conceptualType: 'TEXT' }).textStorage).toBe('LARGE')
    expect(propertyTypeDefaults().textStorage).toBe('VARIABLE')
    expect(propertyTypeDefaults().numericKind).toBe('INTEGER')
  })
})
