import { useProjectStore } from '@/store/project-store'
import {
  CARDINALITIES,
  cardinalityToString,
  areCardinalitiesEqual,
  type Cardinality,
} from '@/domain'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const ONE_ONE: Cardinality = { min: 1, max: 1 }

/**
 * Popover de choix de cardinalité. Rendu dans un `EdgeLabelRenderer` (couche
 * transformée par le viewport React Flow) afin de suivre le déplacement et le
 * zoom du canevas, ainsi que le déplacement des nœuds reliés à l'arête.
 *
 * Si l'autre participant a déjà `1,1`, l'option `1,1` est grisée (interdite
 * par MERISE).
 */
export function CardinalityPopover({
  associationId,
  participantIndex,
  otherCardinality,
  anchor,
  onPick,
  onClose,
}: {
  associationId: string
  participantIndex: number
  otherCardinality: Cardinality | null
  anchor: { x: number; y: number }
  onPick: (cardinality: Cardinality) => void
  onClose: () => void
}) {
  const association = useProjectStore((s) =>
    s.project.associations.find((a) => a.id === associationId),
  )
  const current = association?.participants[participantIndex]?.cardinality
  const isOtherOneOne = otherCardinality !== null && areCardinalitiesEqual(otherCardinality, ONE_ONE)

  return (
    <div
      className="absolute left-0 -top-5 z-50"
      style={{
        transform: `translate(-50%, calc(-100% - 8px)) translate(${anchor.x}px, ${anchor.y}px)`,
        pointerEvents: 'all',
      }}
    >
      <div className="rounded-lg border border-border bg-card p-2.5 shadow-xl">
        <div className="flex justify-between items-center pb-2">
          <div>
            <p className=" text-[10px] uppercase tracking-wide text-muted-foreground">
              Cardinalité
            </p>
          </div>
          <button
            type="button"
            className=""
            title='Fermer'
            onClick={onClose}
          >
            <X className="text-muted-foreground h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1">
          {CARDINALITIES.map((c) => {
            const disabled = isOtherOneOne && areCardinalitiesEqual(c, ONE_ONE)
            return (
              <button
                key={cardinalityToString(c)}
                type="button"
                disabled={disabled}
                onClick={() => onPick(c)}
                className={cn(
                  'rounded-md px-3 border border-gray-200 dark:border-gray-800 py-1.5 text-xs font-semibold transition-colors',
                  current && areCardinalitiesEqual(c, current)
                    ? 'bg-primary text-primary-foreground'
                    : disabled
                      ? 'cursor-not-allowed text-muted-foreground/40'
                      : 'text-foreground hover:bg-accent',
                )}
                title={disabled ? '1,1 de chaque côté est interdit' : undefined}
              >
                {cardinalityToString(c)}
              </button>
            )
          })}
        </div>

      </div>

    </div>
  )
}
