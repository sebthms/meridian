import { describe, expect, it } from 'vitest'
import { physicalIdentifier } from './naming'

describe('noms physiques PostgreSQL', () => {
  it('normalise les accents, espaces et caractères spéciaux', () => {
    expect(physicalIdentifier('Échéance client !')).toBe('echeance_client')
  })

  it('protège les mots réservés et les noms commençant par un chiffre', () => {
    expect(physicalIdentifier('user')).toBe('n_user')
    expect(physicalIdentifier('123 clients')).toBe('n_123_clients')
  })

  it('respecte la limite PostgreSQL de 63 octets', () => {
    expect(new TextEncoder().encode(physicalIdentifier('a'.repeat(100))).length).toBeLessThanOrEqual(63)
  })

  it('gère les noms vides avec un fallback stable', () => {
    expect(physicalIdentifier('   ', 'unnamed_table')).toBe('unnamed_table')
  })
})
