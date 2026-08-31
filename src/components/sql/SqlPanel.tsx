import { useMemo } from 'react'
import { useProjectStore } from '@/store/project-store'
import { generateMld } from '@/mld'
import { generateSql } from '@/sql'
import { downloadText } from '@/persistence'
import { Download, X } from 'lucide-react'

export function SqlPanel({ onClose }: { onClose: () => void }) {
  const project = useProjectStore((s) => s.project)
  const issues = useProjectStore((s) => s.issues)
  const errors = useMemo(() => issues.filter((issue) => issue.severity === 'error'), [issues])
  const sql = useMemo(() => generateSql(generateMld(project)), [project])
  const canExport = errors.length === 0

  return (
    <aside
      aria-label="Aperçu SQL"
      className="animate-panel-in fixed bottom-4 right-4 top-4 z-40 flex w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">SQL PostgreSQL</h2>
          <p className="text-[11px] text-muted-foreground">Mis à jour automatiquement depuis le diagramme</p>
        </div>
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
          <button
            type="button"
            title="Fermer"
            aria-label="Fermer l’aperçu SQL"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 p-3">
        {canExport ? (
          <pre className="h-full overflow-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
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
    </aside>
  )
}
