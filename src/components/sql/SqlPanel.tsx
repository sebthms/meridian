import { useMemo } from 'react'
import { useProjectStore } from '@/store/project-store'
import { generateMld } from '@/mld'
import { generateSql } from '@/sql'
import { downloadText } from '@/persistence'

export function SqlPanel() {
  const project = useProjectStore((s) => s.project)
  const sql = useMemo(() => generateSql(generateMld(project)), [project])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-4">
        <button
          className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
          onClick={copy}
        >
          Copier
        </button>
        <button
          className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
          onClick={() => downloadText(sql, 'schema.sql', 'text/sql')}
        >
          Télécharger .sql
        </button>
      </div>
      <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
        {sql}
      </pre>
    </div>
  )
}