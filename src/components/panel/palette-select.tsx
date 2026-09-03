import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { PALETTES, type PaletteId, type PalettePreview } from '@/lib/palettes'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

function PaletteSwatches({ preview, size = 'sm' }: { preview: PalettePreview; size?: 'sm' | 'md' }) {
  const dot = size === 'md' ? 'size-4' : 'size-3'
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span className={cn(dot, 'rounded-full border border-border/60')} style={{ backgroundColor: `hsl(${preview.primary})` }} />
      <span className={cn(dot, 'rounded-full border border-border/60')} style={{ backgroundColor: `hsl(${preview.secondary})` }} />
      <span className={cn(dot, 'rounded-full border border-border/60')} style={{ backgroundColor: `hsl(${preview.accent})` }} />
    </span>
  )
}

export function PaletteSelect({ value, onChange }: { value: PaletteId; onChange: (id: PaletteId) => void }) {
  const [open, setOpen] = useState(false)
  const current = PALETTES.find((palette) => palette.id === value) ?? PALETTES[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-full pr-2 max-w-[250px]">
        <button
          type="button"
          id="palette-select"
          aria-label={`Palette ${current.label}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-8 w-full  items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex min-w-0 items-center gap-2">
            <PaletteSwatches preview={current.preview} size="md" />
            <span className="truncate">{current.label}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
        <ul role="listbox" aria-label="Palettes de couleurs" className="space-y-0.5">
          {PALETTES.map((palette) => {
            const selected = palette.id === value
            return (
              <li key={palette.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(palette.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent',
                    selected && 'bg-primary/10 text-primary',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <PaletteSwatches preview={palette.preview} size="md" />
                    <span className="truncate">{palette.label}</span>
                  </span>
                  {selected && <Check className="size-4 shrink-0" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
