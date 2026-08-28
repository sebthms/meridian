export type MldColumn = {
  name: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  references?: {
    table: string
    column: string
  }
  // a foreign key that also takes part in the primary key of an associative table
  partOfPrimaryKey: boolean
  sqlType: 'TEXT' | 'INTEGER' | 'NUMERIC' | 'DATE' | 'BOOLEAN'
  notNull: boolean
}

export type MldRelation = {
  name: string
  columns: MldColumn[]
  source: 'entity' | 'association'
  sourceId: string
}

export type MldModel = {
  relations: MldRelation[]
}