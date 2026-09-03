// Migration mécanique des chemins approuvés dans MIGRATION.md.
// Sans --apply : inventaire seulement. Aucun changement de logique métier.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stage = process.argv.find((argument) => /^L[345]$/.test(argument))
if (!stage) throw new Error('Usage: node scripts/migrate-layout.mjs L3|L4|L5 [--apply]')
const apply = process.argv.includes('--apply')
const absolute = (relative) => {
  const result = path.resolve(root, relative)
  if (!result.startsWith(`${root}${path.sep}`)) throw new Error(`Path outside workspace: ${relative}`)
  return result
}
const kebab = (file) => file.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const plan = fs.readFileSync(absolute('MIGRATION.md'), 'utf8')
const moves = new Map([...plan.matchAll(/^\| `(src\/[^`]+)` \| `(src\/[^`]+)` \| (L[1-5](?: \+ L4)?) \|$/gm)]
  .filter((match) => match[3].includes(stage))
  .map((match) => [match[3].includes('L2') ? `${path.posix.dirname(match[1])}/${kebab(path.posix.basename(match[1]))}` : match[1], match[2]]))

for (const [from, to] of moves) {
  if (!fs.existsSync(absolute(from)) || fs.existsSync(absolute(to))) throw new Error(`Invalid move: ${from} -> ${to}`)
}
const files = new Map()
function walk(directory) {
  for (const entry of fs.readdirSync(absolute(directory), { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`
    if (entry.isDirectory()) walk(relative)
    else if (entry.isFile()) files.set(relative, fs.readFileSync(absolute(relative), 'utf8'))
  }
}
walk('src')

const panelExports = {
  PanelView: '@/app/workspace/panel-view', SIDEBAR_PANELS: '@/app/workspace/panel-view',
  PanelContent: '@/app/workspace/panel-content', sidebarLayout: '@/shared/layout/panel-layout',
  PanelShell: '@/shared/components/panel-shell',
  IssuesPanel: '@/features/validation/components/issues-panel',
  SqlPanel: '@/features/sql-export/components/sql-panel',
  ProjectTreePanel: '@/features/diagram/components/project-tree-panel',
  ProjectManagerPanel: '@/features/project-library/components/project-manager-panel',
  SettingsPanel: '@/features/settings/components/settings-panel',
}
const rewrites = []
for (const [from, original] of files) {
  const to = moves.get(from) ?? from
  let content = original
  if (stage === 'L4') {
    content = content.replace(/import\s+(type\s+)?\{([^}]+)\}\s+from\s+(['"])@\/components\/panel\3/g, (_, typeOnly, names) =>
      names.split(',').map((name) => name.trim()).filter(Boolean).map((name) => {
        const symbol = name.replace(/^type\s+/, '').split(/\s+as\s+/)[0]
        if (!panelExports[symbol]) throw new Error(`Unknown panel export: ${symbol}`)
        return `import ${typeOnly ?? ''}{ ${name} } from '${panelExports[symbol]}'`
      }).join('\n'))
  }
  content = content.replace(/(['"])(@\/[^'"\n]+|\.{1,2}\/[^'"\n]+)\1/g, (match, quote, specifier) => {
    const base = path.posix.normalize(specifier.startsWith('@/') ? `src/${specifier.slice(2)}` : `${path.posix.dirname(from)}/${specifier}`)
    const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, `${base}/index.ts`, `${base}/index.tsx`].find((candidate) =>
      files.has(candidate) || (fs.existsSync(absolute(candidate)) && fs.statSync(absolute(candidate)).isFile()))
    if (!resolved) return match
    const destination = moves.get(resolved) ?? resolved
    if (from === to && destination === resolved) return match
    let reference = specifier.startsWith('@/') ? `@/${destination.slice(4)}` : path.posix.relative(path.posix.dirname(to), destination)
    if (!reference.startsWith('@/') && !reference.startsWith('.')) reference = `./${reference}`
    if (!/\.(ts|tsx|json|css)$/.test(specifier)) reference = reference.replace(/\.(ts|tsx)$/, '')
    return `${quote}${reference}${quote}`
  })
  if (from !== to || content !== original) rewrites.push({ from, to, content })
}
console.log(JSON.stringify({ stage, apply, moves: moves.size, rewrittenFiles: rewrites.length }))
if (apply) {
  for (const { from, to, content } of rewrites) {
    fs.mkdirSync(path.dirname(absolute(to)), { recursive: true })
    if (from !== to) fs.renameSync(absolute(from), absolute(to))
    fs.writeFileSync(absolute(to), content)
  }
}
