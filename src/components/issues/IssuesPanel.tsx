import { CheckCircle2 } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const SEVERITY_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  error: { dot: 'bg-red-500', badge: 'text-red-600', label: 'Erreur' },
  warning: { dot: 'bg-amber-500', badge: 'text-amber-600', label: 'Avertissement' },
  info: { dot: 'bg-sky-500', badge: 'text-sky-600', label: 'Info' },
}

export function IssuesPanel() {
  const issues = useProjectStore((s) => s.issues)
  const select = useProjectStore((s) => s.select)
  const ignoreIssue = useProjectStore((s) => s.ignoreIssue)
  const ignoreRule = useProjectStore((s) => s.ignoreRule)

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        Modèle valide
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {issues.map((issue) => {
        const style = SEVERITY_STYLE[issue.severity] ?? SEVERITY_STYLE.info
        return (
          <div key={issue.id} className="flex items-start gap-2 p-2">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', style.dot)} />
            <div className="min-w-0 flex-1">
              <button
                type="button"
                className="text-left text-sm font-medium hover:underline"
                onClick={() => issue.targetIds[0] && select(issue.targetIds[0])}
              >
                {issue.ruleId} — {issue.title}
              </button>
              <p className="text-xs text-muted-foreground">{issue.explanation}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => ignoreIssue(issue.id)}
              >
                Ignorer cette occurrence
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => ignoreRule(issue.ruleId)}
              >
                Ignorer la règle {issue.ruleId}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}