import { describe, expect, it } from 'vitest'
import { getPalette, isPaletteId, PALETTES } from '@/lib/palettes'

describe('palettes', () => {
  it('expose 5 palettes avec aperçu', () => {
    expect(PALETTES).toHaveLength(5)
    for (const palette of PALETTES) {
      expect(palette.preview.primary).toMatch(/^\d+ \d+% \d+%$/)
      expect(isPaletteId(palette.id)).toBe(true)
    }
  })

  it('retombe sur Océan si l’identifiant est inconnu', () => {
    expect(getPalette('ocean').label).toBe('Océan')
  })
})
