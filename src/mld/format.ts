import type { MldModel, MldRelation } from './model'

function columnLabel(col: { name: string; isPrimaryKey: boolean; isForeignKey: boolean; references?: { table: string; column: string } }): string {
  const flags: string[] = []
  if (col.isPrimaryKey) flags.push('PK')
  if (col.isForeignKey) flags.push('FK')
  const ref = col.isForeignKey && col.references ? ` → ${col.references.table}.${col.references.column}` : ''
  return `${col.name}${flags.length ? ' ' + flags.join('/') : ''}${ref}`
}

export function formatMld(model: MldModel): string {
  const tables = model.relations
    .map((relation: MldRelation) => {
      const line = '─'.repeat(Math.max(relation.name.length, 12))
      const cols = relation.columns.map((c) => columnLabel(c)).join('\n')
      return `${relation.name}\n${line}\n${cols}`
    })
    .join('\n\n')
  const notes = (model.conceptualNotes ?? []).map((note) => `· ${note.text}`).join('\n')
  if (!notes) return tables
  return tables ? `${tables}\n\nConcepts MERISE (non exportés en tables)\n${'─'.repeat(36)}\n${notes}` : notes
}