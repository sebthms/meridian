export type MldColumn = {
  name: string
  isPrimaryKey: boolean
  /** Ordre dans l'identifiant, indépendant de l'ordre visuel des propriétés. */
  primaryKeyOrder?: number
  isForeignKey: boolean
  references?: {
    table: string
    column: string
  }
  // a foreign key that also takes part in the primary key of an associative table
  partOfPrimaryKey: boolean
  sqlType: string
  notNull: boolean
  unique: boolean
  /** Regroupe les colonnes d'une même FK, notamment pour les clés composées. */
  foreignKeyGroup?: string
}

export type MldRelation = {
  name: string
  columns: MldColumn[]
  /** Contraintes UNIQUE composées issues des identifiants alternatifs. */
  uniqueConstraints?: string[][]
  source: 'entity' | 'association'
  sourceId: string
}

export type MldModel = {
  relations: MldRelation[]
}
