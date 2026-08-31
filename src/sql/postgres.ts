import type { MldModel, MldColumn } from '@/mld'
import { constraintIdentifier, physicalIdentifier } from './naming'

function fkConstraintName(table: string, column: string): string {
  return constraintIdentifier(`fk_${table}_${column}`)
}

function columnDefinition(col: MldColumn, inlinePrimaryKey: boolean): string {
  const parts = [physicalIdentifier(col.name), col.sqlType]
  if (inlinePrimaryKey) {
    parts.push('PRIMARY KEY')
  } else if (!col.notNull) {
    parts.push('NULL')
  }
  if (col.notNull && !col.isPrimaryKey) parts.push('NOT NULL')
  if (col.unique && !inlinePrimaryKey) parts.push('UNIQUE')
  return parts.join(' ')
}

function createTableSql(model: MldModel): string[] {
  const statements: string[] = []

  for (const relation of model.relations) {
    const table = physicalIdentifier(relation.name)
    const primaryColumns = relation.columns.filter((column) => column.isPrimaryKey)
    const columns = relation.columns.map((c) =>
      `    ${columnDefinition(c, primaryColumns.length === 1 && c.isPrimaryKey)}`,
    )

    const primaryKey = primaryColumns.length > 1
      ? [`    CONSTRAINT ${constraintIdentifier(`pk_${table}`)} PRIMARY KEY (${primaryColumns.map((column) => physicalIdentifier(column.name)).join(', ')})`]
      : []
    const uniqueConstraints = (relation.uniqueConstraints ?? []).map((constraint, index) =>
      `    CONSTRAINT ${constraintIdentifier(`uq_${relation.name}_${index + 1}`)} UNIQUE (${constraint.map((column) => physicalIdentifier(column)).join(', ')})`,
    )

    const body = [...columns, ...primaryKey, ...uniqueConstraints].join(',\n')
    statements.push(`CREATE TABLE ${table} (\n${body}\n);`)
  }

  return statements
}

function foreignKeySql(model: MldModel): string[] {
  const statements: string[] = []
  for (const relation of model.relations) {
    const foreignKeyGroups = new Map<string, MldColumn[]>()
    for (const column of relation.columns.filter((item) => item.isForeignKey && item.references)) {
      const key = column.foreignKeyGroup ?? column.name
      foreignKeyGroups.set(key, [...(foreignKeyGroups.get(key) ?? []), column])
    }
    for (const group of foreignKeyGroups.values()) {
      const first = group[0]
      const columnsSql = group.map((column) => physicalIdentifier(column.name)).join(', ')
      const referencesSql = group.map((column) => physicalIdentifier(column.references!.column)).join(', ')
      statements.push(
        `ALTER TABLE ${physicalIdentifier(relation.name)} ADD CONSTRAINT ${fkConstraintName(relation.name, first.name)}\n` +
        `    FOREIGN KEY (${columnsSql})\n` +
        `    REFERENCES ${physicalIdentifier(first.references!.table)}(${referencesSql});`,
      )
    }
  }
  return statements
}

export function generateSql(model: MldModel): string {
  return [...createTableSql(model), ...foreignKeySql(model)].join('\n\n')
}
