import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/project-store'
import {
  addAttributeWithName,
  updateAttribute,
  toggleIdentifierAttribute,
  addAssociationAttribute,
  updateAssociationAttribute,
} from '@/editor'
import { isValidModelName, modelNameError, type ConceptualType } from '@/domain'

const TYPE_OPTIONS: ReadonlyArray<{ value: ConceptualType; label: string; detail: string }> = [
  { value: 'TEXT', label: 'Texte', detail: 'Chaîne de caractères' },
  { value: 'INTEGER', label: 'Entier', detail: 'Nombre entier' },
  { value: 'DECIMAL', label: 'Décimal', detail: 'Nombre à virgule' },
  { value: 'DATE', label: 'Date', detail: 'Date sans heure' },
  { value: 'BOOLEAN', label: 'Booléen', detail: 'Vrai ou faux' },
]

export function AddPropertyModal() {
  const target = useProjectStore((state) => state.addPropertyTarget)
  const project = useProjectStore((state) => state.project)
  const apply = useProjectStore((state) => state.apply)
  const close = useProjectStore((state) => state.closeAddProperty)

  const [name, setName] = useState('')
  const [conceptualType, setConceptualType] = useState<ConceptualType>('TEXT')
  const [notNull, setNotNull] = useState(false)
  const [unique, setUnique] = useState(false)
  const [identifier, setIdentifier] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const entity = target?.kind === 'entity'
    ? project.entities.find((item) => item.id === target.id)
    : undefined
  const association = target?.kind === 'association'
    ? project.associations.find((item) => item.id === target.id)
    : undefined
  const editedAttribute = target?.attributeId
    ? target.kind === 'entity'
      ? entity?.attributes.find((item) => item.id === target.attributeId)
      : association?.attributes.find((item) => item.id === target.attributeId)
    : undefined
  const editedIsIdentifier = Boolean(
    target?.attributeId && entity?.identifiers.some((item) => item.attributeIds.includes(target.attributeId!)),
  )
  const nameFormatError = name.trim() && !isValidModelName(name.trim())
    ? modelNameError('Le nom de la propriété')
    : null

  useEffect(() => {
    if (!target) return
    setName(editedAttribute?.name ?? '')
    setConceptualType(editedAttribute?.conceptualType ?? 'TEXT')
    setNotNull(editedAttribute?.nullable === false)
    setUnique(editedAttribute?.unique === true)
    setIdentifier(editedIsIdentifier)
    setDescription(editedAttribute?.description ?? '')
    setError(null)
  }, [target, editedAttribute, editedIsIdentifier])

  if (!target) return null

  const save = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Le nom est obligatoire.')
      return
    }
    if (!isValidModelName(trimmedName)) {
      setError(modelNameError('Le nom de la propriété'))
      return
    }
    const patch = {
      name: trimmedName,
      conceptualType,
      nullable: !notNull,
      unique,
      description: description.trim() || undefined,
    }

    if (target.attributeId) {
      let next = target.kind === 'entity'
        ? updateAttribute(project, target.id, target.attributeId, patch)
        : updateAssociationAttribute(project, target.id, target.attributeId, patch)
      if (next === project) {
        setError('Une propriété portant ce nom existe déjà.')
        return
      }
      if (target.kind === 'entity' && identifier !== editedIsIdentifier) {
        next = toggleIdentifierAttribute(next, target.id, target.attributeId)
      }
      apply(next)
      close()
      return
    }

    const result = target.kind === 'entity'
      ? addAttributeWithName(project, target.id, trimmedName, conceptualType)
      : addAssociationAttribute(project, target.id, trimmedName, conceptualType)
    if (!result.attributeId) {
      setError('Une propriété portant ce nom existe déjà.')
      return
    }

    let next = target.kind === 'entity'
      ? updateAttribute(result.project, target.id, result.attributeId, patch)
      : updateAssociationAttribute(result.project, target.id, result.attributeId, patch)
    if (target.kind === 'entity' && identifier) {
      next = toggleIdentifierAttribute(next, target.id, result.attributeId)
    }
    apply(next)
    close()
  }

  return (
    <Modal open onClose={close} title={target.attributeId ? 'Modifier la propriété' : 'Ajouter une propriété'}>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="property-name">Nom</Label>
          <Input
            id="property-name"
            value={name}
            onChange={(event) => { setName(event.target.value); setError(null) }}
            placeholder="nom_propriete"
            pattern="[A-Za-z_][A-Za-z0-9_]*"
            autoFocus
          />
          {(nameFormatError || error) && <p className="text-xs text-destructive">{nameFormatError || error}</p>}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Type conceptuel</legend>
          <RadioGroup
            value={conceptualType}
            onValueChange={(value) => setConceptualType(value as ConceptualType)}
            className="grid grid-cols-1 gap-1 sm:grid-cols-2"
          >
            {TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 hover:bg-accent/60">
                <RadioGroupItem value={option.value} />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{option.detail}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>

        <div className="grid gap-2 sm:grid-cols-3">
          {target.kind === 'entity' && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={identifier} onCheckedChange={(checked) => setIdentifier(checked === true)} />
              Identifiant
            </label>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={notNull} onCheckedChange={(checked) => setNotNull(checked === true)} />
            Obligatoire
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={unique} onCheckedChange={(checked) => setUnique(checked === true)} />
            Unique
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="property-description">Description</Label>
          <Textarea
            id="property-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Rôle métier de cette propriété…"
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={close}>Annuler</Button>
          <Button type="button" onClick={save} disabled={!name.trim()}>Enregistrer</Button>
        </div>
      </div>
    </Modal>
  )
}
