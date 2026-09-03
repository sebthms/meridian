import { describe, expect, it } from 'vitest'
import { getPalette, isPaletteId, PALETTES, resolvePaletteId } from '@/shared/theme/palettes'
// @ts-expect-error — module ESM partagé avec le générateur CSS
import { validatePaletteContrasts } from '../../../scripts/palette-definitions.mjs'

describe('palettes', () => {
  it('expose 2 palettes pastel neutres', () => {
    expect(PALETTES).toHaveLength(2)
    expect(PALETTES.map((p) => p.id)).toEqual(['noisette', 'ardoise'])
    for (const palette of PALETTES) {
      expect(palette.preview.primary).toMatch(/^\d+ \d+% \d+%$/)
      expect(isPaletteId(palette.id)).toBe(true)
    }
  })

  it('migre les anciennes palettes', () => {
    expect(resolvePaletteId('lin')).toBe('ardoise')
    expect(resolvePaletteId('brume')).toBe('ardoise')
    expect(resolvePaletteId('forest')).toBe('noisette')
    expect(resolvePaletteId('unknown')).toBe('ardoise')
  })

  it('retombe sur Ardoise par défaut', () => {
    expect(getPalette('ardoise').label).toBe('Ardoise')
  })

  it('respecte WCAG AA (4.5:1) sur les paires UI critiques', () => {
    const failures = validatePaletteContrasts(4.5)
    expect(failures, failures.join('\n')).toEqual([])
  })
})
