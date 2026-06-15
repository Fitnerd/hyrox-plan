'use client'
import { Input } from '@/components/ui/input'
import { mmSsToSeconds, secondsToMmSs } from '@/lib/utils/pace'

const STATIONS = [
  { key: 'SKIERG', label: 'SkiErg 1000m' },
  { key: 'SLED_PUSH', label: 'Sled Push 50m' },
  { key: 'SLED_PULL', label: 'Sled Pull 50m' },
  { key: 'BURPEE', label: 'Burpee Broad Jump 80m' },
  { key: 'ROWING', label: 'Rowing 1000m' },
  { key: 'FARMERS', label: 'Farmers Carry 200m' },
  { key: 'SANDBAG', label: 'Sandbag Lunges 100m' },
  { key: 'WALLBALLS', label: 'Wall Balls' },
]

interface Split {
  station: string
  zeit: number
  platzierung?: number | null
}

interface Props {
  value: Split[]
  onChange: (splits: Split[]) => void
}

export function SplitsForm({ value, onChange }: Props) {
  function handleChange(station: string, field: 'zeit' | 'platzierung', raw: string) {
    const existing = value.find(s => s.station === station) ?? { station, zeit: 0 }
    let updated: Split
    if (field === 'zeit') {
      const secs = mmSsToSeconds(raw)
      updated = { ...existing, zeit: secs ?? 0 }
    } else {
      updated = { ...existing, platzierung: raw ? Number(raw) : null }
    }
    const next = [...value.filter(s => s.station !== station), updated].filter(s => s.zeit > 0)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_90px_80px] gap-2 text-xs text-muted-foreground px-1">
        <span>Station</span>
        <span>Zeit (MM:SS)</span>
        <span>Platz (opt.)</span>
      </div>
      {STATIONS.map(({ key, label }) => {
        const split = value.find(s => s.station === key)
        return (
          <div key={key} className="grid grid-cols-[1fr_90px_80px] gap-2 items-center">
            <span className="text-sm">{label}</span>
            <Input
              placeholder="3:48"
              defaultValue={split ? secondsToMmSs(split.zeit) : ''}
              pattern="\d{1,2}:\d{2}"
              onChange={e => handleChange(key, 'zeit', e.target.value)}
            />
            <Input
              placeholder="220"
              type="number"
              defaultValue={split?.platzierung ?? ''}
              onChange={e => handleChange(key, 'platzierung', e.target.value)}
            />
          </div>
        )
      })}
    </div>
  )
}
