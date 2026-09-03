import { useCallback, useState } from 'react'
import { applyPalette, getInitialPalette, persistPalette, type PaletteId } from '@/shared/theme/palettes'
import { getInitialTheme, persistTheme, type Theme } from '@/shared/theme/theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme())
  const [palette, setPaletteState] = useState<PaletteId>(() => getInitialPalette())

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    persistTheme(next)
  }, [])

  const setPalette = useCallback((next: PaletteId) => {
    setPaletteState(next)
    applyPalette(next)
    persistPalette(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, palette, setTheme, setPalette, toggleTheme }
}
