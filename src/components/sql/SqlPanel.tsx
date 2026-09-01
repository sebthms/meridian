import { useMemo } from 'react'
import { useProjectStore } from '@/store/project-store'
import { generateMld } from '@/mld'
import { generateSql } from '@/sql'
import { downloadText } from '@/persistence'
import { Download } from 'lucide-react'

export function SqlPanel() {
  const project = useProjectStore((s) => s.project)
  const issues = useProjectStore((s) => s.issues)
  const errors = useMemo(() => issues.filter((issue) => issue.severity === 'error'), [issues])
  const sql = useMemo(() => generateSql(generateMld(project)), [project])
  const canExport = errors.length === 0

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3 pb-0.5">
        <p className="min-w-0 truncate text-[11px] text-muted-foreground">Synchronisé automatiquement avec le diagramme</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-foreground hover:bg-accent"
            onClick={() => canExport && downloadText(sql, `${project.name || 'schema'}.sql`, 'text/sql')}
            disabled={!canExport}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Exporter
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {canExport ? (
          <pre className="scrollbar-subtle h-full overflow-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs leading-6 text-foreground">
            {sql || '-- Le diagramme ne contient aucune relation.'}
          </pre>
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
