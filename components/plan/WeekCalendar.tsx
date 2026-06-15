import Link from 'next/link'
import type { PlanWoche, PlanPhase } from '@/lib/types/plan'

interface Props {
  wochen: PlanWoche[]
  phasen: PlanPhase[]
}

const PHASE_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-orange-100 text-orange-800',
  'bg-purple-100 text-purple-800',
]

export function WeekCalendar({ wochen, phasen }: Props) {
  return (
    <div className="space-y-6">
      {/* Phase timeline */}
      <div className="flex flex-wrap gap-2">
        {phasen.map((phase, i) => (
          <span
            key={phase.nummer}
            className={`text-xs px-3 py-1 rounded-full font-medium ${PHASE_COLORS[i % PHASE_COLORS.length]}`}
          >
            Phase {phase.nummer}: {phase.titel} (Woche {phase.wochenVon}–{phase.wochenBis})
          </span>
        ))}
      </div>

      {/* Week list */}
      <div className="space-y-2">
        {wochen.map((woche) => {
          const phaseIndex = phasen.findIndex(p => p.nummer === woche.phase)
          const phaseColor = PHASE_COLORS[phaseIndex % PHASE_COLORS.length] ?? 'bg-gray-100 text-gray-800'
          const einheitenSummary = Object.entries(woche.einheiten)
            .map(([tag, e]) => `${tag}: ${e.typ}`)
            .join(' · ')

          return (
            <Link
              key={woche.nummer}
              href={`/plan/woche/${woche.nummer}`}
              className="flex items-center gap-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <span className="font-bold text-lg w-12 shrink-0">W{woche.nummer}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${phaseColor}`}>
                P{woche.phase}
              </span>
              <span className="text-sm text-muted-foreground truncate flex-1">{einheitenSummary}</span>
              <span className="text-muted-foreground shrink-0">→</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
