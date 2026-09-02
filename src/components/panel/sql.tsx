import { useMemo, useState } from 'react'
import { useProjectStore } from '@/store/project-store'
import { generateMld } from '@/mld'
import { generateSql } from '@/sql'
import { downloadText } from '@/persistence'
import { Check, Copy, Download } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function SqlPanel() {
  const project = useProjectStore((s) => s.project)
  const issues = useProjectStore((s) => s.issues)
  const errors = useMemo(() => issues.filter((issue) => issue.severity === 'error'), [issues])
  const sql = useMemo(() => generateSql(generateMld(project)), [project])
  const canExport = errors.length === 0
  const [copied, setCopied] = useState(false)

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="min-h-0 flex-1">
        {canExport ? (
          <div className="relative h-full">
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
              <Tooltip><TooltipTrigger asChild><button type="button" aria-label={copied ? 'Copié' : 'Copier le script SQL'} onClick={copySql} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground">
                  {copied ? <Check className="h-3.5 w-3.5 text-success" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                </button>
              </TooltipTrigger><TooltipContent>{copied ? 'Copié' : 'Copier le script SQL'}</TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><button type="button" aria-label="Exporter le script SQL" onClick={() => downloadText(sql, `${project.name || 'schema'}.sql`, 'text/sql')} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground">
                  <Download className="h-3.5 w-3.5" aria-hidden />
                </button>
              </TooltipTrigger><TooltipContent>Exporter le script SQL</TooltipContent></Tooltip>
            </div>
            <pre className="scrollbar-subtle h-full overflow-auto rounded-xl bg-black/30 p-4 pr-20 font-mono text-xs leading-6 text-foreground dark:bg-black/45">
              {sql || '-- Le diagramme ne contient aucune relation.'}
            </pre>
          </div>
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">Génération SQL bloquée</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Corrigez les {errors.length} erreur{errors.length > 1 ? 's' : ''} MERISE signalée{errors.length > 1 ? 's' : ''} avant l’export.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
