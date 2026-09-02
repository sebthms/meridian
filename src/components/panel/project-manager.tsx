import { useMemo, useState } from 'react'
import { ArrowRight, Boxes, Check, Filter, LayoutTemplate, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import { PanelShell } from '@/components/panel/shell'
import { useProjectStore } from '@/store/project-store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmPopover } from '@/components/shared/confirm-popover'
import type { Project } from '@/domain'
import templateCatalog from '@/templates/catalog.json'
import templateProjects from '@/templates/projects.json'

type TemplateOption = { id: string; label: string; category: string; description: string }
const templates = templateCatalog as TemplateOption[]
const projectsByTemplate = templateProjects as Record<string, Project>

export function ProjectManagerPanel({
  open,
  onClose,
  variant = 'modal',
  embedded = false,
}: {
  open: boolean
  onClose: () => void
  variant?: 'modal' | 'panel'
  embedded?: boolean
}) {
  const projects = useProjectStore((state) => state.projects)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const createProject = useProjectStore((state) => state.createProject)
  const createProjectFromTemplate = useProjectStore((state) => state.createProjectFromTemplate)
  const openProject = useProjectStore((state) => state.openProject)
  const renameProject = useProjectStore((state) => state.renameProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const [filter, setFilter] = useState('')
  const [adding, setAdding] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [useTemplate, setUseTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const visibleProjects = useMemo(() => projects
    .filter((item) => item.project.name.toLowerCase().includes(filter.trim().toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [projects, filter])

  const selectedProjectTemplate = selectedTemplate ? projectsByTemplate[selectedTemplate] : null

  const submitCreate = () => {
    if (!inputValue.trim() || (useTemplate && !selectedTemplate)) return
    if (useTemplate && selectedTemplate) createProjectFromTemplate(inputValue.trim(), projectsByTemplate[selectedTemplate]!)
    else createProject(inputValue.trim())
    setInputValue('')
    setAdding(false)
    setUseTemplate(false)
    setSelectedTemplate(null)
    onClose()
  }

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          {adding ? <input autoFocus value={inputValue} onChange={(event) => setInputValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitCreate(); if (event.key === 'Escape') setAdding(false) }} placeholder="Nom du diagramme" aria-label="Nom du nouveau diagramme" className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:border-primary" /> : <><Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrer les diagrammes" aria-label="Filtrer les diagrammes" className="h-8 w-full rounded-md border bg-background pl-7 pr-2 text-xs outline-none focus:border-primary" /></>}
        </div>
        {adding ? <><Tooltip><TooltipTrigger asChild><button type="button" aria-label="Créer le diagramme" onClick={submitCreate} disabled={!inputValue.trim() || (useTemplate && !selectedTemplate)} className="rounded-md p-1.5 text-success hover:bg-accent disabled:opacity-40"><Check className="h-4 w-4" /></button></TooltipTrigger><TooltipContent>Créer le diagramme</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><button type="button" aria-label="Annuler la création" onClick={() => { setAdding(false); setUseTemplate(false); setSelectedTemplate(null) }} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button></TooltipTrigger><TooltipContent>Annuler la création</TooltipContent></Tooltip></> : <><Tooltip><TooltipTrigger asChild><span className="rounded-md p-1.5 text-muted-foreground"><Filter className="h-4 w-4" /></span></TooltipTrigger><TooltipContent>Trier par modification récente</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><button type="button" aria-label="Nouveau diagramme" onClick={() => setAdding(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Plus className="h-4 w-4" /></button></TooltipTrigger><TooltipContent>Nouveau diagramme</TooltipContent></Tooltip></>}
      </div>
      {adding && <div className="relative z-50 space-y-3 border-y border-border/60 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5 text-warning" aria-hidden />Démarrer avec une base</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Choisissez un modèle prêt à explorer.</p>
          </div>
          <button type="button" onClick={() => { setUseTemplate(false); setSelectedTemplate(null) }} className={`rounded-md px-2 py-1 text-[10px] transition-colors ${!useTemplate ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-accent'}`}>Projet vide</button>
        </div>
        <div className="grid gap-2" aria-label="Modèles de diagramme">
          {templates.map((template) => {
            const templateProject = projectsByTemplate[template.id]
            const selected = selectedTemplate === template.id
            return <button key={template.id} type="button" aria-pressed={selected} onClick={() => { setUseTemplate(true); setSelectedTemplate(template.id) }} className={`group/template flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors ${selected ? 'bg-primary/10 text-foreground ring-1 ring-primary/40' : 'bg-muted/45 text-foreground hover:bg-accent'}`}>
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-background text-primary shadow-sm'}`}><LayoutTemplate className="h-4 w-4" aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-xs font-semibold"><span className="truncate">{template.label}</span><span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{template.category}</span></span>
                <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">{template.description}</span>
                <span className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Boxes className="h-3 w-3" aria-hidden />{templateProject.entities.length} entités</span><span>{templateProject.associations.length} associations</span></span>
              </span>
              <ArrowRight className={`mt-1 h-3.5 w-3.5 shrink-0 transition-transform group-hover/template:translate-x-0.5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden />
            </button>
          })}
        </div>
        {useTemplate && selectedProjectTemplate && <p className="text-[10px] text-primary">Le modèle « {selectedProjectTemplate.name} » sera copié et tu pourras le modifier librement.</p>}
      </div>}
      <div className="scrollbar-subtle max-h-[52vh] overflow-x-hidden overflow-y-auto pr-1" aria-label="Liste des diagrammes">
        {visibleProjects.length === 0 && <p className="py-5 text-center text-xs text-muted-foreground">Aucun diagramme trouvé.</p>}
        {visibleProjects.map((item) => {
          const editing = editingId === item.id
          return <div key={item.id} className="group/project relative z-0 flex min-h-10 items-center justify-between gap-2 border-b border-border/60 py-2 transition-colors hover:z-10 last:border-0">
            {editing ? <input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { renameProject(item.id, editingName); setEditingId(null) }; if (event.key === 'Escape') setEditingId(null) }} className="min-w-0 flex-1 rounded border bg-background px-2 py-1 text-xs outline-none focus:border-primary" /> : <button type="button" onClick={() => { openProject(item.id); onClose() }} className={`min-w-0 flex-1 truncate text-left text-xs ${item.id === activeProjectId ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{item.project.name}</button>}
            <span className="flex shrink-0 items-center gap-1">
              <span className="text-[10px] text-muted-foreground transition-opacity duration-150 group-hover/project:opacity-0">{new Date(item.updatedAt).toLocaleDateString('fr-FR')}</span>
              <span className="absolute right-0 z-20 flex items-center gap-0.5 rounded-md bg-card px-0.5 opacity-0 shadow-sm transition-opacity duration-150 group-hover/project:opacity-100">
                {editing ? <Tooltip><TooltipTrigger asChild><button type="button" aria-label="Valider le renommage" onClick={() => { renameProject(item.id, editingName); setEditingId(null) }} className="rounded p-1 text-success hover:bg-accent"><Check className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>Valider le renommage</TooltipContent></Tooltip> : <Tooltip><TooltipTrigger asChild><button type="button" aria-label="Renommer" onClick={() => { setEditingId(item.id); setEditingName(item.project.name) }} className="rounded p-1 text-muted-foreground hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>Renommer</TooltipContent></Tooltip>}
                <Tooltip><TooltipTrigger asChild><button type="button" aria-label="Supprimer" onClick={() => setDeleteId(deleteId === item.id ? null : item.id)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>Supprimer</TooltipContent></Tooltip>
              </span>
            </span>
            {deleteId === item.id && <div className="absolute right-0 top-8 z-30 w-56"><ConfirmPopover message={<>Supprimer « {item.project.name} » ?</>} onCancel={() => setDeleteId(null)} onConfirm={() => { deleteProject(item.id); setDeleteId(null) }} confirmLabel="Supprimer" /></div>}
          </div>
        })}
      </div>
    </div>
  )

  return (
    <PanelShell
      open={open}
      onClose={onClose}
      ariaLabel="Mes diagrammes"
      title="Mes diagrammes"
      variant={variant}
      embedded={embedded}
      modalClassName="max-w-xl"
    >
      {content}
    </PanelShell>
  )
}
