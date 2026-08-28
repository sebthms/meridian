import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/project-store'
import { addAttributeWithName, updateAttribute, toggleIdentifierAttribute } from '@/editor'
import { cn } from '@/lib/utils'
import type { ConceptualType } from '@/domain'

type Category = 'texte' | 'numerique' | 'date' | 'autre'

const CATEGORY_LABELS: Record<Category, string> = {
  texte: 'Texte',
  numerique: 'Numérique',
  date: 'Date / Heure',
  autre: 'Autre',
}

const SUBTYPES: Record<Category, { value: string; label: string }[]> = {
  texte: [
    { value: 'ascii', label: 'Caractères ASCII' },
    { value: 'unicode', label: 'Caractères Unicode' },
    { value: 'binaire', label: 'Binaire' },
  ],
  numerique: [
    { value: 'entier', label: 'Entier' },
    { value: 'decimal', label: 'Décimal' },
    { value: 'reel', label: 'Réel' },
    { value: 'monetaire', label: 'Monétaire' },
    { value: 'compteur', label: 'Compteur (auto)' },
  ],
  date: [
    { value: 'date', label: 'Date' },
    { value: 'heure', label: 'Heure' },
    { value: 'date-heure', label: 'Date-Heure' },
  ],
  autre: [
    { value: 'booleen', label: 'Booléen' },
    { value: 'xml', label: 'XML' },
    { value: 'geometrique', label: 'Géométrique' },
    { value: 'geographique', label: 'Géographique' },
    { value: 'libre', label: 'Libre (non typé)' },
  ],
}

function toConceptualType(cat: Category, sub: string): ConceptualType {
  if (cat === 'texte') return 'TEXT'
  if (cat === 'numerique') return sub === 'entier' ? 'INTEGER' : 'DECIMAL'
  if (cat === 'date') return 'DATE'
  return sub === 'booleen' ? 'BOOLEAN' : 'TEXT'
}

/**
 * Modal d'ajout de propriété (côté visuel complet). Les champs avancés
 * (longueur, collation, stockage, nom logique…) sont collectés mais seuls
 * les champs supportés par le modèle (nom, type, NOT NULL, UNIQUE, complément,
 * identifiant) sont réellement appliqués pour l'instant.
 */
export function AddPropertyModal() {
  const entityId = useProjectStore((s) => s.addPropertyEntityId)
  const project = useProjectStore((s) => s.project)
  const apply = useProjectStore((s) => s.apply)
  const close = useProjectStore((s) => s.closeAddProperty)

  const [nom, setNom] = useState('')
  const [logical, setLogical] = useState('')
  const [logicalTouched, setLogicalTouched] = useState(false)
  const [category, setCategory] = useState<Category>('texte')
  const [subType, setSubType] = useState('ascii')
  const [storage, setStorage] = useState<'variable' | 'fixe' | 'volumineux'>('variable')
  const [length, setLength] = useState(50)
  const [collation, setCollation] = useState('')
  const [notNull, setNotNull] = useState(false)
  const [unique, setUnique] = useState(false)
  const [identifier, setIdentifier] = useState(false)
  const [complement, setComplement] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Réinitialise tous les champs à chaque ouverture (nouvelle entité).
  useEffect(() => {
    if (!entityId) return
    setNom('')
    setLogical('')
    setLogicalTouched(false)
    setCategory('texte')
    setSubType('ascii')
    setStorage('variable')
    setLength(50)
    setCollation('')
    setNotNull(false)
    setUnique(false)
    setIdentifier(false)
    setComplement('')
    setComment('')
    setError(null)
  }, [entityId])

  // Nom logique dérivé en live du nom (majuscules + snake_case).
  useEffect(() => {
    if (!logicalTouched) setLogical(nom.toUpperCase().replace(/\s+/g, '_'))
  }, [nom, logicalTouched])

  if (!entityId) return null

  const onOk = () => {
    if (!nom.trim()) return
    const ct = toConceptualType(category, subType)
    const res = addAttributeWithName(project, entityId, nom.trim(), ct)
    if (res.attributeId === '') {
      setError('Cette propriété existe déjà dans l’entité.')
      return
    }
    let next = res.project
    if (notNull) next = updateAttribute(next, entityId, res.attributeId, { nullable: false })
    if (unique) next = updateAttribute(next, entityId, res.attributeId, { unique: true })
    if (complement.trim())
      next = updateAttribute(next, entityId, res.attributeId, { description: complement.trim() })
    if (identifier) next = toggleIdentifierAttribute(next, entityId, res.attributeId)
    apply(next)
    close()
  }

  return (
    <Modal open onClose={close} title="Ajouter une propriété">
      <div className="space-y-5">
        {/* 1. Nom */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nom</h3>
          <div className="space-y-1.5">
            <Label htmlFor="prop-nom">Nom</Label>
            <Input
              id="prop-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="nom_propriété"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prop-logical">Nom logique</Label>
            <Input
              id="prop-logical"
              value={logical}
              onChange={(e) => {
                setLogical(e.target.value)
                setLogicalTouched(true)
              }}
            />
          </div>
        </section>

        {/* 2. Type de donnée */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Type de donnée
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SUBTYPES) as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat)
                  setSubType(SUBTYPES[cat][0].value)
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  category === cat
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <RadioGroup value={subType} onValueChange={setSubType} className="gap-1.5">
            {SUBTYPES[category].map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value={opt.value} id={`sub-${opt.value}`} />
                <span>{opt.label}</span>
              </label>
            ))}
          </RadioGroup>

          {category === 'texte' && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <RadioGroup value={storage} onValueChange={(v) => setStorage(v as typeof storage)} className="gap-1.5">
                {(['variable', 'fixe', 'volumineux'] as const).map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm capitalize">
                    <RadioGroupItem value={s} id={`storage-${s}`} />
                    <span>{s}</span>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex items-center gap-2">
                <Label htmlFor="prop-length" className="shrink-0">
                  Longueur
                </Label>
                <Input
                  id="prop-length"
                  type="number"
                  min={1}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="prop-collation" className="shrink-0">
                  Collation
                </Label>
                <Input
                  id="prop-collation"
                  value={collation}
                  onChange={(e) => setCollation(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </section>

        {/* 3. Propriétés (contraintes) */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Propriétés
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={identifier} onCheckedChange={(c) => setIdentifier(c === true)} />
              <span>Identifiant</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={notNull} onCheckedChange={(c) => setNotNull(c === true)} />
              <span>NOT NULL</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={unique} onCheckedChange={(c) => setUnique(c === true)} />
              <span>UNIQUE</span>
            </label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prop-complement">Complément</Label>
            <Input
              id="prop-complement"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="valeur par défaut, expression…"
            />
          </div>
        </section>

        {/* 4. Commentaire */}
        <section className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Commentaire
          </h3>
          <Textarea
            id="prop-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </section>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* 5. Actions */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={close}>
            Annuler
          </Button>
          <Button type="button" onClick={onOk} disabled={!nom.trim()}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  )
}
