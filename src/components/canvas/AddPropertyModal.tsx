import { useEffect, useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/project-store'
import { addAttributeWithName, updateAttribute, toggleIdentifierAttribute, addAssociationAttribute, updateAssociationAttribute, setIdentifierOrder } from '@/editor'
import { isValidModelName, modelNameError, type AttributeTypeConfig, type ConceptualType, type DateTimeKind, type NumericBits, type NumericKind, type OtherKind, type TextCharset, type TextStorage } from '@/domain'

type TypeSection = 'text' | 'numeric' | 'dateTime' | 'other'

const radioClass = 'h-4 w-4 accent-primary'
const inputClass = 'h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-ring/30'

function Choice({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="radio" checked={checked} onChange={onChange} className={radioClass} />{children}</label>
}

function NumberField({ label, value, onChange, min = 1, max = 1000000 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return <label className="flex items-center gap-2 text-xs"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} className={`${inputClass} w-20`} /></label>
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

  const entity = target?.kind === 'entity' ? project.entities.find((item) => item.id === target.id) : undefined
  const association = target?.kind === 'association' ? project.associations.find((item) => item.id === target.id) : undefined
  const editedAttribute = target?.attributeId
    ? target.kind === 'entity' ? entity?.attributes.find((item) => item.id === target.attributeId) : association?.attributes.find((item) => item.id === target.attributeId)
    : undefined
  const editedIdentifier = target?.attributeId && entity ? entity.identifiers.find((item) => item.attributeIds.includes(target.attributeId!)) : undefined
  const editedIsIdentifier = Boolean(editedIdentifier)

  useEffect(() => {
    if (!target) return
    const attribute = editedAttribute
    const config = attribute?.typeConfig
    setName(attribute?.name ?? '')
    setLogicalName(attribute?.logicalName ?? '')
    setNotNull(attribute?.nullable === false)
    setUnique(attribute?.unique === true)
    setIdentifier(editedIsIdentifier)
    setKeyOrder(attribute?.identifierOrder ?? (editedIdentifier ? (editedIdentifier.attributeIds.indexOf(attribute.id) + 1) : 1))
    setDescription(attribute?.description ?? '')
    setError(null)
    if (config?.text) {
      setSection('text'); setTextCharset(config.text.charset); setTextStorage(config.text.storage); setTextLength(config.text.length ?? 50); setCollation(config.text.collation ?? '')
    } else if (config?.numeric) {
      setSection('numeric'); setNumericKind(config.numeric.kind); setNumericBits(config.numeric.bits ?? 32); setPrecision(config.numeric.precision ?? 15); setScale(config.numeric.scale ?? 2); setFloating(config.numeric.floating ?? 'DOUBLE')
    } else if (config?.dateTime) {
      setSection('dateTime'); setDateTimeKind(config.dateTime.kind); setTimezone(config.dateTime.timezone === true)
    } else if (config?.other) {
      setSection('other'); setOtherKind(config.other.kind); setFreeType(config.other.freeType ?? '')
    } else if (attribute?.conceptualType === 'INTEGER' || attribute?.conceptualType === 'DECIMAL') setSection('numeric')
    else if (attribute?.conceptualType === 'DATE') setSection('dateTime')
    else if (attribute?.conceptualType === 'BOOLEAN') { setSection('other'); setOtherKind('BOOLEAN') }
    else setSection('text')
  }, [target, editedAttribute, editedIdentifier, editedIsIdentifier])

  if (!target) return null

  const typeConfig: AttributeTypeConfig = section === 'text'
    ? { text: { charset: textCharset, storage: textStorage, ...(textStorage !== 'LARGE' ? { length: textLength } : {}), ...(textStorage !== 'LARGE' || textCharset !== 'BINARY' ? (collation.trim() ? { collation: collation.trim() } : {}) : {}) } }
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
    const patch = { name: trimmedName, logicalName: logicalName.trim() || undefined, conceptualType, typeConfig, nullable: identifier ? false : !notNull, unique: identifier ? false : unique, identifierOrder: identifier ? Math.max(1, keyOrder) : undefined, description: description.trim() || undefined }
    let next = project
    if (target.attributeId) {
      next = target.kind === 'entity' ? updateAttribute(project, target.id, target.attributeId, patch) : updateAssociationAttribute(project, target.id, target.attributeId, patch)
      if (next === project && editedAttribute?.name.trim().toLowerCase() !== trimmedName.toLowerCase()) return setError('Une propriété portant ce nom existe déjà.')
      if (target.kind === 'entity' && identifier !== editedIsIdentifier) next = toggleIdentifierAttribute(next, target.id, target.attributeId)
    } else {
      const result = target.kind === 'entity' ? addAttributeWithName(project, target.id, trimmedName, conceptualType) : addAssociationAttribute(project, target.id, trimmedName, conceptualType)
      if (!result.attributeId) return setError('Une propriété portant ce nom existe déjà.')
      next = target.kind === 'entity' ? updateAttribute(result.project, target.id, result.attributeId, patch) : updateAssociationAttribute(result.project, target.id, result.attributeId, patch)
      if (target.kind === 'entity' && identifier) next = toggleIdentifierAttribute(next, target.id, result.attributeId)
    }
    if (target.kind === 'entity' && identifier) {
      const savedAttributeId = target.attributeId || (next.entities.find((item) => item.id === target.id)?.attributes.at(-1)?.id)
      if (savedAttributeId) next = setIdentifierOrder(next, target.id, savedAttributeId, Math.max(1, keyOrder))
    }
    apply(next); close()
  }

  const showTextLength = textStorage !== 'LARGE' && (textCharset !== 'BINARY' || textStorage !== 'LARGE')
  const showTextCollation = textStorage !== 'LARGE' || textCharset !== 'BINARY'

  return <Modal open onClose={close} title={target.attributeId ? 'Modifier la propriété' : 'Ajouter une propriété'} className="max-w-2xl">
    <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="property-name">Nom</Label><Input id="property-name" value={name} onChange={(event) => { setName(event.target.value); setError(null) }} placeholder="nom_propriete" autoFocus />{(nameFormatError || error) && <p className="text-xs text-destructive">{nameFormatError || error}</p>}</div>
        <div className="space-y-1.5"><Label htmlFor="property-logical-name">Nom logique</Label><Input id="property-logical-name" value={logicalName} onChange={(event) => setLogicalName(event.target.value)} placeholder="Libellé métier" /></div>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border/70 p-3"><legend className="px-1 text-xs font-semibold">Type</legend>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/50 p-2 sm:grid-cols-4">
          <Choice checked={section === 'text'} onChange={() => setSection('text')}>Texte</Choice><Choice checked={section === 'numeric'} onChange={() => setSection('numeric')}>Numérique</Choice><Choice checked={section === 'dateTime'} onChange={() => setSection('dateTime')}>Date / Heure</Choice><Choice checked={section === 'other'} onChange={() => setSection('other')}>Autre</Choice>
        </div>
        {section === 'text' && <div className="space-y-3"><SectionTitle>Texte</SectionTitle><div className="flex flex-wrap gap-x-5 gap-y-2"><Choice checked={textCharset === 'ASCII'} onChange={() => setTextCharset('ASCII')}>Caractères ASCII</Choice><Choice checked={textCharset === 'UNICODE'} onChange={() => setTextCharset('UNICODE')}>Caractères Unicode</Choice><Choice checked={textCharset === 'BINARY'} onChange={() => setTextCharset('BINARY')}>Binaire</Choice></div><div className="grid gap-2 sm:grid-cols-3"><Choice checked={textStorage === 'VARIABLE'} onChange={() => setTextStorage('VARIABLE')}>Variable</Choice><Choice checked={textStorage === 'FIXED'} onChange={() => setTextStorage('FIXED')}>Fixe</Choice><Choice checked={textStorage === 'LARGE'} onChange={() => setTextStorage('LARGE')}>Volumineux</Choice></div><div className="grid gap-2 sm:grid-cols-2">{showTextLength && <NumberField label="Longueur" value={textLength} onChange={setTextLength} min={1} max={10000} />}{showTextCollation && <label className="flex items-center gap-2 text-xs"><span>Collation</span><input value={collation} onChange={(event) => setCollation(event.target.value)} placeholder="ex. fr-FR-x-icu" className={`${inputClass} min-w-0 flex-1`} /></label>}</div></div>}
        {section === 'numeric' && <div className="space-y-3"><SectionTitle>Numérique</SectionTitle><div className="grid gap-2 sm:grid-cols-2"><Choice checked={numericKind === 'INTEGER'} onChange={() => setNumericKind('INTEGER')}>Entier</Choice><Choice checked={numericKind === 'DECIMAL'} onChange={() => setNumericKind('DECIMAL')}>Décimal</Choice><Choice checked={numericKind === 'REAL'} onChange={() => setNumericKind('REAL')}>Réel</Choice><Choice checked={numericKind === 'MONEY'} onChange={() => setNumericKind('MONEY')}>Monétaire</Choice><Choice checked={numericKind === 'COUNTER'} onChange={() => setNumericKind('COUNTER')}>Compteur</Choice></div>{numericKind === 'INTEGER' && <div className="flex flex-wrap gap-x-5 gap-y-2"><Choice checked={numericBits === 8} onChange={() => setNumericBits(8)}>8 bits</Choice><Choice checked={numericBits === 16} onChange={() => setNumericBits(16)}>16 bits</Choice><Choice checked={numericBits === 32} onChange={() => setNumericBits(32)}>32 bits</Choice><Choice checked={numericBits === 64} onChange={() => setNumericBits(64)}>64 bits</Choice></div>}{numericKind === 'DECIMAL' && <div className="flex flex-wrap gap-3"><NumberField label="Nb chiffres" value={precision} onChange={setPrecision} min={1} max={1000} /><NumberField label="Après la virgule" value={scale} onChange={(value) => setScale(Math.min(value, precision))} min={0} max={1000} /></div>}{numericKind === 'REAL' && <div className="flex gap-5"><Choice checked={floating === 'SINGLE'} onChange={() => setFloating('SINGLE')}>Simple (32 bits)</Choice><Choice checked={floating === 'DOUBLE'} onChange={() => setFloating('DOUBLE')}>Double (64 bits)</Choice></div>}</div>}
        {section === 'dateTime' && <div className="space-y-3"><SectionTitle>Date / Heure</SectionTitle><div className="flex flex-wrap gap-5"><Choice checked={dateTimeKind === 'DATE'} onChange={() => setDateTimeKind('DATE')}>Date</Choice><Choice checked={dateTimeKind === 'TIME'} onChange={() => setDateTimeKind('TIME')}>Heure</Choice><Choice checked={dateTimeKind === 'DATETIME'} onChange={() => setDateTimeKind('DATETIME')}>Date-heure</Choice></div>{dateTimeKind === 'DATETIME' && <label className="flex items-center gap-2 text-xs"><Checkbox checked={timezone} onCheckedChange={(checked) => setTimezone(checked === true)} />Avec fuseau horaire</label>}</div>}
        {section === 'other' && <div className="space-y-3"><SectionTitle>Autre</SectionTitle><div className="grid gap-2 sm:grid-cols-3"><Choice checked={otherKind === 'BOOLEAN'} onChange={() => setOtherKind('BOOLEAN')}>Booléen</Choice><Choice checked={otherKind === 'XML'} onChange={() => setOtherKind('XML')}>XML</Choice><Choice checked={otherKind === 'GEOMETRIC'} onChange={() => setOtherKind('GEOMETRIC')}>Géométrique</Choice><Choice checked={otherKind === 'GEOGRAPHIC'} onChange={() => setOtherKind('GEOGRAPHIC')}>Géographique</Choice><Choice checked={otherKind === 'FREE'} onChange={() => setOtherKind('FREE')}>Libre</Choice></div>{otherKind === 'FREE' && <Input value={freeType} onChange={(event) => setFreeType(event.target.value)} placeholder="Type PostgreSQL, ex. JSONB" />}</div>}
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-border/70 p-3"><legend className="px-1 text-xs font-semibold">Propriétés</legend><div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs">{target.kind === 'entity' && <label className="flex cursor-pointer items-center gap-2"><Checkbox checked={identifier} onCheckedChange={(checked) => setIdentifier(checked === true)} />Identifiant</label>}{identifier && target.kind === 'entity' ? <NumberField label="Ordre dans la clé" value={keyOrder} onChange={setKeyOrder} min={1} max={100} /> : <><label className="flex cursor-pointer items-center gap-2"><Checkbox checked={notNull} onCheckedChange={(checked) => setNotNull(checked === true)} />NOT NULL</label><label className="flex cursor-pointer items-center gap-2"><Checkbox checked={unique} onCheckedChange={(checked) => setUnique(checked === true)} />UNIQUE</label></>}</div></fieldset>
      <div className="space-y-1.5"><Label htmlFor="property-description">Commentaire</Label><Textarea id="property-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Rôle métier de cette propriété…" /></div>
      <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={close}>Annuler</Button><Button type="button" onClick={save} disabled={!name.trim()}>Enregistrer</Button></div>
    </div>
  </Modal>
}
