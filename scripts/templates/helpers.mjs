export const C01 = { min: 0, max: 1 }
export const C11 = { min: 1, max: 1 }
export const C0N = { min: 0, max: 'N' }
export const C1N = { min: 1, max: 'N' }

export function text(length = 80, large = false) {
  return { text: { charset: 'UNICODE', storage: large ? 'LARGE' : 'VARIABLE', ...(large ? {} : { length }) } }
}
export function counter() {
  return { numeric: { kind: 'COUNTER' } }
}
export function int32() {
  return { numeric: { kind: 'INTEGER', bits: 32 } }
}
export function money() {
  return { numeric: { kind: 'MONEY', precision: 12, scale: 2 } }
}
export function datetime() {
  return { dateTime: { kind: 'DATETIME', timezone: true } }
}
export function dateOnly() {
  return { dateTime: { kind: 'DATE' } }
}
export function bool() {
  return { other: { kind: 'BOOLEAN' } }
}
export function decimal(precision = 4, scale = 2) {
  return { numeric: { kind: 'DECIMAL', precision, scale } }
}

export function a(id, name, conceptualType, extra = {}) {
  return { id, name, conceptualType, nullable: false, ...extra }
}

export function entity(id, name, x, y, attributes, pkIds = [attributes[0].id]) {
  return {
    id,
    name,
    attributes,
    identifiers: [{ id: `${id}_pk`, attributeIds: pkIds, isPrimary: true }],
    position: { x, y },
  }
}

export function assoc(id, name, leftId, leftCard, rightId, rightCard, attributes = [], position) {
  return {
    id,
    name,
    participants: [
      { entityId: leftId, cardinality: leftCard },
      { entityId: rightId, cardinality: rightCard },
    ],
    attributes,
    ...(position ? { position } : {}),
  }
}

export function project(name, extras) {
  return {
    version: 1,
    name,
    ignoredRules: [],
    ignoredIssueIds: [],
    inheritances: [],
    constraints: [],
    cifs: [],
    businessRules: [],
    ...extras,
  }
}
