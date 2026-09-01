import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { InfoPopover } from './InfoPopover'

export function SidePanel({ title, onClose, children, side = 'right', actions }: { title: string; onClose: () => void; children: ReactNode; side?: 'left' | 'right'; actions?: ReactNode }) {
  return (
    <aside aria-label={title} className={`animate-side-panel-in fixed bottom-4 top-4 z-40 flex w-[min(32rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur ${side === 'left' ? 'left-4' : 'right-4'}`}>
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{title}</h2>{actions}</div>
        <InfoPopover label="Fermer">
          <button type="button" aria-label={`Fermer ${title}`} onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </InfoPopover>
      </header>
      <div className="scrollbar-subtle min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
    </aside>
  )
}
