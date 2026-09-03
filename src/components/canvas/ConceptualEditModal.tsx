import { useEffect, useState, type ReactNode } from 'react'
import { Modal } from '@/components/shared/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/project-store'
import {
  updateInheritance,
  updateConstraint,
  updateCif,
  updateBusinessRule,
} from '@/editor'
import {
  BUSINESS_RULE_LEVEL_LABEL,
  BUSINESS_RULE_LEVELS,
  CONSTRAINT_KIND_META,
  CONSTRAINT_KINDS,
  INHERITANCE_COVERAGES,
  INHERITANCE_EXCLUSIVITIES,
  findFunctionalAssociation,
  inheritanceCoverageLabel,
  inheritanceExclusivityLabel,
  isValidModelName,
  modelNameError,
  type BusinessRuleLevel,
  type InheritanceCoverage,
  type InheritanceExclusivity,
  type ModelConstraintKind,
  type Project,
} from '@/domain'

const radioClass = 'h-4 w-4 accent-primary'

function Choice({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="radio" name={name} checked={checked} onChange={onChange} className={radioClass} />{children}</label>
}

function TargetList({
  items,
  selected,
  onToggle,
}: {
  items: Array<{ id: string; label: string }>
  selected: string[]
  onToggle: (id: string, enabled: boolean) => void
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Aucun objet disponible.</p>
  }
  return (
    <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-border/70 p-2">
      {items.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={selected.includes(item.id)} onCheckedChange={(checked) => onToggle(item.id, checked === true)} />
          <span className="truncate">{item.label}</span>
        </label>
      ))}
    </div>
  )
}

export function ConceptualEditModal() {
  const target = useProjectStore((state) => state.editConceptualTarget)
  const project = useProjectStore((state) => state.project)
  const apply = useProjectStore((state) => state.apply)
  const close = useProjectStore((state) => state.closeEditConceptual)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parentEntityId, setParentEntityId] = useState('')
  const [childEntityIds, setChildEntityIds] = useState<string[]>([])
  const [coverage, setCoverage] = useState<InheritanceCoverage>('total')
  const [exclusivity, setExclusivity] = useState<InheritanceExclusivity>('exclusive')
  const [kind, setKind] = useState<ModelConstraintKind>('exclusion')
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [sourceEntityId, setSourceEntityId] = useState('')
  const [targetEntityId, setTargetEntityId] = useState('')
  const [associationId, setAssociationId] = useState('')
  const [level, setLevel] = useState<BusinessRuleLevel>('info')

  const inheritance = target?.kind === 'inheritance' ? project.inheritances.find((item) => item.id === target.id) : undefined
  const constraint = target?.kind === 'constraint' ? project.constraints.find((item) => item.id === target.id) : undefined
  const cif = target?.kind === 'cif' ? project.cifs.find((item) => item.id === target.id) : undefined
  const rule = target?.kind === 'businessRule' ? project.businessRules.find((item) => item.id === target.id) : undefined

  useEffect(() => {
    if (!target) return
    setError(null)
    if (inheritance) {
      setName(inheritance.name)
      setParentEntityId(inheritance.parentEntityId)
      setChildEntityIds(inheritance.childEntityIds)
      setCoverage(inheritance.coverage)
      setExclusivity(inheritance.exclusivity)
    } else if (constraint) {
      setName(constraint.name)
      setDescription(constraint.description)
      setKind(constraint.kind)
      setTargetIds(constraint.targetIds)
    } else if (cif) {
      setName(cif.name)
      setDescription(cif.description)
      setSourceEntityId(cif.sourceEntityId)
      setTargetEntityId(cif.targetEntityId)
      setAssociationId(cif.associationId ?? '')
    } else if (rule) {
      setName(rule.name)
      setDescription(rule.description)
      setLevel(rule.level)
      setTargetIds(rule.targetIds)
    }
  }, [target, inheritance, constraint, cif, rule])

  if (!target) return null

  const entityOptions = project.entities.map((entity) => ({ id: entity.id, label: entity.name || 'Sans nom' }))
  const associationOptions = project.associations.map((association) => ({ id: association.id, label: association.name || 'Association' }))
  const constraintTargets = [...entityOptions, ...associationOptions]
  const ruleTargets = [
    ...constraintTargets,
    ...project.inheritances.map((item) => ({ id: item.id, label: item.name || 'Héritage' })),
    ...project.constraints.map((item) => ({ id: item.id, label: item.name || 'Contrainte' })),
    ...project.cifs.map((item) => ({ id: item.id, label: item.name || 'CIF' })),
  ]
  const functionalAssociation = findFunctionalAssociation(project, sourceEntityId, targetEntityId)
  const linkedAssociations = project.associations.filter((association) => {
    const ids = association.participants.map((participant) => participant.entityId)
    return sourceEntityId && targetEntityId && ids.includes(sourceEntityId) && ids.includes(targetEntityId)
  })

  const title =
    target.kind === 'inheritance' ? 'Modifier l’héritage'
    : target.kind === 'constraint' ? 'Modifier la contrainte'
    : target.kind === 'cif' ? 'Modifier la CIF'
    : 'Modifier la règle métier'

  const save = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return setError('Le nom est obligatoire.')
    if (!isValidModelName(trimmedName)) return setError(modelNameError('Le nom'))
    let next: Project
    if (target.kind === 'inheritance') {
      next = updateInheritance(project, target.id, {
        name: trimmedName,
        parentEntityId,
        childEntityIds: childEntityIds.filter((id) => id !== parentEntityId),
        coverage,
        exclusivity,
      })
    } else if (target.kind === 'constraint') {
      next = updateConstraint(project, target.id, { name: trimmedName, description: description.trim(), kind, targetIds })
    } else if (target.kind === 'cif') {
      next = updateCif(project, target.id, {
        name: trimmedName,
        description: description.trim(),
        sourceEntityId,
        targetEntityId,
        associationId: associationId || functionalAssociation?.id,
      })
    } else {
      if (!description.trim()) return setError('La description est obligatoire.')
      next = updateBusinessRule(project, target.id, { name: trimmedName, description: description.trim(), level, targetIds })
    }
    if (next === project && trimmedName !== (inheritance ?? constraint ?? cif ?? rule)?.name) {
      return setError('Un objet du même type porte déjà ce nom.')
    }
    apply(next)
    close()
  }

  return (
    <Modal open onClose={close} title={title} className="max-w-lg">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="conceptual-name">Nom</Label>
          <Input id="conceptual-name" value={name} onChange={(event) => { setName(event.target.value); setError(null) }} autoFocus />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        {target.kind === 'inheritance' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="inheritance-parent">Entité parente</Label>
              <select id="inheritance-parent" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={parentEntityId} onChange={(event) => setParentEntityId(event.target.value)}>
                <option value="">Choisir…</option>
                {entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Entités enfants</Label>
              <TargetList
                items={entityOptions.filter((entity) => entity.id !== parentEntityId)}
                selected={childEntityIds}
                onToggle={(id, enabled) => setChildEntityIds((current) => enabled ? [...current, id] : current.filter((item) => item !== id))}
              />
            </div>
            <fieldset className="space-y-2 rounded-lg border border-border/70 p-3">
              <legend className="px-1 text-xs font-semibold">Couverture</legend>
              <div className="flex flex-wrap gap-4">
                {INHERITANCE_COVERAGES.map((item) => (
                  <Choice key={item} name="coverage" checked={coverage === item} onChange={() => setCoverage(item)}>{inheritanceCoverageLabel(item)}</Choice>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2 rounded-lg border border-border/70 p-3">
              <legend className="px-1 text-xs font-semibold">Exclusivité</legend>
              <div className="flex flex-wrap gap-4">
                {INHERITANCE_EXCLUSIVITIES.map((item) => (
                  <Choice key={item} name="exclusivity" checked={exclusivity === item} onChange={() => setExclusivity(item)}>{inheritanceExclusivityLabel(item)}</Choice>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {target.kind === 'constraint' && (
          <>
            <fieldset className="space-y-2 rounded-lg border border-border/70 p-3">
              <legend className="px-1 text-xs font-semibold">Type</legend>
              <div className="grid grid-cols-2 gap-2">
                {CONSTRAINT_KINDS.map((item) => (
                  <Choice key={item} name="constraint-kind" checked={kind === item} onChange={() => setKind(item)}>
                    {CONSTRAINT_KIND_META[item].label} ({CONSTRAINT_KIND_META[item].mark})
                  </Choice>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label>Objets concernés</Label>
              <TargetList items={constraintTargets} selected={targetIds} onToggle={(id, enabled) => setTargetIds((current) => enabled ? [...current, id] : current.filter((item) => item !== id))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="constraint-description">Description</Label>
              <Textarea id="constraint-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </div>
          </>
        )}

        {target.kind === 'cif' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cif-source">Entité source</Label>
                <select id="cif-source" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={sourceEntityId} onChange={(event) => setSourceEntityId(event.target.value)}>
                  <option value="">Choisir…</option>
                  {entityOptions.filter((entity) => entity.id !== targetEntityId).map((entity) => <option key={entity.id} value={entity.id}>{entity.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cif-target">Entité cible</Label>
                <select id="cif-target" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={targetEntityId} onChange={(event) => setTargetEntityId(event.target.value)}>
                  <option value="">Choisir…</option>
                  {entityOptions.filter((entity) => entity.id !== sourceEntityId).map((entity) => <option key={entity.id} value={entity.id}>{entity.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cif-association">Association porteuse</Label>
              <select id="cif-association" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={associationId} onChange={(event) => setAssociationId(event.target.value)}>
                <option value="">Déduire de la cardinalité…</option>
                {linkedAssociations.map((association) => <option key={association.id} value={association.id}>{association.name || 'Association'}</option>)}
              </select>
              {!functionalAssociation && sourceEntityId && targetEntityId ? (
                <p className="text-xs text-muted-foreground">Aucune association n’exprime encore une dépendance fonctionnelle (cible en 0,1 ou 1,1).</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cif-description">Description</Label>
              <Textarea id="cif-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </div>
          </>
        )}

        {target.kind === 'businessRule' && (
          <>
            <fieldset className="space-y-2 rounded-lg border border-border/70 p-3">
              <legend className="px-1 text-xs font-semibold">Niveau</legend>
              <div className="flex flex-wrap gap-4">
                {BUSINESS_RULE_LEVELS.map((item) => (
                  <Choice key={item} name="rule-level" checked={level === item} onChange={() => setLevel(item)}>{BUSINESS_RULE_LEVEL_LABEL[item]}</Choice>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label>Objets concernés</Label>
              <TargetList items={ruleTargets.filter((item) => item.id !== target.id)} selected={targetIds} onToggle={(id, enabled) => setTargetIds((current) => enabled ? [...current, id] : current.filter((item) => item !== id))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-description">Description</Label>
              <Textarea id="rule-description" value={description} onChange={(event) => { setDescription(event.target.value); setError(null) }} rows={4} placeholder="Condition métier à respecter…" />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={close}>Annuler</Button>
          <Button type="button" onClick={save} disabled={!name.trim()}>Enregistrer</Button>
        </div>
      </div>
    </Modal>
  )
}
