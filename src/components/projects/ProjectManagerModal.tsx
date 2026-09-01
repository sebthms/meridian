import { useMemo, useState } from 'react'
import { Check, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useProjectStore } from '@/store/project-store'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { ConfirmPopover } from '@/components/ui/ConfirmPopover'
import type { Project } from '@/domain'
import templateCatalog from '@/templates/catalog.json'
import templateProjects from '@/templates/projects.json'

type TemplateOption = { id: string; label: string; description: string }
const templates = templateCatalog as TemplateOption[]
const projectsByTemplate = templateProjects as Record<string, Project>

export function ProjectManagerModal({ open, onClose, panel = false, embedded = false }: { open: boolean; onClose: () => void; panel?: boolean; embedded?: boolean }) {
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
        {adding ? <><InfoPopover label="Créer"><button type="button" aria-label="Créer le diagramme" onClick={submitCreate} disabled={!inputValue.trim() || (useTemplate && !selectedTemplate)} className="rounded-md p-1.5 text-emerald-600 hover:bg-accent disabled:opacity-40"><Check className="h-4 w-4" /></button></InfoPopover><InfoPopover label="Annuler"><button type="button" aria-label="Annuler la création" onClick={() => { setAdding(false); setUseTemplate(false); setSelectedTemplate(null) }} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button></InfoPopover></> : <><InfoPopover label="Trier par modification récente"><span className="rounded-md p-1.5 text-muted-foreground"><Filter className="h-4 w-4" /></span></InfoPopover><InfoPopover label="Nouveau diagramme"><button type="button" aria-label="Nouveau diagramme" onClick={() => setAdding(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Plus className="h-4 w-4" /></button></InfoPopover></>}
      </div>
      {adding && <div className="relative z-50 space-y-2 px-0.5 py-1">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={useTemplate} onChange={(event) => { setUseTemplate(event.target.checked); if (!event.target.checked) setSelectedTemplate(null) }} className="h-3.5 w-3.5 accent-primary" />
          use template ?
        </label>
        {useTemplate && <div className="flex flex-wrap gap-1.5" aria-label="Catégories de templates">
          {templates.map((template) => <InfoPopover key={template.id} label={template.description}>
            <button type="button" aria-pressed={selectedTemplate === template.id} onClick={() => setSelectedTemplate(template.id)} className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${selectedTemplate === template.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'}`}>{template.label}</button>
          </InfoPopover>)}
        </div>}
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
                {editing ? <InfoPopover label="Valider"><button type="button" aria-label="Valider le renommage" onClick={() => { renameProject(item.id, editingName); setEditingId(null) }} className="rounded p-1 text-emerald-600 hover:bg-accent"><Check className="h-3.5 w-3.5" /></button></InfoPopover> : <InfoPopover label="Renommer"><button type="button" aria-label="Renommer" onClick={() => { setEditingId(item.id); setEditingName(item.project.name) }} className="rounded p-1 text-muted-foreground hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button></InfoPopover>}
                <InfoPopover label="Supprimer"><button type="button" aria-label="Supprimer" onClick={() => setDeleteId(deleteId === item.id ? null : item.id)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></InfoPopover>
              </span>
            </span>
            {deleteId === item.id && <div className="absolute right-0 top-8 z-30 w-56"><ConfirmPopover message={<>Supprimer « {item.project.name} » ?</>} onCancel={() => setDeleteId(null)} onConfirm={() => { deleteProject(item.id); setDeleteId(null) }} confirmLabel="Supprimer" /></div>}
          </div>
        })}
      </div>
    </div>
  )

  if (!open) return null
  return panel ? <aside className={`relative z-50 w-80 ${embedded ? 'p-4' : 'rounded-xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur'}`} aria-label="Mes diagrammes">{content}</aside> : <Modal open onClose={onClose} title="Mes diagrammes" className="max-w-xl">{content}</Modal>
}
