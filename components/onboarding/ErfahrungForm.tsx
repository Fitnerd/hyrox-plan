'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SplitsForm } from './SplitsForm'

type Path = 'FIRST' | 'TOTAL_ONLY' | 'SPLITS'

interface Split {
  station: string
  zeit: number
  platzierung?: number | null
}

export function ErfahrungForm() {
  const router = useRouter()
  const [path, setPath] = useState<Path | null>(null)
  const [format, setFormat] = useState<'SOLO' | 'DOUBLES'>('DOUBLES')
  const [splits, setSplits] = useState<Split[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!path) return
    setLoading(true)
    setError('')

    try {
      const fd = new FormData(e.currentTarget)

      let body: Record<string, unknown> = { path }

      if (path !== 'FIRST') {
        const gesamtRaw = fd.get('gesamtzeit') as string
        // Parse H:MM:SS or MM:SS
        const parts = gesamtRaw.split(':').map(Number)
        const gesamtsekunden = parts.length === 3
          ? parts[0] * 3600 + parts[1] * 60 + parts[2]
          : parts[0] * 60 + (parts[1] ?? 0)
        body = { path, gesamtzeit: gesamtsekunden, format }
      }

      if (path === 'SPLITS') {
        body = { ...body, splits }
      }

      const res = await fetch('/api/onboarding/erfahrung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        setError('Fehler beim Speichern')
        return
      }
      router.push('/onboarding/generieren')
    } catch {
      setError('Netzwerkfehler — bitte erneut versuchen')
    } finally {
      setLoading(false)
    }
  }

  const PATH_OPTIONS = [
    {
      key: 'FIRST' as Path,
      label: '🟢 Nein — mein erster Hyrox',
      desc: 'Plan basiert auf deinem Profil und 5km-Test.',
    },
    {
      key: 'TOTAL_ONLY' as Path,
      label: '🟡 Ja — ich kenne nur meine Gesamtzeit',
      desc: 'KI schätzt Schwachstellen anhand typischer Muster.',
    },
    {
      key: 'SPLITS' as Path,
      label: '🔵 Ja — ich kenne meine Split-Zeiten',
      desc: 'Präziseste Analyse — trage deine Station-Zeiten ein.',
    },
  ] as const

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {PATH_OPTIONS.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setPath(opt.key)}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${
              path === opt.key
                ? 'border-primary bg-primary/5'
                : 'border-input hover:border-primary/50'
            }`}
          >
            <div className="font-medium">{opt.label}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      {path && path !== 'FIRST' && (
        <div className="space-y-3 pt-2">
          <div>
            <Label>Format</Label>
            <div className="flex gap-3 mt-1">
              {(['SOLO', 'DOUBLES'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded border text-sm transition-colors ${
                    format === f
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="gesamtzeit">Gesamtzeit (H:MM:SS)</Label>
            <Input
              id="gesamtzeit"
              name="gesamtzeit"
              placeholder="1:37:00"
              required
            />
          </div>
        </div>
      )}

      {path === 'SPLITS' && (
        <div className="pt-2">
          <Label className="mb-2 block">Station-Zeiten</Label>
          <SplitsForm value={splits} onChange={setSplits} />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {path && (
        <div className="flex gap-3 pt-2">
          {path === 'SPLITS' && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/onboarding/generieren')}
            >
              Überspringen
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Speichern…' : 'Plan generieren →'}
          </Button>
        </div>
      )}
    </form>
  )
}
