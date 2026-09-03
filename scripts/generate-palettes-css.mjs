import fs from 'node:fs'
import { buildAllPalettes, validatePaletteContrasts } from './palette-definitions.mjs'

function formatBlock(selector, vars) {
  const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`)
  return `${selector} {\n${lines.join('\n')}\n}`
}

const failures = validatePaletteContrasts(4.5)
if (failures.length > 0) {
  console.error('Contrast failures:\n' + failures.join('\n'))
  process.exit(1)
}

let css = '/* Généré par scripts/generate-palettes-css.mjs — ne pas éditer à la main */\n\n'

for (const palette of buildAllPalettes()) {
  css += `${formatBlock(`html[data-palette="${palette.id}"]`, palette.light)}\n\n`
  css += `${formatBlock(`html[data-palette="${palette.id}"].dark`, palette.dark)}\n\n`
}

fs.writeFileSync('src/styles/palettes.css', css)
console.log(`Wrote src/styles/palettes.css (${css.length} chars, contrast OK)`)
