import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, EyeOff } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { cn } from '@/lib/utils'
import { InfoPopover } from '@/components/ui/InfoPopover'

const SEVERITY_STYLE: Record<string, { dot: string; label: string }> = {
  error: { dot: 'bg-red-500', label: 'Erreur' },
  warning: { dot: 'bg-amber-500', label: 'Avertissement' },
  info: { dot: 'bg-sky-500', label: 'Info' },
}

export function IssuesPanel() {
  const issues = useProjectStore((s) => s.issues)
  const project = useProjectStore((s) => s.project)
  const select = useProjectStore((s) => s.select)
  const ignoreRule = useProjectStore((s) => s.ignoreRule)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const groups = [...issues.reduce((map, issue) => {
    const current = map.get(issue.ruleId) ?? []
    current.push(issue)
    map.set(issue.ruleId, current)
    return map
  }, new Map<string, typeof issues>())].map(([ruleId, ruleIssues]) => ({ ruleId, issues: ruleIssues, first: ruleIssues[0]! }))

  if (groups.length === 0) {
    return <div className="flex items-center gap-2 p-4 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" aria-hidden />Modèle valide</div>
  }

  return <div className="divide-y divide-border">
    {groups.map(({ ruleId, issues: ruleIssues, first }) => {
      const open = expanded.has(ruleId)
      const style = SEVERITY_STYLE[first.severity] ?? SEVERITY_STYLE.info
      const affected = [...new Set(ruleIssues.flatMap((issue) => issue.targetIds))]
      return <section key={ruleId}>
        <div className="flex items-center gap-2 px-4 py-3 hover:bg-accent/40">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', style.dot)} aria-label={style.label} />
          <button type="button" onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(ruleId)) next.delete(ruleId); else next.add(ruleId); return next })} className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs font-medium">
            {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{ruleId} — {first.title}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{ruleIssues.length}</span>
          </button>
          <InfoPopover label={`Ignorer la règle ${ruleId}`}>
            <button type="button" aria-label={`Ignorer la règle ${ruleId}`} onClick={() => ignoreRule(ruleId)} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><EyeOff className="h-3.5 w-3.5" /></button>
          </InfoPopover>
        </div>
        {open && <div className="space-y-3 border-t border-border/60 px-10 py-4 text-xs">
          <p className="text-muted-foreground">{first.explanation}</p>
          {affected.length > 0 && <div><p className="mb-1 font-medium text-foreground">Éléments affectés</p><ul className="space-y-0.5 text-muted-foreground">{affected.map((id) => <li key={id}><button type="button" onClick={() => select(id)} className="text-left hover:text-foreground hover:underline">{project.entities.find((entity) => entity.id === id)?.name ?? project.associations.find((association) => association.id === id)?.name ?? id}</button></li>)}</ul></div>}
        </div>}
      </section>
    })}
  </div>
}
