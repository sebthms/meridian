import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PALETTES, type PaletteId, type PalettePreview } from '@/shared/theme/palettes'
import { settingsFieldClass } from '@/features/settings/components/settings-row'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/utils/cn'

function PaletteSwatches({ preview, size = 'sm' }: { preview: PalettePreview; size?: 'sm' | 'md' }) {
  const dot = size === 'md' ? 'size-3.5' : 'size-3'
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span className={cn(dot, 'rounded-full border border-border/60')} style={{ backgroundColor: `hsl(${preview.primary})` }} />
      <span className={cn(dot, 'rounded-full border border-border/60')} style={{ backgroundColor: `hsl(${preview.secondary})` }} />
      <span className={cn(dot, 'rounded-full border border-border/60')} style={{ backgroundColor: `hsl(${preview.accent})` }} />
    </span>
  )
}

export function PaletteSelect({ value, onChange }: { value: PaletteId; onChange: (id: PaletteId) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = PALETTES.find((palette) => palette.id === value) ?? PALETTES[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id="palette-select"
          aria-label={`${t('settings.palette')} ${current.label}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(settingsFieldClass, 'justify-between gap-2 px-3 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
        >
          <span className="flex min-w-0 items-center gap-2">
            <PaletteSwatches preview={current.preview} size="md" />
            <span className="truncate">{current.label}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
        <ul role="listbox" aria-label={t('settings.palette')} className="space-y-0.5">
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
