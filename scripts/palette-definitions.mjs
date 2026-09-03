/** Source unique des palettes pastel/neutres — importée par generate-palettes-css.mjs et les tests. */

/** @typedef {'noisette' | 'ardoise' | 'lavande'} PaletteId */

/** @typedef {{ id: PaletteId; label: string; preview: { primary: string; secondary: string; accent: string } }} PaletteMeta */

/** @type {PaletteMeta[]} */
export const PALETTE_META = [
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

const NEAR_WHITE = '210 20% 98%'
const NEAR_BLACK = '25 10% 12%'
const NEAR_BLACK_COOL = '220 15% 12%'
const NEAR_BLACK_LAVENDER = '275 12% 12%'

/** @param {string} fg @param {string} bg */
function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(hslToRgb(...Object.values(parseHsl(fg))))
  const l2 = relativeLuminance(hslToRgb(...Object.values(parseHsl(bg))))
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/** @type {Record<PaletteId, { light: Record<string, string>; dark: Record<string, string> }>} */
const PALETTE_TOKENS = {
  noisette: {
    light: {
      '--background': '30 16% 96%',
      '--foreground': '25 12% 14%',
      '--card': '30 12% 99%',
      '--card-foreground': '25 12% 14%',
      '--popover': '30 12% 99%',
      '--popover-foreground': '25 12% 14%',
      '--muted': '30 14% 93%',
      '--muted-foreground': '25 8% 40%',
      '--border': '28 12% 87%',
      '--input': '28 12% 84%',
      '--canvas': '30 14% 95%',
      '--node': '30 12% 99%',
      '--node-header': '30 16% 94%',
      '--node-border': '28 12% 86%',
      '--sidebar-background': '30 14% 97%',
      '--sidebar-foreground': '25 12% 14%',
      '--sidebar-border': '28 12% 88%',
      '--base-primary': '25 28% 38%',
      '--base-secondary': '30 20% 68%',
      '--base-accent': '18 24% 52%',
      '--primary': '25 28% 38%',
      '--primary-foreground': NEAR_WHITE,
      '--secondary': '30 14% 91%',
      '--secondary-foreground': '25 12% 14%',
      '--accent': '30 18% 93%',
      '--accent-foreground': '25 12% 14%',
      '--warning': '28 50% 46%',
      '--warning-foreground': NEAR_WHITE,
      '--info': '30 14% 91%',
      '--info-foreground': '25 22% 30%',
      '--ring': '25 28% 38%',
      '--selection': '25 28% 38%',
      '--sidebar-primary': '25 28% 38%',
      '--sidebar-primary-foreground': NEAR_WHITE,
      '--sidebar-accent': '30 16% 92%',
      '--sidebar-accent-foreground': '25 12% 14%',
      '--sidebar-ring': '25 28% 38%',
    },
    dark: {
      '--background': '25 8% 10%',
      '--foreground': '30 10% 91%',
      '--card': '25 8% 13%',
      '--card-foreground': '30 10% 91%',
      '--popover': '25 8% 13%',
      '--popover-foreground': '30 10% 91%',
      '--muted': '25 7% 17%',
      '--muted-foreground': '28 7% 61%',
      '--border': '25 7% 22%',
      '--input': '25 7% 26%',
      '--canvas': '25 8% 9%',
      '--node': '25 8% 13%',
      '--node-header': '25 8% 16%',
      '--node-border': '25 7% 24%',
      '--sidebar-background': '25 8% 11%',
      '--sidebar-foreground': '30 10% 91%',
      '--sidebar-border': '25 7% 21%',
      '--base-primary': '28 22% 58%',
      '--base-secondary': '30 14% 52%',
      '--base-accent': '18 20% 48%',
      '--primary': '28 22% 58%',
      '--primary-foreground': NEAR_BLACK,
      '--secondary': '25 7% 18%',
      '--secondary-foreground': '30 10% 91%',
      '--accent': '25 7% 18%',
      '--accent-foreground': '30 10% 91%',
      '--warning': '28 40% 52%',
      '--warning-foreground': NEAR_BLACK,
      '--info': '25 7% 18%',
      '--info-foreground': '30 12% 70%',
      '--ring': '28 22% 58%',
      '--selection': '28 22% 58%',
      '--sidebar-primary': '28 22% 58%',
      '--sidebar-primary-foreground': NEAR_BLACK,
      '--sidebar-accent': '25 7% 18%',
      '--sidebar-accent-foreground': '30 10% 91%',
      '--sidebar-ring': '28 22% 58%',
    },
  },
  ardoise: {
    light: {
      '--background': '214 16% 97%',
      '--foreground': NEAR_BLACK_COOL,
      '--card': '214 12% 99%',
      '--card-foreground': NEAR_BLACK_COOL,
      '--popover': '214 12% 99%',
      '--popover-foreground': NEAR_BLACK_COOL,
      '--muted': '214 14% 94%',
      '--muted-foreground': '215 8% 40%',
      '--border': '214 12% 88%',
      '--input': '214 12% 85%',
      '--canvas': '214 14% 96%',
      '--node': '214 12% 99%',
      '--node-header': '214 16% 95%',
      '--node-border': '214 12% 87%',
      '--sidebar-background': '214 14% 98%',
      '--sidebar-foreground': NEAR_BLACK_COOL,
      '--sidebar-border': '214 12% 89%',
      '--base-primary': '215 22% 42%',
      '--base-secondary': '210 16% 68%',
      '--base-accent': '200 20% 55%',
      '--primary': '215 22% 42%',
      '--primary-foreground': NEAR_WHITE,
      '--secondary': '214 14% 92%',
      '--secondary-foreground': NEAR_BLACK_COOL,
      '--accent': '214 16% 93%',
      '--accent-foreground': NEAR_BLACK_COOL,
      '--warning': '38 55% 48%',
      '--warning-foreground': NEAR_WHITE,
      '--info': '214 14% 92%',
      '--info-foreground': '215 18% 32%',
      '--ring': '215 22% 42%',
      '--selection': '215 22% 42%',
      '--sidebar-primary': '215 22% 42%',
      '--sidebar-primary-foreground': NEAR_WHITE,
      '--sidebar-accent': '214 16% 92%',
      '--sidebar-accent-foreground': NEAR_BLACK_COOL,
      '--sidebar-ring': '215 22% 42%',
    },
    dark: {
      '--background': '220 12% 10%',
      '--foreground': '210 14% 92%',
      '--card': '220 11% 13%',
      '--card-foreground': '210 14% 92%',
      '--popover': '220 11% 13%',
      '--popover-foreground': '210 14% 92%',
      '--muted': '220 10% 17%',
      '--muted-foreground': '215 8% 62%',
      '--border': '220 9% 22%',
      '--input': '220 9% 26%',
      '--canvas': '220 12% 9%',
      '--node': '220 11% 13%',
      '--node-header': '220 11% 16%',
      '--node-border': '220 9% 24%',
      '--sidebar-background': '220 11% 11%',
      '--sidebar-foreground': '210 14% 92%',
      '--sidebar-border': '220 9% 21%',
      '--base-primary': '215 18% 62%',
      '--base-secondary': '210 14% 55%',
      '--base-accent': '200 16% 52%',
      '--primary': '215 18% 62%',
      '--primary-foreground': NEAR_BLACK_COOL,
      '--secondary': '220 10% 18%',
      '--secondary-foreground': '210 14% 92%',
      '--accent': '220 10% 18%',
      '--accent-foreground': '210 14% 92%',
      '--warning': '38 45% 55%',
      '--warning-foreground': NEAR_BLACK,
      '--info': '220 10% 18%',
      '--info-foreground': '210 12% 72%',
      '--ring': '215 18% 62%',
      '--selection': '215 18% 62%',
      '--sidebar-primary': '215 18% 62%',
      '--sidebar-primary-foreground': NEAR_BLACK_COOL,
      '--sidebar-accent': '220 10% 18%',
      '--sidebar-accent-foreground': '210 14% 92%',
      '--sidebar-ring': '215 18% 62%',
    },
  },
  lavande: {
    light: {
      '--background': '272 14% 97%',
      '--foreground': NEAR_BLACK_LAVENDER,
      '--card': '272 12% 99%',
      '--card-foreground': NEAR_BLACK_LAVENDER,
      '--popover': '272 12% 99%',
      '--popover-foreground': NEAR_BLACK_LAVENDER,
      '--muted': '272 14% 94%',
      '--muted-foreground': '275 8% 40%',
      '--border': '272 12% 88%',
      '--input': '272 12% 85%',
      '--canvas': '272 14% 96%',
      '--node': '272 12% 99%',
      '--node-header': '272 16% 95%',
      '--node-border': '272 12% 87%',
      '--sidebar-background': '272 14% 98%',
      '--sidebar-foreground': NEAR_BLACK_LAVENDER,
      '--sidebar-border': '272 12% 89%',
      '--base-primary': '272 24% 42%',
      '--base-secondary': '268 16% 68%',
      '--base-accent': '285 20% 52%',
      '--primary': '272 24% 42%',
      '--primary-foreground': NEAR_WHITE,
      '--secondary': '272 14% 92%',
      '--secondary-foreground': NEAR_BLACK_LAVENDER,
      '--accent': '272 16% 93%',
      '--accent-foreground': NEAR_BLACK_LAVENDER,
      '--warning': '38 55% 48%',
      '--warning-foreground': NEAR_WHITE,
      '--info': '272 14% 92%',
      '--info-foreground': '272 18% 32%',
      '--ring': '272 24% 42%',
      '--selection': '272 24% 42%',
      '--sidebar-primary': '272 24% 42%',
      '--sidebar-primary-foreground': NEAR_WHITE,
      '--sidebar-accent': '272 16% 92%',
      '--sidebar-accent-foreground': NEAR_BLACK_LAVENDER,
      '--sidebar-ring': '272 24% 42%',
    },
    dark: {
      '--background': '275 10% 10%',
      '--foreground': '272 12% 92%',
      '--card': '275 9% 13%',
      '--card-foreground': '272 12% 92%',
      '--popover': '275 9% 13%',
      '--popover-foreground': '272 12% 92%',
      '--muted': '275 8% 17%',
      '--muted-foreground': '272 8% 62%',
      '--border': '275 8% 22%',
      '--input': '275 8% 26%',
      '--canvas': '275 10% 9%',
      '--node': '275 9% 13%',
      '--node-header': '275 9% 16%',
      '--node-border': '275 8% 24%',
      '--sidebar-background': '275 9% 11%',
      '--sidebar-foreground': '272 12% 92%',
      '--sidebar-border': '275 8% 21%',
      '--base-primary': '272 20% 60%',
      '--base-secondary': '268 14% 54%',
      '--base-accent': '285 18% 50%',
      '--primary': '272 20% 60%',
      '--primary-foreground': NEAR_BLACK_LAVENDER,
      '--secondary': '275 8% 18%',
      '--secondary-foreground': '272 12% 92%',
      '--accent': '275 8% 18%',
      '--accent-foreground': '272 12% 92%',
      '--warning': '38 45% 55%',
      '--warning-foreground': NEAR_BLACK,
      '--info': '275 8% 18%',
      '--info-foreground': '272 12% 72%',
      '--ring': '272 20% 60%',
      '--selection': '272 20% 60%',
      '--sidebar-primary': '272 20% 60%',
      '--sidebar-primary-foreground': NEAR_BLACK_LAVENDER,
      '--sidebar-accent': '275 8% 18%',
      '--sidebar-accent-foreground': '272 12% 92%',
      '--sidebar-ring': '272 20% 60%',
    },
  },
}

/** @param {PaletteId} id @param {'light'|'dark'} mode */
function constraintTokens(id, mode) {
  if (id === 'noisette') {
    return mode === 'light'
      ? {
          '--constraint-null': '25 22% 50%',
          '--constraint-required': '25 34% 38%',
          '--constraint-unique': '28 48% 42%',
        }
      : {
          '--constraint-null': '28 24% 58%',
          '--constraint-required': '28 32% 64%',
          '--constraint-unique': '22 38% 58%',
        }
  }
  if (id === 'lavande') {
    return mode === 'light'
      ? {
          '--constraint-null': '272 22% 50%',
          '--constraint-required': '272 36% 40%',
          '--constraint-unique': '285 40% 46%',
        }
      : {
          '--constraint-null': '268 20% 62%',
          '--constraint-required': '272 50% 68%',
          '--constraint-unique': '285 44% 62%',
        }
  }
  return mode === 'light'
    ? {
        '--constraint-null': '215 22% 50%',
        '--constraint-required': '215 38% 40%',
        '--constraint-unique': '200 42% 46%',
      }
    : {
        '--constraint-null': '210 20% 62%',
        '--constraint-required': '215 52% 68%',
        '--constraint-unique': '200 48% 62%',
      }
}

for (const id of ['noisette', 'ardoise', 'lavande']) {
  for (const mode of ['light', 'dark']) {
    Object.assign(PALETTE_TOKENS[id][mode], constraintTokens(id, mode))
  }
}

/** @returns {Array<{ id: PaletteId; label: string; light: Record<string, string>; dark: Record<string, string> }>} */
export function buildAllPalettes() {
  return PALETTE_META.map((meta) => ({
    id: meta.id,
    label: meta.label,
    light: { ...PALETTE_TOKENS[meta.id].light },
    dark: { ...PALETTE_TOKENS[meta.id].dark },
  }))
}

function parseHsl(token) {
  const [h, s, l] = token.split(' ')
  return { h: Number(h), s: Number(s.replace('%', '')) / 100, l: Number(l.replace('%', '')) / 100 }
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  /** @type {[number, number, number]} */
  let rgb
  if (h < 60) rgb = [c, x, 0]
  else if (h < 120) rgb = [x, c, 0]
  else if (h < 180) rgb = [0, c, x]
  else if (h < 240) rgb = [0, x, c]
  else if (h < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  return rgb.map((v) => v + m)
}

function relativeLuminance([r, g, b]) {
  const linear = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

const CONTRAST_PAIRS = [
  ['--foreground', '--background', 4.5],
  ['--foreground', '--card', 4.5],
  ['--card-foreground', '--card', 4.5],
  ['--muted-foreground', '--muted', 4.5],
  ['--primary-foreground', '--primary', 4.5],
  ['--secondary-foreground', '--secondary', 4.5],
  ['--accent-foreground', '--accent', 4.5],
  ['--sidebar-foreground', '--sidebar-background', 4.5],
  ['--sidebar-accent-foreground', '--sidebar-accent', 4.5],
  ['--sidebar-primary-foreground', '--sidebar-primary', 4.5],
  ['--info-foreground', '--info', 4.5],
]

/** @param {number} minRatio */
export function validatePaletteContrasts(minRatio = 4.5) {
  const failures = []
  for (const palette of buildAllPalettes()) {
    for (const mode of ['light', 'dark']) {
      const tokens = mode === 'light' ? palette.light : palette.dark
      for (const [fg, bg, required] of CONTRAST_PAIRS) {
        const threshold = Math.max(minRatio, required)
        const ratio = contrastRatio(tokens[fg], tokens[bg])
        if (ratio < threshold) {
          failures.push(`${palette.id}/${mode}: ${fg} on ${bg} = ${ratio.toFixed(2)} (< ${threshold})`)
        }
      }
    }
  }
  return failures
}

/** Migration depuis les anciennes palettes saturées. */
export const LEGACY_PALETTE_IDS = {
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
