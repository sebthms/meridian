import { useEffect, useMemo, useState } from 'react'
import { Check, FilePlus, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PanelShell } from '@/shared/components/panel-shell'
import { sidebarLayout } from '@/shared/layout/panel-layout'
import { useProjectStore } from '@/store/project-store'
import { AppTooltip } from '@/shared/ui/tooltip'
import { ConfirmPopover } from '@/shared/components/confirm-popover'
import { getTemplateProjects } from '@/i18n/templates'
import { useLocale } from '@/i18n/use-locale'
import { cn } from '@/shared/utils/cn'
import templateCatalog from '@/features/project-library/templates/catalog.json'

type TemplateOption = { id: string }
const templates = templateCatalog as TemplateOption[]

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
  const { t } = useTranslation()
  const { locale } = useLocale()
  const projectsByTemplate = useMemo(() => getTemplateProjects(locale), [locale])
  const projects = useProjectStore((state) => state.projects)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const createProject = useProjectStore((state) => state.createProject)
  const createProjectFromTemplate = useProjectStore((state) => state.createProjectFromTemplate)
  const openProject = useProjectStore((state) => state.openProject)
  const renameProject = useProjectStore((state) => state.renameProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const [filter, setFilter] = useState('')
  const [adding, setAdding] = useState(projects.length === 0)
  const [inputValue, setInputValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length === 0) setAdding(true)
  }, [projects.length])

  const visibleProjects = useMemo(() => projects
    .filter((item) => item.project.name.toLowerCase().includes(filter.trim().toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [projects, filter])

  const submitCreate = () => {
    const name = inputValue.trim()
    if (!name) return
    const template = selectedTemplate ? projectsByTemplate[selectedTemplate] : undefined
    if (template) createProjectFromTemplate(name, template)
    else createProject(name)
    setInputValue('')
    setAdding(projects.length === 0)
    setSelectedTemplate(null)
    onClose()
  }

  const cancelCreate = () => {
    if (projects.length === 0) return
    setAdding(false)
    setSelectedTemplate(null)
    setInputValue('')
  }

  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR'

  const content = (
    <div className={sidebarLayout.section}>
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          {adding ? (
            <input
              autoFocus
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitCreate()
                if (event.key === 'Escape') cancelCreate()
              }}
              placeholder={t('projects.newName')}
              aria-label={t('projects.newNameAria')}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary"
            />
          ) : (
            <>
              <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={t('projects.filter')}
                aria-label={t('projects.filterAria')}
                className="h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-xs outline-none focus:border-primary"
              />
            </>
          )}
        </div>
        {adding ? (
          <>
            <AppTooltip content={t('common.create')}>
              <button type="button" aria-label={t('projects.createAria')} onClick={submitCreate} disabled={!inputValue.trim()} className="rounded-md p-1.5 text-success hover:bg-accent disabled:opacity-40">
                <Check className="h-4 w-4" />
              </button>
            </AppTooltip>
            {projects.length > 0 && (
              <AppTooltip content={t('common.cancel')}>
                <button type="button" aria-label={t('projects.cancelCreateAria')} onClick={cancelCreate} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
                  <X className="h-4 w-4" />
                </button>
              </AppTooltip>
            )}
          </>
        ) : (
          <>
            <AppTooltip content={t('projects.sortRecent')}>
              <span className="rounded-md p-1.5 text-muted-foreground"><Filter className="h-4 w-4" /></span>
            </AppTooltip>
            <AppTooltip content={t('projects.newDiagram')}>
              <button type="button" aria-label={t('projects.newDiagram')} onClick={() => setAdding(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <Plus className="h-4 w-4" />
              </button>
            </AppTooltip>
          </>
        )}
      </div>

      {adding && (
        <div className="space-y-1" role="listbox" aria-label={t('projects.templateList')}>
          <button
            type="button"
            role="option"
            aria-selected={selectedTemplate === null}
            onClick={() => setSelectedTemplate(null)}
            className={cn(
              'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition-colors',
              selectedTemplate === null ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60',
            )}
          >
            <FilePlus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-medium">{t('common.empty')}</span>
          </button>
          {templates.map((template) => {
            const templateProject = projectsByTemplate[template.id]
            const selected = selectedTemplate === template.id
            const entityCount = templateProject?.entities.length ?? 0
            const associationCount = templateProject?.associations.length ?? 0
            const label = t(`templates.${template.id}.label`)
            const category = t(`templates.${template.id}.category`)
            return (
              <button
                key={template.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  'flex h-8 w-full items-center rounded-md px-2 text-left text-xs transition-colors',
                  selected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60',
                )}
              >
                <AppTooltip content={t('projects.templateMeta', {
                  category,
                  entities: t('common.entity', { count: entityCount }),
                  associations: t('common.association', { count: associationCount }),
                })}>
                  <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
                </AppTooltip>
              </button>
            )
          })}
        </div>
      )}

      {!adding && (
        <div className="scrollbar-subtle max-h-[52vh] overflow-x-hidden overflow-y-auto pr-1" aria-label={t('projects.listAria')}>
          {visibleProjects.length === 0 && <p className="py-5 text-center text-xs text-muted-foreground">{t('projects.noProjects')}</p>}
          {visibleProjects.map((item) => {
            const editing = editingId === item.id
            return (
              <div key={item.id} className="group/project relative z-0 flex min-h-10 items-center justify-between gap-2 border-b border-border/60 py-2 transition-colors hover:z-10 last:border-0">
                {editing ? (
                  <input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { renameProject(item.id, editingName); setEditingId(null) }; if (event.key === 'Escape') setEditingId(null) }} className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary" />
                ) : (
                  <button type="button" onClick={() => { openProject(item.id); onClose() }} className={cn('min-w-0 flex-1 truncate text-left text-xs', item.id === activeProjectId ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')}>{item.project.name}</button>
                )}
                <span className="flex shrink-0 items-center gap-1">
                  <span className="text-[10px] text-muted-foreground transition-opacity duration-150 group-hover/project:opacity-0">{new Date(item.updatedAt).toLocaleDateString(dateLocale)}</span>
                  <span className="absolute right-0 z-20 flex items-center gap-0.5 rounded-md bg-card px-0.5 opacity-0 shadow-sm transition-opacity duration-150 group-hover/project:opacity-100">
                    {editing ? (
                      <AppTooltip content={t('common.validate')}><button type="button" aria-label={t('projects.renameAria')} onClick={() => { renameProject(item.id, editingName); setEditingId(null) }} className="rounded p-1 text-success hover:bg-accent"><Check className="h-3.5 w-3.5" /></button></AppTooltip>
                    ) : (
                      <AppTooltip content={t('common.rename')}><button type="button" aria-label={t('common.rename')} onClick={() => { setEditingId(item.id); setEditingName(item.project.name) }} className="rounded p-1 text-muted-foreground hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button></AppTooltip>
                    )}
                    <AppTooltip content={t('common.delete')}><button type="button" aria-label={t('common.delete')} onClick={() => setDeleteId(deleteId === item.id ? null : item.id)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></AppTooltip>
                  </span>
                </span>
                {deleteId === item.id && (
                  <div className="absolute right-0 top-8 z-30">
                    <ConfirmPopover
                      message={t('projects.deleteConfirm', { name: item.project.name })}
                      onCancel={() => setDeleteId(null)}
                      onConfirm={() => {
                        deleteProject(item.id)
                        setDeleteId(null)
                      }}
                      confirmLabel={t('common.delete')}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <PanelShell
      open={open}
      onClose={onClose}
      ariaLabel={t('projects.title')}
      title={t('projects.title')}
      variant={variant}
      embedded={embedded}
      modalClassName="max-w-md"
    >
      {content}
    </PanelShell>
  )
}
