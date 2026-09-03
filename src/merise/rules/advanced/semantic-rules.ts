import { getPrimaryIdentifier, isCardinality, parseAttributeTypeConfig, type Project } from '@/domain'
import { physicalIdentifier } from '@/sql/naming'
import { isCalculatedCandidate, normalizedAttrName } from '../semantic/patterns'
import { makeIssue, type ValidationIssue } from '../../types'
import { ADVANCED_RULES as R } from './definitions'

const normalized = (name: string) => physicalIdentifier(name)

export function reviewIdentifiers(project: Project, issues: ValidationIssue[]) {
  for (const entity of project.entities) {
    const keys = entity.identifiers.filter((key) => key.attributeIds.length > 0 && new Set(key.attributeIds).size === key.attributeIds.length && key.attributeIds.every((id) => entity.attributes.some((attr) => attr.id === id)))
    const members = new Set(keys.flatMap((key) => key.attributeIds))
    for (const [index, key] of keys.entries()) {
      const subset = keys.find((other, otherIndex) => other !== key && other.attributeIds.every((id) => key.attributeIds.includes(id)) && (other.attributeIds.length < key.attributeIds.length || otherIndex < index))
      const uniqueMember = key.attributeIds.length > 1 && entity.attributes.find((attr) => key.attributeIds.includes(attr.id) && attr.unique && !attr.nullable)
      if (subset || uniqueMember) {
        issues.push(makeIssue(R.W006, [entity.id, key.id], `L’identifiant (${key.attributeIds.map((id) => entity.attributes.find((attr) => attr.id === id)!.name).join(', ')}) de « ${entity.name} » ${subset ? 'contient ou répète un autre identifiant déclaré' : `contient « ${uniqueMember && uniqueMember.name} », déjà UNIQUE et NOT NULL`}.`))
      }
    }
    if (keys.some((key) => key.attributeIds.length > 1) && entity.attributes.some((attr) => !members.has(attr.id))) issues.push(makeIssue(R.I001, [entity.id]))
    for (const attr of entity.attributes) {
      if ((members.has(attr.id) || attr.unique) && attr.typeConfig?.numeric?.kind === 'REAL') {
        issues.push(makeIssue(R.W012, [entity.id, attr.id], `« ${entity.name}.${attr.name} » utilise un réel flottant dans une clé ou une contrainte UNIQUE.`))
      }
    }
  }
}

export function reviewAttributes(project: Project, issues: ValidationIssue[]) {
  for (const owner of [...project.entities, ...project.associations]) {
    for (const attr of owner.attributes) {
      const siblings = new Map(owner.attributes.map((item) => [normalizedAttrName(item.name), item.name]))
      const calculated = isCalculatedCandidate(attr.name, siblings)
      if (calculated) {
        issues.push(makeIssue(R.W010, [owner.id, attr.id], `« ${owner.name}.${attr.name} ».`))
      }
      let config
      try { config = parseAttributeTypeConfig(attr.typeConfig) } catch { continue }
      const limitations: string[] = []
      if (config?.text?.charset === 'ASCII') limitations.push('le choix ASCII n’interdit pas les caractères Unicode avec le VARCHAR/CHAR/TEXT généré')
      if (config?.text?.charset === 'BINARY' && config.text.storage !== 'LARGE') limitations.push('la longueur binaire est un commentaire, pas une contrainte de taille sur BYTEA')
      if (config?.numeric?.kind === 'INTEGER' && config.numeric.bits === 8) limitations.push('8 bits est traduit en SMALLINT (16 bits), sans restriction de plage')
      if (limitations.length) issues.push(makeIssue(R.W013, [owner.id, attr.id], `« ${owner.name}.${attr.name} » : ${limitations.join(' ; ')}.`))
      if (config?.other?.kind === 'FREE') {
        issues.push(makeIssue(R.I003, [owner.id, attr.id], `« ${owner.name}.${attr.name} » utilise le type libre « ${config.other.freeType} ». Sa disponibilité et ses contraintes doivent être vérifiées sur le serveur cible.`))
        if (/\[\]\s*$/.test(config.other.freeType ?? '')) issues.push(makeIssue(R.W014, [owner.id, attr.id]))
      }
    }
  }
}

export function reviewAssociations(project: Project, issues: ValidationIssue[]) {
  const entities = new Map(project.entities.map((entity) => [entity.id, entity]))
  const connected = new Set([
    ...project.associations.flatMap((association) => association.participants.map((participant) => participant.entityId)),
    ...(project.inheritances ?? []).flatMap((inheritance) => [inheritance.parentEntityId, ...inheritance.childEntityIds]),
    ...(project.cifs ?? []).flatMap((cif) => [cif.sourceEntityId, cif.targetEntityId]),
  ])
  const signatures = new Map<string, string>()
  for (const association of project.associations) {
    const participants = association.participants
    if (participants.some((participant) => !entities.has(participant.entityId) || !isCardinality(participant.cardinality))) continue
    for (const entityId of new Set(participants.map((participant) => participant.entityId))) {
      const repeated = participants.filter((participant) => participant.entityId === entityId)
      if (repeated.length > 1 && (repeated.some((participant) => !participant.role?.trim()) || new Set(repeated.map((participant) => normalized(participant.role ?? ''))).size !== repeated.length)) {
        issues.push(makeIssue(R.W007, [association.id, entityId]))
      }
    }
    const signature = JSON.stringify([normalized(association.name), participants.map((participant) => [participant.entityId, normalized(participant.role ?? ''), participant.cardinality.min, participant.cardinality.max]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))])
    const previous = signatures.get(signature)
    if (previous) issues.push(makeIssue(R.W008, [previous, association.id]))
    else signatures.set(signature, association.id)
    if (participants.length !== 2) continue
    const [a, b] = participants
    const bothN = a.cardinality.max === 'N' && b.cardinality.max === 'N'
    if (!bothN && association.attributes.length) issues.push(makeIssue(R.W011, [association.id], `Dans « ${association.name} », ${association.attributes.map((attr) => `« ${attr.name} »`).join(', ')} dépend(ent) d’un lien déterminé par une seule occurrence participante. Vérifiez leur propriétaire métier.`))
    // Follow the exporter’s placement, including reflexive associations.
    const reflexive = a.entityId === b.entityId
    const childIndex = a.cardinality.max === 'N' ? 1 : b.cardinality.max === 'N' ? 0
      : reflexive ? 0 : b.cardinality.min === 1 || a.cardinality.min === b.cardinality.min ? 1 : 0
    for (const [index, participant] of participants.entries()) {
      if (participant.cardinality.min === 1 && (bothN || index !== childIndex)) {
        issues.push(makeIssue(R.I002, [association.id, participant.entityId], `« ${entities.get(participant.entityId)!.name} » doit participer à « ${association.name} » au moins une fois${participant.role ? ` (rôle ${participant.role})` : ''}. Cette existence n’est pas imposée par le SQL généré.`, `participation-${index}`))
      }
    }
    if (!bothN && participants[childIndex].cardinality.min === 0) {
      for (const attr of association.attributes.filter((attribute) => !attribute.nullable)) issues.push(makeIssue(R.W015, [association.id, attr.id], `« ${association.name}.${attr.name} » reste NOT NULL dans « ${entities.get(participants[childIndex].entityId)!.name} », même sans occurrence du lien.`))
    }
    for (const [index, participant] of participants.entries()) {
      const owner = entities.get(participant.entityId)!
      const other = entities.get(participants[1 - index].entityId)!
      if (owner.id === other.id) continue
      const key = getPrimaryIdentifier(other)
      if (!key) continue
      const keyNames = other.attributes.filter((attr) => key.attributeIds.includes(attr.id)).map((attr) => normalized(attr.name)).filter((name) => name !== 'id' && name !== 'code')
      const likelyNames = new Set([`id_${normalized(other.name)}`, `${normalized(other.name)}_id`, ...keyNames])
      for (const attr of owner.attributes) {
        if (owner.identifiers.some((identifier) => identifier.attributeIds.includes(attr.id))) continue
        if (likelyNames.has(normalized(attr.name))) issues.push(makeIssue(R.W009, [owner.id, attr.id, association.id], `« ${owner.name}.${attr.name} » / « ${other.name} ».`))
      }
    }
  }
  if (project.entities.length > 1) {
    for (const entity of project.entities) if (!connected.has(entity.id)) issues.push(makeIssue(R.I004, [entity.id], `« ${entity.name} » n’a aucune participation dans ce diagramme.`))
  }
}
