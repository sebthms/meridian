import type {
  Association,
  AssociationParticipant,
  Entity,
  Project,
} from '@/domain'
import {
  CONSTRAINT_KIND_META,
  getAlternateIdentifiers,
  getPrimaryIdentifier,
  inheritanceCoverageLabel,
  inheritanceExclusivityLabel,
  isReflexive,
  normalizeProject,
} from '@/domain'
import { attributeToSql } from '@/sql/model'
import { findFunctionalAssociation } from '@/domain'
import type { MldColumn, MldConceptualNote, MldModel, MldRelation } from './model'

function primaryKeyAttributes(entity: Entity) {
  const id = getPrimaryIdentifier(entity)
  if (!id) return []
  return id.attributeIds
    .map((attributeId) => entity.attributes.find((attribute) => attribute.id === attributeId))
    .filter((attribute): attribute is Entity['attributes'][number] => Boolean(attribute))
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
  return primaryKeyAttributes(entity).map((a) => ({
    name: a.name,
    isPrimaryKey: true,
    isForeignKey: false,
    partOfPrimaryKey: true,
    sqlType: attributeToSql(a),
    notNull: true,
    unique: Boolean(a.unique),
  }))
}

function entityRelation(entity: Entity): MldRelation {
  const pkNames = new Set(primaryKeyColumns(entity).map((c) => c.name))
  const pkOrder = new Map(primaryKeyAttributes(entity).map((attribute, index) => [attribute.id, index]))
  const alternateIdentifiers = getAlternateIdentifiers(entity).filter((identifier) => identifier.attributeIds.length > 0)
  const alternateSingleIds = new Set(alternateIdentifiers.filter((identifier) => identifier.attributeIds.length === 1).flatMap((identifier) => identifier.attributeIds))
  const columns: MldColumn[] = entity.attributes.map((a) => ({
    name: a.name,
    isPrimaryKey: pkNames.has(a.name),
    primaryKeyOrder: pkOrder.get(a.id),
    isForeignKey: false,
    partOfPrimaryKey: pkNames.has(a.name),
    sqlType: attributeToSql(a),
    notNull: Boolean(a.nullable) === false && pkNames.has(a.name) ? true : !a.nullable,
    unique: Boolean(a.unique) || alternateSingleIds.has(a.id),
  }))
  const uniqueConstraints = alternateIdentifiers
    .filter((identifier) => identifier.attributeIds.length > 1)
    .map((identifier) => identifier.attributeIds.map((attributeId) => entity.attributes.find((attribute) => attribute.id === attributeId)?.name).filter((name): name is string => Boolean(name)))
  return { name: entity.name, columns, uniqueConstraints, source: 'entity', sourceId: entity.id }
}

function makeFkColumn(
  name: string,
  references: { table: string; column: string },
  sqlType: MldColumn['sqlType'],
  notNull: boolean,
  unique: boolean,
  foreignKeyGroup: string,
  partOfPrimaryKey = false,
): MldColumn {
  return {
    name,
    isPrimaryKey: partOfPrimaryKey,
    isForeignKey: true,
    references,
    partOfPrimaryKey,
    sqlType,
    notNull,
    unique,
    foreignKeyGroup,
  }
}

function foreignKeyColumns(
  entity: Entity,
  options: {
    group: string
    role?: string
    notNull: boolean
    unique?: boolean
    partOfPrimaryKey?: boolean
  },
): MldColumn[] {
  const primaryAttributes = primaryKeyAttributes(entity)
  const attributes = primaryAttributes.length > 0
    ? primaryAttributes
    : [{ name: `${entity.name}_id`, conceptualType: 'INTEGER' as const }]
  const composite = attributes.length > 1

  return attributes.map((attribute) => {
    const name = composite
      ? [options.role, entity.name, attribute.name].filter(Boolean).join('_').toLowerCase()
      : fkBaseName(entity, options.role)
    return makeFkColumn(
      name,
      { table: entity.name, column: attribute.name },
      attributeToSql(attribute, { foreignKey: true }),
      options.notNull,
      Boolean(options.unique),
      options.group,
      Boolean(options.partOfPrimaryKey),
    )
  })
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
    sqlType: attributeToSql(a),
    notNull: !a.nullable,
    unique: Boolean(a.unique),
  }))
}

/**
 * Table associative d'une N:N. En réflexive, les deux FK sont nommées par leur
 * rôle (`parrain_id_employe`, `filleul_id_employe`) pour lever l'ambiguïté.
 */
export function associativeRelationName(association: Association, entities: Entity[]): string {
  const names = association.participants
    .map((participant) => entities.find((entity) => entity.id === participant.entityId)?.name)
    .filter((name): name is string => Boolean(name))
  return names.length === association.participants.length ? names.join('_') : association.name
}

function buildAssociativeTable(association: Association, entities: Entity[]): MldRelation {
  const cols: MldColumn[] = []
  for (const [index, participant] of association.participants.entries()) {
    const entity = entities.find((e) => e.id === participant.entityId)
    if (!entity) continue
    cols.push(...foreignKeyColumns(entity, {
      group: `${association.id}:${index}`,
      role: participant.role,
      notNull: true,
      partOfPrimaryKey: true,
    }))
  }
  return {
    name: associativeRelationName(association, entities),
    columns: [...cols, ...associationPropertyColumns(association)],
    source: 'association',
    sourceId: association.id,
  }
}

/**
 * Placement de la FK pour une association non-réflexive 1:N ou 1:1 :
 *  - 1:N : la FK migre dans le côté max = 1, référençant le côté max = 'N'.
 *  - 1:1 (0,1 ↔ 1,1) : la FK migre dans le côté min = 1.
 *  - 1,1 ↔ 1,1 : deux tables conservées et FK UNIQUE déterministe dans la seconde.
 */
function fkPlacement(
  association: Association,
  entityA: Entity,
  entityB: Entity,
): { childRelationId: string; fkColumns: MldColumn[] } {
  const [a, b] = association.participants
  const aIsN = a.cardinality.max === 'N'
  const bIsN = b.cardinality.max === 'N'

  let child: AssociationParticipant
  let parentEntity: Entity
  let childEntity: Entity

  const oneToOne = !aIsN && !bIsN

  if (!oneToOne) {
    // 1:N → child = côté max = 1, parent = côté max = 'N'
    child = aIsN ? b : a
    childEntity = aIsN ? entityB : entityA
    parentEntity = aIsN ? entityA : entityB
  } else {
    // 1:1 → FK dans le côté min = 1
    const childIsB = b.cardinality.min === 1 || a.cardinality.min === b.cardinality.min
    child = childIsB ? b : a
    childEntity = childIsB ? entityB : entityA
    parentEntity = childIsB ? entityA : entityB
  }

  return {
    childRelationId: childEntity.id,
    fkColumns: foreignKeyColumns(parentEntity, {
      group: association.id,
      notNull: child.cardinality.min === 1,
      unique: oneToOne,
    }),
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
  const aIsN = a.cardinality.max === 'N'
  // parent = côté max = 'N', enfant = côté max = 1
  const parent = aIsN ? a : b
  const child = aIsN ? b : a
  return foreignKeyColumns(entity, {
    group: association.id,
    role: parent.role || 'parent',
    notNull: child.cardinality.min === 1,
    unique: a.cardinality.max === 1 && b.cardinality.max === 1,
  })
}

/**
 * MCD → MLD transformation (déterministe).
 * Règles :
 *  - Entité → table (identifiant = PK).
 *  - N:N (y compris réflexive) → table associative.
 *  - 1:N / 1:1 → la FK migre dans le côté « 1 » (réflexive 1:N : côté enfant).
 */
function conceptualNotes(project: Project): MldConceptualNote[] {
  const next = normalizeProject(project)
  const notes: MldConceptualNote[] = []
  const entityName = (id: string) => next.entities.find((entity) => entity.id === id)?.name || id
  const objectName = (id: string) =>
    next.entities.find((entity) => entity.id === id)?.name
    || next.associations.find((association) => association.id === id)?.name
    || id

  for (const inheritance of next.inheritances) {
    const children = inheritance.childEntityIds.map(entityName).join(', ') || '(aucun enfant)'
    notes.push({
      kind: 'inheritance',
      sourceId: inheritance.id,
      text: `Héritage ${inheritance.name || inheritance.id} : ${entityName(inheritance.parentEntityId)} → ${children} (${inheritanceCoverageLabel(inheritance.coverage).toLowerCase()}, ${inheritanceExclusivityLabel(inheritance.exclusivity).toLowerCase()}). Non projeté en tables : le MLD conserve les entités telles quelles.`,
    })
  }
  for (const constraint of next.constraints) {
    const targets = constraint.targetIds.map(objectName).join(', ') || '(aucun objet)'
    notes.push({
      kind: 'constraint',
      sourceId: constraint.id,
      text: `Contrainte ${CONSTRAINT_KIND_META[constraint.kind].mark} ${constraint.name || constraint.id} sur ${targets}${constraint.description ? ` — ${constraint.description}` : ''}. Conceptuelle uniquement.`,
    })
  }
  for (const cif of next.cifs) {
    const association = findFunctionalAssociation(next, cif.sourceEntityId, cif.targetEntityId, cif.associationId)
    notes.push({
      kind: 'cif',
      sourceId: cif.id,
      text: `CIF ${cif.name || cif.id} : ${entityName(cif.sourceEntityId)} → ${entityName(cif.targetEntityId)}${association ? ` (association ${association.name})` : ''}${cif.description ? ` — ${cif.description}` : ''}. Documentée seulement : aucune clé étrangère n’est inventée à partir de ce concept.`,
    })
  }
  for (const rule of next.businessRules) {
    notes.push({
      kind: 'business-rule',
      sourceId: rule.id,
      text: `Règle métier [${rule.level}] ${rule.name || rule.id} : ${rule.description || '(sans description)'}.`,
    })
  }
  return notes
}

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
    const childTarget = relations.get(placement.childRelationId)
    if (!childTarget) continue
    childTarget.columns.push(...placement.fkColumns)
    // Les propriétés de l'association suivent la FK dans la relation réceptrice.
    childTarget.columns.push(...associationPropertyColumns(association))
  }

  return {
    relations: [...relations.values()].map((r) => ({ ...r, columns: dedupeColumns(r.columns) })),
    conceptualNotes: conceptualNotes(project),
  }
}
