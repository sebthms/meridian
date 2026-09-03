export type PaletteId = 'ocean' | 'forest' | 'sunset' | 'rose' | 'violet'

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

export const DEFAULT_PALETTE_ID: PaletteId = 'ocean'

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
    id: 'ocean',
    label: 'Océan',
    preview: { primary: '231 84% 60%', secondary: '183 74% 38%', accent: '38 92% 50%' },
  },
  {
    id: 'forest',
    label: 'Forêt',
    preview: { primary: '142 72% 38%', secondary: '158 64% 32%', accent: '48 96% 53%' },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    preview: { primary: '14 85% 55%', secondary: '280 65% 52%', accent: '45 95% 55%' },
  },
  {
    id: 'rose',
    label: 'Rose',
    preview: { primary: '340 75% 55%', secondary: '260 60% 50%', accent: '25 90% 58%' },
  },
  {
    id: 'violet',
    label: 'Violet',
    preview: { primary: '262 80% 58%', secondary: '199 75% 45%', accent: '152 60% 45%' },
  },
]

const paletteMap = new Map(PALETTES.map((palette) => [palette.id, palette]))

export function isPaletteId(value: string): value is PaletteId {
  return paletteMap.has(value as PaletteId)
}

export function getPalette(id: PaletteId): PaletteDefinition {
  return paletteMap.get(id) ?? paletteMap.get(DEFAULT_PALETTE_ID)!
}

export function getInitialPalette(): PaletteId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isPaletteId(stored)) return stored
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
