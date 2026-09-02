import { useState } from 'react'
import { Moon, Sun, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useProjectStore } from '@/store/project-store'
import { ConfirmPopover } from '@/components/ui/ConfirmPopover'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

export function SettingsModal({ open, onClose, colorMode, onToggleTheme, panel = false, embedded = false }: { open: boolean; onClose: () => void; colorMode: 'light' | 'dark'; onToggleTheme: () => void; panel?: boolean; embedded?: boolean }) {
  const projects = useProjectStore((state) => state.projects)
  const clearAllProjects = useProjectStore((state) => state.clearAllProjects)
  const [confirming, setConfirming] = useState(false)

  const content = (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Thème</p><TooltipProvider><Tooltip><TooltipTrigger><button type="button" aria-label={colorMode === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} onClick={onToggleTheme} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">{colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></TooltipTrigger><TooltipContent>{colorMode === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}</TooltipContent></Tooltip></TooltipProvider></div>
        <div className="relative">
          <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Vider les données ?</p><TooltipProvider><Tooltip><TooltipTrigger><button type="button" aria-label="Vider les données locales" onClick={() => setConfirming((value) => !value)} disabled={projects.length === 0} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></TooltipTrigger><TooltipContent>Vider les données locales</TooltipContent></Tooltip></TooltipProvider></div>
          {confirming && <div className="absolute right-0 top-9 z-30 w-64"><ConfirmPopover message="Vider tous les diagrammes ?" onCancel={() => setConfirming(false)} onConfirm={() => { clearAllProjects(); setConfirming(false); onClose() }} /></div>}
        </div>
      </section>
  )
  if (!open) return null
  return panel ? <aside className={`w-80 ${embedded ? 'p-4' : 'rounded-xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur'}`} aria-label="Paramètres">{content}</aside> : <Modal open onClose={onClose} title="Paramètres" className="max-w-md">{content}</Modal>
}
