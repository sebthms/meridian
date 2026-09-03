export type PaletteId = 'noisette' | 'ardoise' | 'lavande'

export type PalettePreview = {
  primary: string
  secondary: string
  accent: string
}

export type PaletteDefinition = {
  id: PaletteId
  label: string
  preview: PalettePreview
}

const STORAGE_KEY = 'merise-palette'

export const DEFAULT_PALETTE_ID: PaletteId = 'ardoise'

const LEGACY_PALETTE_MAP: Record<string, PaletteId> = {
  ocean: 'ardoise',
  forest: 'noisette',
  amber: 'noisette',
  violet: 'ardoise',
  sunset: 'noisette',
  rose: 'noisette',
  lin: 'ardoise',
  brume: 'ardoise',
  sauge: 'lavande',
}

/** Nettoie d’anciennes surcharges inline avant d’activer une palette CSS. */
const INLINE_PALETTE_VARS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--muted',
  '--muted-foreground',
  '--border',
  '--input',
  '--canvas',
  '--node',
  '--node-header',
  '--node-border',
  '--sidebar-background',
  '--sidebar-foreground',
  '--sidebar-border',
  '--base-primary',
  '--base-secondary',
  '--base-accent',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--accent',
  '--accent-foreground',
  '--warning',
  '--warning-foreground',
  '--info',
  '--info-foreground',
  '--constraint-null',
  '--constraint-required',
  '--constraint-unique',
  '--ring',
  '--selection',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-ring',
] as const

export const PALETTES: PaletteDefinition[] = [
  {
    id: 'noisette',
    label: 'Noisette',
    preview: { primary: '25 28% 38%', secondary: '30 20% 68%', accent: '18 24% 52%' },
  },
  {
    id: 'ardoise',
    label: 'Ardoise',
    preview: { primary: '215 22% 42%', secondary: '210 16% 68%', accent: '200 20% 55%' },
  },
  {
    id: 'lavande',
    label: 'Lavande',
    preview: { primary: '272 24% 42%', secondary: '268 16% 68%', accent: '285 20% 52%' },
  },
]

const paletteMap = new Map(PALETTES.map((palette) => [palette.id, palette]))

export function isPaletteId(value: string): value is PaletteId {
  return paletteMap.has(value as PaletteId)
}

export function resolvePaletteId(value: string): PaletteId {
  if (isPaletteId(value)) return value
  return LEGACY_PALETTE_MAP[value] ?? DEFAULT_PALETTE_ID
}

export function getPalette(id: PaletteId): PaletteDefinition {
  return paletteMap.get(id) ?? paletteMap.get(DEFAULT_PALETTE_ID)!
}

export function getInitialPalette(): PaletteId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return resolvePaletteId(stored)
  } catch {
    /* localStorage indisponible */
  }
  return DEFAULT_PALETTE_ID
}

export function persistPalette(id: PaletteId) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* localStorage indisponible */
  }
}

/** Active une palette via l’attribut data-palette (règles dans styles/palettes.css). */
export function applyPalette(id: PaletteId) {
  const root = document.documentElement
  for (const key of INLINE_PALETTE_VARS) {
    root.style.removeProperty(key)
  }
  root.dataset.palette = id
}
