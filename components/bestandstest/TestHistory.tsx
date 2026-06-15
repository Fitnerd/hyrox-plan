'use client'

interface BestandsTestEntry {
  id: string
  datum: string
  kategorie: string
  name: string
  wert: number
  einheit: string
}

interface TestHistoryProps {
  tests: BestandsTestEntry[]
  onDelete: (id: string) => void
}

function getTrend(entries: BestandsTestEntry[]): string {
  if (entries.length < 2) return '→'
  const latest = entries[0].wert
  const previous = entries[1].wert
  if (latest > previous) return '↑'
  if (latest < previous) return '↓'
  return '→'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function kategorieLabel(k: string): string {
  if (k === 'AUSDAUER') return 'Ausdauer'
  if (k === 'KRAFT') return 'Kraft'
  if (k === 'MOBILITAET') return 'Mobilität'
  return k
}

export function TestHistory({ tests, onDelete }: TestHistoryProps) {
  // Group by name
  const groups = new Map<string, BestandsTestEntry[]>()
  for (const t of tests) {
    if (!groups.has(t.name)) groups.set(t.name, [])
    groups.get(t.name)!.push(t)
  }

  // Sort each group by datum desc
  for (const [, entries] of groups) {
    entries.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
  }

  // Sort group names alphabetically
  const sortedNames = Array.from(groups.keys()).sort()

  return (
    <div className="space-y-6">
      {sortedNames.map((name) => {
        const entries = groups.get(name)!
        const shown = entries.slice(0, 2)
        const trend = getTrend(entries)
        const trendColor =
          trend === '↑' ? 'text-green-600' : trend === '↓' ? 'text-red-500' : 'text-muted-foreground'

        return (
          <div key={name} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{name}</h3>
                <span className="text-xs text-muted-foreground">{kategorieLabel(entries[0].kategorie)}</span>
              </div>
              <span className={`text-2xl font-bold ${trendColor}`} title="Trend">{trend}</span>
            </div>

            <div className="space-y-2">
              {shown.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{formatDate(entry.datum)}</span>
                  <span className="font-medium">
                    {entry.wert} {entry.einheit}
                  </span>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="ml-3 text-muted-foreground hover:text-destructive transition-colors"
                    title="Eintrag löschen"
                    aria-label="Eintrag löschen"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {entries.length > 2 && (
              <p className="text-xs text-muted-foreground">+{entries.length - 2} weitere Einträge</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
