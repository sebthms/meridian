import type { Project } from '@/domain'

/**
 * Deterministic cleanup of structural state that does not require user intent.
 * Used before validation so that orphan references never cause false positives.
 */
export function normalizeProject(project: Project): Project {
  const entityIds = new Set(project.entities.map((e) => e.id))

  // Remove association participants pointing to deleted entities.
  const associations = project.associations.map((a) => ({
    ...a,
    participants: a.participants.filter((p) => entityIds.has(p.entityId)),
  }))

  return { ...project, associations }
}