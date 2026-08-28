import type { MldModel, MldColumn } from '@/mld'

function quoteIdentifier(name: string): string {
  // snake_case for PostgreSQL identifiers
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

function fkConstraintName(table: string, column: string): string {
  return `fk_${quoteIdentifier(table)}_${quoteIdentifier(column)}`
}

function columnDefinition(col: MldColumn): string {
  const parts = [quoteIdentifier(col.name), col.sqlType]
  if (col.isPrimaryKey) {
    parts.push('PRIMARY KEY')
  } else if (!col.notNull) {
    parts.push('NULL')
  }
  if (col.notNull && !col.isPrimaryKey) parts.push('NOT NULL')
  return parts.join(' ')
}

function createTableSql(model: MldModel): string[] {
  const statements: string[] = []

  for (const relation of model.relations) {
    const table = quoteIdentifier(relation.name)
    const columns = relation.columns.map((c) => `    ${columnDefinition(c)}`)

    const fks = relation.columns
      .filter((c) => c.isForeignKey && c.references)
      .map((c) => {
        const ref = c.references!
        const constraint = `    CONSTRAINT ${fkConstraintName(relation.name, c.name)}\n        FOREIGN KEY (${quoteIdentifier(c.name)})\n        REFERENCES ${quoteIdentifier(ref.table)}(${quoteIdentifier(ref.column)})`
        return constraint
      })

    const body = [...columns, ...fks].join(',\n')
    statements.push(`CREATE TABLE ${table} (\n${body}\n);`)
  }

  return statements
}

export function generateSql(model: MldModel): string {
  return createTableSql(model).join('\n\n')
}