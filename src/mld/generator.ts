import type {
  Association,
  AssociationParticipant,
  Entity,
  Project,
} from '@/domain'
import { isReflexive } from '@/domain'
import { conceptualToSql } from '@/sql/model'
import type { MldColumn, MldModel, MldRelation } from './model'

/** Nom de la colonne PK d'une entité (identifiant simple), ou '' si aucun. */
function primaryKeyName(entity: Entity): string {
  const id = entity.identifiers.find((i) => i.attributeIds.length > 0)
  if (!id) return ''
  const attr = entity.attributes.find((a) => a.id === id.attributeIds[0])
  return attr ? attr.name : ''
}

/**
 * Nom d'une colonne FK : `id_<entité>` (ou `<role>_id_<entité>` en réflexive).
 * Indépendant du nom de la PK : évite les collisions quand la PK est `id`.
 */
function fkBaseName(entity: Entity, role?: string): string {
  return role ? `${role}_id_${entity.name}`.toLowerCase() : `id_${entity.name}`.toLowerCase()
}

/** Garantit des noms de colonnes uniques (collision → suffixe `_2`, `_3`…). */
function dedupeColumns(columns: MldColumn[]): MldColumn[] {
  const seen = new Map<string, number>()
  return columns.map((c) => {
    const n = seen.get(c.name) ?? 0
    seen.set(c.name, n + 1)
    return n === 0 ? c : { ...c, name: `${c.name}_${n + 1}` }
  })
}

function primaryKeyColumns(entity: Entity): MldColumn[] {
  const id = entity.identifiers.find((i) => i.attributeIds.length > 0)
  if (!id) return []
  const attrs = entity.attributes.filter((a) => id.attributeIds.includes(a.id))
  return attrs.map((a) => ({
    name: a.name,
    isPrimaryKey: true,
    isForeignKey: false,
    partOfPrimaryKey: true,
    sqlType: conceptualToSql(a.conceptualType),
    notNull: true,
  }))
}

function entityRelation(entity: Entity): MldRelation {
  const pkNames = new Set(primaryKeyColumns(entity).map((c) => c.name))
  const columns: MldColumn[] = entity.attributes.map((a) => ({
    name: a.name,
    isPrimaryKey: pkNames.has(a.name),
    isForeignKey: false,
    partOfPrimaryKey: pkNames.has(a.name),
    sqlType: conceptualToSql(a.conceptualType),
    notNull: Boolean(a.nullable) === false && pkNames.has(a.name) ? true : !a.nullable,
  }))
  return { name: entity.name, columns, source: 'entity', sourceId: entity.id }
}

function makeFkColumn(name: string, references: { table: string; column: string }, notNull: boolean): MldColumn {
  return {
    name,
    isPrimaryKey: false,
    isForeignKey: true,
    references,
    partOfPrimaryKey: false,
    sqlType: 'INTEGER',
    notNull,
  }
}

function makeAssociativeFkColumn(
  name: string,
  references: { table: string; column: string },
): MldColumn {
  return {
    name,
    isPrimaryKey: true,
    isForeignKey: true,
    references,
    partOfPrimaryKey: true,
    sqlType: 'INTEGER',
    notNull: true,
  }
}

/**
 * Détecte si l'association est N:N (les deux extrémités en max = 'N').
 * Utilisé pour choisir entre migration de FK (1:N, 1:1) et table associative.
 */

/** Propriétés portées par l'association → colonnes de la table. */
function associationPropertyColumns(association: Association): MldColumn[] {
  return association.attributes.map((a) => ({
    name: a.name,
    isPrimaryKey: false,
    isForeignKey: false,
    partOfPrimaryKey: false,
    sqlType: conceptualToSql(a.conceptualType),
    notNull: !a.nullable,
  }))
}

/**
 * Table associative d'une N:N. En réflexive, les deux FK sont nommées par leur
 * rôle (`parrain_id_employe`, `filleul_id_employe`) pour lever l'ambiguïté.
 */
function buildAssociativeTable(association: Association, entities: Entity[]): MldRelation {
  const cols: MldColumn[] = []
  for (const participant of association.participants) {
    const entity = entities.find((e) => e.id === participant.entityId)
    if (!entity) continue
    const pkName = primaryKeyName(entity) || `${entity.name}_id`
    const name = fkBaseName(entity, participant.role)
    cols.push(
      makeAssociativeFkColumn(name, { table: entity.name, column: pkName }),
    )
  }
  return {
    name: association.name,
    columns: [...cols, ...associationPropertyColumns(association)],
    source: 'association',
    sourceId: association.id,
  }
}

/**
 * Placement de la FK pour une association non-réflexive 1:N ou 1:1 :
 *  - 1:N : la FK migre dans le côté max = 1, référençant le côté max = 'N'.
 *  - 1:1 (0,1 ↔ 1,1) : la FK migre dans le côté min = 1.
 *  - 1,1 ↔ 1,1 : null (deux tables conservées, pas de FK).
 */
function fkPlacement(
  association: Association,
  entityA: Entity,
  entityB: Entity,
): { childRelationId: string; parentRelationId: string; fkColumns: MldColumn[] } | null {
  const [a, b] = association.participants
  const aIsN = a.cardinality.max === 'N'
  const bIsN = b.cardinality.max === 'N'

  let child: AssociationParticipant
  let parentEntity: Entity
  let childEntity: Entity

  if (aIsN !== bIsN) {
    // 1:N → child = côté max = 1, parent = côté max = 'N'
    child = aIsN ? b : a
    childEntity = aIsN ? entityB : entityA
    parentEntity = aIsN ? entityA : entityB
  } else {
    // 1:1 → FK dans le côté min = 1
    if (a.cardinality.min === 1 && b.cardinality.min === 1) return null
    const childIsB = b.cardinality.min === 1
    child = childIsB ? b : a
    childEntity = childIsB ? entityB : entityA
    parentEntity = childIsB ? entityA : entityB
  }

  const fkName = fkBaseName(parentEntity)
  return {
    childRelationId: childEntity.id,
    parentRelationId: parentEntity.id,
    fkColumns: [
      makeFkColumn(fkName, { table: parentEntity.name, column: primaryKeyName(parentEntity) || `${parentEntity.name}_id` }, child.cardinality.min === 1),
    ],
  }
}

/**
 * Placement de la FK pour une association réflexive 1:N (hiérarchie).
 * La FK migre dans le côté max = 1 (« enfant »), nommée par le rôle du côté
 * max = 'N' (« parent ») : `manager_id_employe`.
 */
function reflexiveFkPlacement(
  association: Association,
  entity: Entity,
): MldColumn[] {
  const [a, b] = association.participants
  const pkName = primaryKeyName(entity) || `${entity.name}_id`
  const aIsN = a.cardinality.max === 'N'
  // parent = côté max = 'N', enfant = côté max = 1
  const parent = aIsN ? a : b
  const child = aIsN ? b : a
  const roleName = fkBaseName(entity, parent.role || 'parent')
  return [
    makeFkColumn(roleName, { table: entity.name, column: pkName }, child.cardinality.min === 1),
  ]
}

/**
 * MCD → MLD transformation (déterministe).
 * Règles :
 *  - Entité → table (identifiant = PK).
 *  - N:N (y compris réflexive) → table associative.
 *  - 1:N / 1:1 → la FK migre dans le côté « 1 » (réflexive 1:N : côté enfant).
 */
export function generateMld(project: Project): MldModel {
  const relations = new Map<string, MldRelation>()

  for (const entity of project.entities) {
    relations.set(entity.id, entityRelation(entity))
  }

  for (const association of project.associations) {
    if (association.participants.length !== 2) continue
    const [a, b] = association.participants
    const entityA = project.entities.find((e) => e.id === a.entityId)
    const entityB = project.entities.find((e) => e.id === b.entityId)
    if (!entityA || !entityB) continue

    const reflexive = isReflexive(association)
    const bothN = a.cardinality.max === 'N' && b.cardinality.max === 'N'

    if (bothN) {
      // Règle 3 — N:N (y compris réflexive N:N → table associative).
      relations.set(association.id, buildAssociativeTable(association, project.entities))
      continue
    }

    if (reflexive) {
      // Réflexive 1:N — FK autoréférentielle dans l'entité (côté enfant).
      const existing = relations.get(entityA.id)
      if (existing) {
        existing.columns.push(...reflexiveFkPlacement(association, entityA))
        // Les propriétés de l'association migrent dans la table de l'entité.
        existing.columns.push(...associationPropertyColumns(association))
      }
      continue
    }

    // Règle 2/4 — 1:N ou 1:1 : la FK migre dans la table du côté « 1 ».
    const placement = fkPlacement(association, entityA, entityB)
    if (!placement) continue // 1,1 ↔ 1,1 : deux tables conservées, pas de FK
    const childTarget = relations.get(placement.childRelationId)
    if (!childTarget) continue
    childTarget.columns.push(...placement.fkColumns)
    // Règle 2 : les propriétés de l'association migrent dans la table côté « n ».
    const parentTarget = relations.get(placement.parentRelationId)
    if (parentTarget) parentTarget.columns.push(...associationPropertyColumns(association))
  }

  return {
    relations: [...relations.values()].map((r) => ({ ...r, columns: dedupeColumns(r.columns) })),
  }
}