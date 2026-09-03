import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { ArrowRightLeft, ChevronDown, ChevronRight, CircleDot, Database, GitFork, Network, ScrollText, ShieldAlert } from 'lucide-react'
import { CONSTRAINT_KIND_META, inheritanceMark } from '@/domain/index'
import { cardinalityToString } from '@/domain/index'
import { useProjectStore } from '@/store/project-store'
import { cn } from '@/shared/utils/cn'
import { TreeProperty } from './tree-property'

function TreeToggle({ open, label, onClick, children }: { open: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={open} className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {open ? <ChevronDown className="h-3 w-3 shrink-0" aria-hidden /> : <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />}
      {children}<span className="sr-only">{open ? `Replier ${label}` : `Déplier ${label}`}</span>
    </button>
  )
}

export function ProjectTreePanel({ embedded = false }: { embedded?: boolean }) {
  const project = useProjectStore((state) => state.project)
  const select = useProjectStore((state) => state.select)
  const selectedId = useProjectStore((state) => state.selectedElementId)
  const [openEntities, setOpenEntities] = useState(true)
  const [openAssociations, setOpenAssociations] = useState(true)
  const [openInheritances, setOpenInheritances] = useState(true)
  const [openConstraints, setOpenConstraints] = useState(true)
  const [openCifs, setOpenCifs] = useState(true)
  const [openRules, setOpenRules] = useState(true)
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [expandedAssociations, setExpandedAssociations] = useState<Set<string>>(new Set())

  const toggle = (setter: Dispatch<SetStateAction<Set<string>>>, id: string) => setter((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return (
    <aside className={embedded ? 'w-full overflow-hidden' : 'w-full overflow-hidden rounded-xl border bg-card/95 p-5 shadow-xl backdrop-blur'} aria-label="Arborescence du diagramme">
      <div className="scrollbar-subtle max-h-[60vh] overflow-x-hidden overflow-y-auto text-xs">
        <TreeToggle open={openEntities} label="les entités" onClick={() => setOpenEntities((open) => !open)}><Database className="h-3.5 w-3.5" aria-hidden />Entités</TreeToggle>
        {openEntities && <div className="ml-2 border-l border-border/60 pl-1">{project.entities.map((entity) => {
          const open = expandedEntities.has(entity.id)
          return <div key={entity.id}>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => toggle(setExpandedEntities, entity.id)} aria-expanded={open} aria-label={`${open ? 'Replier' : 'Déplier'} ${entity.name || 'entité'}`} className="rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{open ? <ChevronDown className="h-3 w-3" aria-hidden /> : <ChevronRight className="h-3 w-3" aria-hidden />}</button>
              <button type="button" onClick={() => select(entity.id)} aria-current={selectedId === entity.id ? 'true' : undefined} className={cn('flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === entity.id && 'bg-accent text-accent-foreground')}><span className="truncate">{entity.name || 'Sans nom'}</span><span className="ml-auto text-[10px] text-muted-foreground">{entity.attributes.length}</span></button>
            </div>
            {open && <div className="ml-7 space-y-0.5 border-l border-border/40 py-1 pl-2">{entity.attributes.map((attribute) => <TreeProperty key={attribute.id} attribute={attribute} entity={entity} />)}</div>}
          </div>
        })}</div>}

        <div className="mt-2"><TreeToggle open={openAssociations} label="les associations" onClick={() => setOpenAssociations((open) => !open)}><Network className="h-3.5 w-3.5" aria-hidden />Associations</TreeToggle></div>
        {openAssociations && <div className="ml-2 border-l border-border/60 pl-1">{project.associations.map((association) => {
          const open = expandedAssociations.has(association.id)
          return <div key={association.id}>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => toggle(setExpandedAssociations, association.id)} aria-expanded={open} aria-label={`${open ? 'Replier' : 'Déplier'} ${association.name || 'association'}`} className="rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{open ? <ChevronDown className="h-3 w-3" aria-hidden /> : <ChevronRight className="h-3 w-3" aria-hidden />}</button>
              <button type="button" onClick={() => select(association.id)} aria-current={selectedId === association.id ? 'true' : undefined} className={cn('flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === association.id && 'bg-accent text-accent-foreground')}><CircleDot className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden /><span className="truncate">{association.name || 'Sans nom'}</span><span className="ml-auto text-[10px] text-muted-foreground">{association.participants.length}</span></button>
            </div>
            {open && <div className="ml-7 space-y-0.5 border-l border-border/40 py-1 pl-2">{association.participants.map((participant, index) => <div key={`${participant.entityId}-${index}`} className="truncate py-0.5 text-[10px] text-muted-foreground">{project.entities.find((entity) => entity.id === participant.entityId)?.name || 'Entité inconnue'}{participant.role ? ` · ${participant.role}` : ''} · {cardinalityToString(participant.cardinality)}</div>)}{association.attributes.map((attribute) => <TreeProperty key={attribute.id} attribute={attribute} />)}</div>}
          </div>
        })}</div>}

        <div className="mt-2"><TreeToggle open={openInheritances} label="les héritages" onClick={() => setOpenInheritances((open) => !open)}><GitFork className="h-3.5 w-3.5" aria-hidden />Héritages</TreeToggle></div>
        {openInheritances && <div className="ml-2 border-l border-border/60 pl-1">{project.inheritances.map((inheritance) => (
          <button key={inheritance.id} type="button" onClick={() => select(inheritance.id)} aria-current={selectedId === inheritance.id ? 'true' : undefined} className={cn('flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === inheritance.id && 'bg-accent text-accent-foreground')}>
            <span className="truncate">{inheritance.name || 'Héritage'}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{inheritanceMark(inheritance)}</span>
          </button>
        ))}</div>}

        <div className="mt-2"><TreeToggle open={openConstraints} label="les contraintes" onClick={() => setOpenConstraints((open) => !open)}><ShieldAlert className="h-3.5 w-3.5" aria-hidden />Contraintes</TreeToggle></div>
        {openConstraints && <div className="ml-2 border-l border-border/60 pl-1">{project.constraints.map((constraint) => (
          <button key={constraint.id} type="button" onClick={() => select(constraint.id)} aria-current={selectedId === constraint.id ? 'true' : undefined} className={cn('flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === constraint.id && 'bg-accent text-accent-foreground')}>
            <span className="truncate">{constraint.name || 'Contrainte'}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{CONSTRAINT_KIND_META[constraint.kind].mark}</span>
          </button>
        ))}</div>}

        <div className="mt-2"><TreeToggle open={openCifs} label="les CIF" onClick={() => setOpenCifs((open) => !open)}><ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />CIF</TreeToggle></div>
        {openCifs && <div className="ml-2 border-l border-border/60 pl-1">{project.cifs.map((cif) => (
          <button key={cif.id} type="button" onClick={() => select(cif.id)} aria-current={selectedId === cif.id ? 'true' : undefined} className={cn('flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === cif.id && 'bg-accent text-accent-foreground')}>
            <span className="truncate">{cif.name || 'CIF'}</span>
          </button>
        ))}</div>}

        <div className="mt-2"><TreeToggle open={openRules} label="les règles métier" onClick={() => setOpenRules((open) => !open)}><ScrollText className="h-3.5 w-3.5" aria-hidden />Règles métier</TreeToggle></div>
        {openRules && <div className="ml-2 border-l border-border/60 pl-1">{project.businessRules.map((rule) => (
          <button key={rule.id} type="button" onClick={() => select(rule.id)} aria-current={selectedId === rule.id ? 'true' : undefined} className={cn('flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === rule.id && 'bg-accent text-accent-foreground')}>
            <span className="truncate">{rule.name || 'Règle métier'}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{rule.level}</span>
          </button>
        ))}</div>}
      </div>
    </aside>
  )
}
