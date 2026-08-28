import { useMemo } from 'react'
import { useProjectStore } from '@/store/project-store'
import { generateMld, formatMld } from '@/mld'
import { downloadText } from '@/persistence'

export function MldPanel() {
  const project = useProjectStore((s) => s.project)
  const text = useMemo(() => formatMld(generateMld(project)), [project])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button
          className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
          onClick={() => downloadText(text, 'modele.mld.txt')}
        >
          Télécharger .txt
        </button>
      </div>
      <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
        {text}
      </pre>
    </div>
  )
}