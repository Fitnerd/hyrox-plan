import type { PlanPace } from '@/lib/types/plan'

interface Props {
  analysis: string
  paces: PlanPace
  stationsPrios: string[]
}

export function CoachAnalysis({ analysis, paces, stationsPrios }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg">
        <p className="text-xs font-bold uppercase text-green-700 mb-1">Stärken</p>
        <p className="text-sm text-green-900">{analysis.slice(0, 200)}…</p>
      </div>
      <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg">
        <p className="text-xs font-bold uppercase text-red-700 mb-1">Priorität 1</p>
        <p className="text-sm text-red-900">{stationsPrios[0] ?? '—'}</p>
      </div>
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
        <p className="text-xs font-bold uppercase text-blue-700 mb-1">Laufpace-Ziel</p>
        <p className="text-sm text-blue-900">{paces.ziel5km} / km</p>
      </div>
      <div className="mt-6">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{analysis}</p>
      </div>
    </div>
  )
}
