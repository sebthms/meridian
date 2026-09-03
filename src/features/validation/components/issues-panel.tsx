import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProjectStore } from '@/store/project-store'
import { translateIssueExplanation, translateIssueTitle } from '@/i18n/translate-issue'
import { cn } from '@/shared/utils/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

export function IssuesPanel() {
  const { t } = useTranslation()
  const issues = useProjectStore((s) => s.issues)
  const project = useProjectStore((s) => s.project)
  const select = useProjectStore((s) => s.select)
  const ignoreRule = useProjectStore((s) => s.ignoreRule)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const severityStyle = useMemo(() => ({
    error: { dot: 'bg-destructive', label: t('validation.error', { count: 1 }) },
    warning: { dot: 'bg-yellow-500', label: t('validation.warning', { count: 1 }) },
    info: { dot: 'bg-blue-500', label: t('validation.info', { count: 1 }) },
  }), [t])

  const groups = useMemo(() => [...issues.reduce((map, issue) => {
    const current = map.get(issue.ruleId) ?? []
    current.push(issue)
    map.set(issue.ruleId, current)
    return map
  }, new Map<string, typeof issues>())].map(([ruleId, ruleIssues]) => ({ ruleId, issues: ruleIssues, first: ruleIssues[0]! })), [issues])

  if (groups.length === 0) {
    return <div className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" aria-hidden />{t('validation.validModel')}</div>
  }

  return <div className="divide-y divide-border">
    {groups.map(({ ruleId, issues: ruleIssues, first }) => {
      const open = expanded.has(ruleId)
      const style = severityStyle[first.severity as keyof typeof severityStyle] ?? severityStyle.info
      const affected = [...new Set(ruleIssues.flatMap((issue) => issue.targetIds))]
      const title = translateIssueTitle(first, t)
      const explanation = translateIssueExplanation(first, t)
      return <section key={ruleId}>
        <div className="flex items-center gap-2 py-1 hover:bg-accent/40">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', style.dot)} aria-label={style.label} />
          <button type="button" onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(ruleId)) next.delete(ruleId); else next.add(ruleId); return next })} className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs font-medium">
            {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{ruleId} — {title}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{ruleIssues.length}</span>
          </button>
          <Tooltip><TooltipTrigger asChild><button type="button" aria-label={t('validation.ignoreRule', { ruleId })} onClick={() => ignoreRule(ruleId)} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><EyeOff className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>{t('validation.ignoreRule', { ruleId })}</TooltipContent></Tooltip>
        </div>
        {open && <div className="space-y-3 border-t border-border/60 px-10 py-4 text-xs">
          <p className="italic text-muted-foreground">{explanation}</p>
          {ruleIssues.length > 1 && <ul className="space-y-1 text-muted-foreground">{ruleIssues.map((issue) => <li key={issue.id}>{translateIssueExplanation(issue, t)}</li>)}</ul>}
          {affected.length > 0 && <div><p className="mb-1 font-medium text-foreground">{t('validation.affectedElements')}</p><ul className="space-y-0.5 text-muted-foreground">{affected.map((id) => <li key={id}><button type="button" onClick={() => select(id)} className="text-left hover:text-foreground hover:underline">{project.entities.find((entity) => entity.id === id)?.name ?? project.associations.find((association) => association.id === id)?.name ?? id}</button></li>)}</ul></div>}
        </div>}
      </section>
    })}
  </div>
}
