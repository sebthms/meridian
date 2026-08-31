import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { ChevronDown, ChevronRight, CircleDot, Database, KeyRound, Network, TableProperties } from 'lucide-react'
import { cardinalityToString } from '@/domain'
import { useProjectStore } from '@/store/project-store'
import { cn } from '@/lib/utils'

function TreeToggle({ open, label, onClick, children }: { open: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={open} className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {open ? <ChevronDown className="h-3 w-3 shrink-0" aria-hidden /> : <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />}
      {children}<span className="sr-only">{open ? `Replier ${label}` : `Déplier ${label}`}</span>
    </button>
  )
}

export function ProjectTreePanel() {
  const project = useProjectStore((state) => state.project)
  const select = useProjectStore((state) => state.select)
  const selectedId = useProjectStore((state) => state.selectedElementId)
  const [openEntities, setOpenEntities] = useState(true)
  const [openAssociations, setOpenAssociations] = useState(true)
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [expandedAssociations, setExpandedAssociations] = useState<Set<string>>(new Set())

  const toggle = (setter: Dispatch<SetStateAction<Set<string>>>, id: string) => setter((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return (
    <aside className="w-72 overflow-hidden rounded-xl border bg-card/95 shadow-xl backdrop-blur" aria-label="Arborescence du diagramme">
      <div className="border-b px-3 py-2"><p className="text-xs font-semibold">Structure du diagramme</p><p className="text-[10px] text-muted-foreground">{project.entities.length} entités · {project.associations.length} associations</p></div>
      <div className="max-h-[60vh] overflow-auto p-2 text-xs">
        <TreeToggle open={openEntities} label="les entités" onClick={() => setOpenEntities((open) => !open)}><Database className="h-3.5 w-3.5" aria-hidden />Entités</TreeToggle>
        {openEntities && <div className="ml-2 border-l border-border/60 pl-1">{project.entities.map((entity) => {
          const open = expandedEntities.has(entity.id)
          return <div key={entity.id}>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => toggle(setExpandedEntities, entity.id)} aria-expanded={open} aria-label={`${open ? 'Replier' : 'Déplier'} ${entity.name || 'entité'}`} className="rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{open ? <ChevronDown className="h-3 w-3" aria-hidden /> : <ChevronRight className="h-3 w-3" aria-hidden />}</button>
              <button type="button" onClick={() => select(entity.id)} aria-current={selectedId === entity.id ? 'true' : undefined} className={cn('flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === entity.id && 'bg-accent text-accent-foreground')}><span className="truncate">{entity.name || 'Sans nom'}</span><span className="ml-auto text-[10px] text-muted-foreground">{entity.attributes.length}</span></button>
            </div>
            {open && <div className="ml-7 space-y-0.5 border-l border-border/40 py-1 pl-2">{entity.attributes.map((attribute) => {
              const isIdentifier = entity.identifiers.some((identifier) => identifier.attributeIds.includes(attribute.id))
              return <div key={attribute.id} className="flex items-center gap-1.5 truncate py-0.5 text-[11px] text-muted-foreground" title={attribute.name}>{isIdentifier ? <KeyRound className="h-3 w-3 shrink-0 text-amber-500" aria-label="Identifiant" /> : <TableProperties className="h-3 w-3 shrink-0" aria-hidden />}{attribute.name || 'Sans nom'}</div>
            })}{entity.identifiers.map((identifier, index) => <div key={identifier.id} className="flex items-center gap-1.5 truncate py-0.5 text-[10px] text-amber-600 dark:text-amber-400"><KeyRound className="h-3 w-3 shrink-0" aria-hidden />{identifier.name || (index === 0 ? 'Identifiant principal' : `Identifiant ${index + 1}`)}</div>)}</div>}
          </div>
        })}</div>}

        <TreeToggle open={openAssociations} label="les associations" onClick={() => setOpenAssociations((open) => !open)}><Network className="h-3.5 w-3.5" aria-hidden />Associations</TreeToggle>
        {openAssociations && <div className="ml-2 border-l border-border/60 pl-1">{project.associations.map((association) => {
          const open = expandedAssociations.has(association.id)
          return <div key={association.id}>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => toggle(setExpandedAssociations, association.id)} aria-expanded={open} aria-label={`${open ? 'Replier' : 'Déplier'} ${association.name || 'association'}`} className="rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{open ? <ChevronDown className="h-3 w-3" aria-hidden /> : <ChevronRight className="h-3 w-3" aria-hidden />}</button>
              <button type="button" onClick={() => select(association.id)} aria-current={selectedId === association.id ? 'true' : undefined} className={cn('flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === association.id && 'bg-accent text-accent-foreground')}><CircleDot className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden /><span className="truncate">{association.name || 'Sans nom'}</span><span className="ml-auto text-[10px] text-muted-foreground">{association.participants.length}</span></button>
            </div>
            {open && <div className="ml-7 space-y-0.5 border-l border-border/40 py-1 pl-2">{association.participants.map((participant, index) => <div key={`${participant.entityId}-${index}`} className="truncate py-0.5 text-[10px] text-muted-foreground">{project.entities.find((entity) => entity.id === participant.entityId)?.name || 'Entité inconnue'}{participant.role ? ` · ${participant.role}` : ''} · {cardinalityToString(participant.cardinality)}</div>)}{association.attributes.map((attribute) => <div key={attribute.id} className="flex items-center gap-1.5 truncate py-0.5 text-[11px] text-muted-foreground"><TableProperties className="h-3 w-3 shrink-0" aria-hidden />{attribute.name || 'Sans nom'}</div>)}</div>}
          </div>
        })}</div>}
      </div>
    </aside>
  )
}
