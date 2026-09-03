import { useEffect, useState, type ReactNode } from 'react'
import { Modal } from '@/shared/components/modal'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Checkbox } from '@/shared/ui/checkbox'
import { Button } from '@/shared/ui/button'
import { useProjectStore } from '@/store/project-store'
import { addAttributeWithName, updateAttribute, addAssociationAttribute, updateAssociationAttribute, setAttributeIdentifier } from '@/editor/index'
import { isValidModelName, modelNameError, parseAttributeTypeConfig, type AttributeTypeConfig, type ConceptualType, type DateTimeKind, type NumericBits, type NumericKind, type OtherKind, type TextCharset, type TextStorage } from '@/domain/index'
import { propertyTypeDefaults } from '@/features/diagram/model/property-type-defaults'

type TypeSection = 'text' | 'numeric' | 'dateTime' | 'other'

const radioClass = 'h-4 w-4 accent-primary'
const inputClass = 'h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-ring/30'

function Choice({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="radio" name={name} checked={checked} onChange={onChange} className={radioClass} />{children}</label>
}

function NumberField({ label, value, onChange, min = 1, max = 1000000 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return <label className="flex items-center gap-2 text-xs"><span>{label}</span><input type="number" min={min} max={max} step={1} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Math.trunc(Number(event.target.value)) || min)))} className={`${inputClass} w-20`} /></label>
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="border-b border-border/60 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
}

export function AddPropertyModal() {
  const target = useProjectStore((state) => state.addPropertyTarget)
  const project = useProjectStore((state) => state.project)
  const apply = useProjectStore((state) => state.apply)
  const close = useProjectStore((state) => state.closeAddProperty)

  const [name, setName] = useState('')
  const [logicalName, setLogicalName] = useState('')
  const [section, setSection] = useState<TypeSection>('text')
  const [textCharset, setTextCharset] = useState<TextCharset>('ASCII')
  const [textStorage, setTextStorage] = useState<TextStorage>('VARIABLE')
  const [textLength, setTextLength] = useState(50)
  const [collation, setCollation] = useState('')
  const [numericKind, setNumericKind] = useState<NumericKind>('INTEGER')
  const [numericBits, setNumericBits] = useState<NumericBits>(32)
  const [precision, setPrecision] = useState(15)
  const [scale, setScale] = useState(2)
  const [floating, setFloating] = useState<'SINGLE' | 'DOUBLE'>('DOUBLE')
  const [dateTimeKind, setDateTimeKind] = useState<DateTimeKind>('DATETIME')
  const [timezone, setTimezone] = useState(false)
  const [otherKind, setOtherKind] = useState<OtherKind>('BOOLEAN')
  const [freeType, setFreeType] = useState('')
  const [notNull, setNotNull] = useState(false)
  const [unique, setUnique] = useState(false)
  const [identifier, setIdentifier] = useState(false)
  const [keyOrder, setKeyOrder] = useState(1)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [typeChanged, setTypeChanged] = useState(false)
  const [identifierId, setIdentifierId] = useState<string | undefined>()

  const entity = target?.kind === 'entity' ? project.entities.find((item) => item.id === target.id) : undefined
  const association = target?.kind === 'association' ? project.associations.find((item) => item.id === target.id) : undefined
  const editedAttribute = target?.attributeId
    ? target.kind === 'entity' ? entity?.attributes.find((item) => item.id === target.attributeId) : association?.attributes.find((item) => item.id === target.attributeId)
    : undefined
  const editedIdentifiers = entity?.identifiers.filter((item) => target?.attributeId && item.attributeIds.includes(target.attributeId)) ?? []
  const editedIdentifier = editedIdentifiers.find((item) => item.id === identifierId) ?? editedIdentifiers[0]
  const initialIdentifier = editedIdentifiers[0]
  const editedIsIdentifier = Boolean(initialIdentifier)

  useEffect(() => {
    if (!target) return
    const attribute = editedAttribute
    setName(attribute?.name ?? '')
    setLogicalName(attribute?.logicalName ?? '')
    setNotNull(attribute?.nullable === false)
    setUnique(attribute?.unique === true)
    setIdentifier(editedIsIdentifier)
    setIdentifierId(initialIdentifier?.id)
    setKeyOrder(attribute && initialIdentifier ? initialIdentifier.attributeIds.indexOf(attribute.id) + 1 : 1)
    setDescription(attribute?.description ?? '')
    setError(null)
    const defaults = propertyTypeDefaults(attribute)
    setSection(defaults.section)
    setTextCharset(defaults.textCharset); setTextStorage(defaults.textStorage); setTextLength(defaults.textLength); setCollation(defaults.collation)
    setNumericKind(defaults.numericKind); setNumericBits(defaults.numericBits); setPrecision(defaults.precision); setScale(defaults.scale); setFloating(defaults.floating)
    setDateTimeKind(defaults.dateTimeKind); setTimezone(defaults.timezone)
    setOtherKind(defaults.otherKind); setFreeType(defaults.freeType)
    setTypeChanged(false)
  }, [target, editedAttribute, initialIdentifier, editedIsIdentifier])

  if (!target) return null

  const typeConfig: AttributeTypeConfig = section === 'text'
    ? { text: { charset: textCharset, storage: textStorage, ...(textStorage !== 'LARGE' ? { length: textLength } : {}), ...(textCharset !== 'BINARY' && collation.trim() ? { collation: collation.trim() } : {}) } }
    : section === 'numeric'
      ? { numeric: { kind: numericKind, ...(numericKind === 'INTEGER' ? { bits: numericBits } : {}), ...(numericKind === 'DECIMAL' ? { precision, scale } : {}), ...(numericKind === 'REAL' ? { floating } : {}) } }
      : section === 'dateTime'
        ? { dateTime: { kind: dateTimeKind, ...(dateTimeKind === 'DATETIME' && timezone ? { timezone: true } : {}) } }
        : { other: { kind: otherKind, ...(otherKind === 'FREE' && freeType.trim() ? { freeType: freeType.trim() } : {}) } }

  const conceptualType: ConceptualType = section === 'text' ? 'TEXT' : section === 'numeric' ? (numericKind === 'INTEGER' || numericKind === 'COUNTER' ? 'INTEGER' : 'DECIMAL') : section === 'dateTime' ? 'DATE' : otherKind === 'BOOLEAN' ? 'BOOLEAN' : 'TEXT'
  const nameFormatError = name.trim() && !isValidModelName(name.trim()) ? modelNameError('Le nom de la propriété') : null

  const save = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return setError('Le nom est obligatoire.')
    if (!isValidModelName(trimmedName)) return setError(modelNameError('Le nom de la propriété'))
    let savedTypeConfig: AttributeTypeConfig | undefined
    try {
      // Editing a label must not narrow a legacy TEXT/NUMERIC column.
      savedTypeConfig = parseAttributeTypeConfig(editedAttribute && !typeChanged ? editedAttribute.typeConfig : typeConfig)
    } catch (cause) {
      return setError(cause instanceof Error ? cause.message : 'Type invalide.')
    }
    const patch = { name: trimmedName, logicalName: logicalName.trim() || undefined, conceptualType, typeConfig: savedTypeConfig, nullable: identifier ? false : !notNull, unique: identifier ? false : unique, identifierOrder: identifier ? Math.max(1, keyOrder) : undefined, description: description.trim() || undefined }
    let next: typeof project
    let savedAttributeId = target.attributeId
    if (target.attributeId) {
      next = target.kind === 'entity' ? updateAttribute(project, target.id, target.attributeId, patch) : updateAssociationAttribute(project, target.id, target.attributeId, patch)
      if (next === project && editedAttribute?.name.trim().toLowerCase() !== trimmedName.toLowerCase()) return setError('Une propriété portant ce nom existe déjà.')
    } else {
      const result = target.kind === 'entity' ? addAttributeWithName(project, target.id, trimmedName, conceptualType) : addAssociationAttribute(project, target.id, trimmedName, conceptualType)
      if (!result.attributeId) return setError('Une propriété portant ce nom existe déjà.')
      savedAttributeId = result.attributeId
      next = target.kind === 'entity' ? updateAttribute(result.project, target.id, result.attributeId, patch) : updateAssociationAttribute(result.project, target.id, result.attributeId, patch)
    }
    if (target.kind === 'entity' && savedAttributeId) {
      next = setAttributeIdentifier(next, target.id, savedAttributeId, identifier, keyOrder, editedIdentifier?.id)
    }
    apply(next); close()
  }

  const showTextLength = textStorage !== 'LARGE'
  const showTextCollation = textCharset !== 'BINARY'

  return <Modal open onClose={close} title={target.attributeId ? 'Modifier la propriété' : 'Ajouter une propriété'} className="max-w-2xl">
    <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
      <div className="w-full">
        <fieldset className="space-y-3 rounded-lg border border-border/70 p-3 flex w-full justify-between gap-2"><legend className="px-1 text-xs font-semibold">Nom</legend>
          <div className="w-full"><Input id="property-name" value={name} onChange={(event) => { setName(event.target.value); setError(null) }} placeholder="nom_propriete" autoFocus />{(nameFormatError || error) && <p className="text-xs text-destructive">{nameFormatError || error}</p>}</div>
          <div className="w-full"><Input id="property-logical-name" value={logicalName} onChange={(event) => setLogicalName(event.target.value)} placeholder="Libellé métier" /></div>
        </fieldset>
      </div>

      <fieldset onChange={() => { setTypeChanged(true); setError(null) }} className="space-y-3 rounded-lg border border-border/70 p-3"><legend className="px-1 text-xs font-semibold">Type</legend>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/50 p-2 sm:grid-cols-4">
          <Choice name="property-section" checked={section === 'text'} onChange={() => setSection('text')}>Texte</Choice><Choice name="property-section" checked={section === 'numeric'} onChange={() => setSection('numeric')}>Numérique</Choice><Choice name="property-section" checked={section === 'dateTime'} onChange={() => setSection('dateTime')}>Date / Heure</Choice><Choice name="property-section" checked={section === 'other'} onChange={() => setSection('other')}>Autre</Choice>
        </div>
        {section === 'text' && <div className="space-y-3"><SectionTitle>Texte</SectionTitle><div className="flex flex-wrap gap-x-5 gap-y-2"><Choice name="property-textCharset" checked={textCharset === 'ASCII'} onChange={() => setTextCharset('ASCII')}>Caractères ASCII</Choice><Choice name="property-textCharset" checked={textCharset === 'UNICODE'} onChange={() => setTextCharset('UNICODE')}>Caractères Unicode</Choice><Choice name="property-textCharset" checked={textCharset === 'BINARY'} onChange={() => setTextCharset('BINARY')}>Binaire</Choice></div><div className="grid gap-2 sm:grid-cols-3"><Choice name="property-textStorage" checked={textStorage === 'VARIABLE'} onChange={() => setTextStorage('VARIABLE')}>Variable</Choice><Choice name="property-textStorage" checked={textStorage === 'FIXED'} onChange={() => setTextStorage('FIXED')}>Fixe</Choice><Choice name="property-textStorage" checked={textStorage === 'LARGE'} onChange={() => setTextStorage('LARGE')}>Volumineux</Choice></div><div className="grid gap-2 sm:grid-cols-2">{showTextLength && <NumberField label="Longueur" value={textLength} onChange={setTextLength} min={1} max={10000} />}{showTextCollation && <label className="flex items-center gap-2 text-xs"><span>Collation</span><input value={collation} onChange={(event) => setCollation(event.target.value)} placeholder="ex. fr-FR-x-icu" className={`${inputClass} min-w-0 flex-1`} /></label>}</div></div>}
        {section === 'numeric' && <div className="space-y-3"><SectionTitle>Numérique</SectionTitle><div className="grid gap-2 sm:grid-cols-2"><Choice name="property-numericKind" checked={numericKind === 'INTEGER'} onChange={() => setNumericKind('INTEGER')}>Entier</Choice><Choice name="property-numericKind" checked={numericKind === 'DECIMAL'} onChange={() => setNumericKind('DECIMAL')}>Décimal</Choice><Choice name="property-numericKind" checked={numericKind === 'REAL'} onChange={() => setNumericKind('REAL')}>Réel</Choice><Choice name="property-numericKind" checked={numericKind === 'MONEY'} onChange={() => setNumericKind('MONEY')}>Monétaire</Choice><Choice name="property-numericKind" checked={numericKind === 'COUNTER'} onChange={() => setNumericKind('COUNTER')}>Compteur</Choice></div>{numericKind === 'INTEGER' && <div className="flex flex-wrap gap-x-5 gap-y-2"><Choice name="property-numericBits" checked={numericBits === 8} onChange={() => setNumericBits(8)}>8 bits</Choice><Choice name="property-numericBits" checked={numericBits === 16} onChange={() => setNumericBits(16)}>16 bits</Choice><Choice name="property-numericBits" checked={numericBits === 32} onChange={() => setNumericBits(32)}>32 bits</Choice><Choice name="property-numericBits" checked={numericBits === 64} onChange={() => setNumericBits(64)}>64 bits</Choice></div>}{numericKind === 'DECIMAL' && <div className="flex flex-wrap gap-3"><NumberField label="Nb chiffres" value={precision} onChange={(value) => { setPrecision(value); setScale((current) => Math.min(current, value)) }} min={1} max={1000} /><NumberField label="Après la virgule" value={scale} onChange={setScale} min={0} max={precision} /></div>}{numericKind === 'REAL' && <div className="flex gap-5"><Choice name="property-floating" checked={floating === 'SINGLE'} onChange={() => setFloating('SINGLE')}>Simple (32 bits)</Choice><Choice name="property-floating" checked={floating === 'DOUBLE'} onChange={() => setFloating('DOUBLE')}>Double (64 bits)</Choice></div>}</div>}
        {section === 'dateTime' && <div className="space-y-3"><SectionTitle>Date / Heure</SectionTitle><div className="flex flex-wrap gap-5"><Choice name="property-dateTimeKind" checked={dateTimeKind === 'DATE'} onChange={() => setDateTimeKind('DATE')}>Date</Choice><Choice name="property-dateTimeKind" checked={dateTimeKind === 'TIME'} onChange={() => setDateTimeKind('TIME')}>Heure</Choice><Choice name="property-dateTimeKind" checked={dateTimeKind === 'DATETIME'} onChange={() => setDateTimeKind('DATETIME')}>Date-heure</Choice></div>{dateTimeKind === 'DATETIME' && <label className="flex items-center gap-2 text-xs"><Checkbox checked={timezone} onCheckedChange={(checked) => { setTimezone(checked === true); setTypeChanged(true) }} />Avec fuseau horaire</label>}</div>}
        {section === 'other' && <div className="space-y-3"><SectionTitle>Autre</SectionTitle><div className="grid gap-2 sm:grid-cols-3"><Choice name="property-otherKind" checked={otherKind === 'BOOLEAN'} onChange={() => setOtherKind('BOOLEAN')}>Booléen</Choice><Choice name="property-otherKind" checked={otherKind === 'XML'} onChange={() => setOtherKind('XML')}>XML</Choice><Choice name="property-otherKind" checked={otherKind === 'GEOMETRIC'} onChange={() => setOtherKind('GEOMETRIC')}>Géométrique</Choice><Choice name="property-otherKind" checked={otherKind === 'GEOGRAPHIC'} onChange={() => setOtherKind('GEOGRAPHIC')}>Géographique</Choice><Choice name="property-otherKind" checked={otherKind === 'FREE'} onChange={() => setOtherKind('FREE')}>Libre</Choice></div>{(otherKind === 'GEOMETRIC' || otherKind === 'GEOGRAPHIC') && <p className="text-xs text-muted-foreground">Nécessite l’extension PostGIS sur le serveur PostgreSQL.</p>}{otherKind === 'FREE' && <Input aria-label="Type PostgreSQL libre" value={freeType} onChange={(event) => setFreeType(event.target.value)} placeholder="Type PostgreSQL, ex. JSONB" />}</div>}
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-border/70 p-3"><legend className="px-1 text-xs font-semibold">Propriétés</legend><div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs">{target.kind === 'entity' && <label className="flex cursor-pointer items-center gap-2"><Checkbox checked={identifier} onCheckedChange={(checked) => setIdentifier(checked === true)} />Identifiant</label>}{identifier && target.kind === 'entity' ? <NumberField label="Ordre dans la clé" value={keyOrder} onChange={setKeyOrder} min={1} max={100} /> : <><label className="flex cursor-pointer items-center gap-2"><Checkbox checked={notNull} onCheckedChange={(checked) => setNotNull(checked === true)} />NOT NULL</label><label className="flex cursor-pointer items-center gap-2"><Checkbox checked={unique} onCheckedChange={(checked) => setUnique(checked === true)} />UNIQUE</label></>}</div></fieldset>
      {identifier && editedIdentifiers.length > 1 && <label className="flex items-center gap-2 text-xs">Ordre dans l’identifiant<select aria-label="Identifiant à ordonner" className={inputClass} value={editedIdentifier?.id} onChange={(event) => { const key = editedIdentifiers.find((item) => item.id === event.target.value); setIdentifierId(key?.id); setKeyOrder(key && editedAttribute ? key.attributeIds.indexOf(editedAttribute.id) + 1 : 1) }}>{editedIdentifiers.map((key, index) => <option key={key.id} value={key.id}>{key.name || `Identifiant ${index + 1}`}</option>)}</select></label>}
      <div className="space-y-1.5"><Label htmlFor="property-description">Commentaire</Label><Textarea id="property-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Rôle métier de cette propriété…" /></div>
      <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={close}>Annuler</Button><Button type="button" onClick={save} disabled={!name.trim()}>Enregistrer</Button></div>
    </div>
  </Modal>
}
