'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mmSsToSeconds } from '@/lib/utils/pace'

const TAGE = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']
const TAGE_LABEL: Record<string, string> = {
  MO: 'Mo', DI: 'Di', MI: 'Mi', DO: 'Do', FR: 'Fr', SA: 'Sa', SO: 'So',
}

export function ProfilForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTage, setSelectedTage] = useState<string[]>(['MO', 'MI', 'SA', 'SO'])
  const [format, setFormat] = useState<'SOLO' | 'DOUBLES'>('DOUBLES')

  function toggleTag(tag: string) {
    setSelectedTage(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const fuenfKmRaw = fd.get('fuenfKmZeit') as string
    const fuenfKmZeit = fuenfKmRaw ? mmSsToSeconds(fuenfKmRaw) : null

    try {
      const res = await fetch('/api/onboarding/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alter: Number(fd.get('alter')),
          gewicht: Number(fd.get('gewicht')),
          wettkampfdatum: new Date(fd.get('wettkampfdatum') as string).toISOString(),
          format,
          trainingstage: selectedTage,
          andereAktivitaeten: (fd.get('andereAktivitaeten') as string) || undefined,
          fuenfKmZeit,
        }),
      })
      if (!res.ok) {
        setError('Fehler beim Speichern')
        return
      }
      router.push('/onboarding/erfahrung')
    } catch {
      setError('Netzwerkfehler — bitte erneut versuchen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="alter">Alter</Label>
          <Input id="alter" name="alter" type="number" min={16} max={90} required />
        </div>
        <div>
          <Label htmlFor="gewicht">Gewicht (kg)</Label>
          <Input id="gewicht" name="gewicht" type="number" step="0.1" min={30} max={250} required />
        </div>
      </div>

      <div>
        <Label htmlFor="wettkampfdatum">Wettkampfdatum</Label>
        <Input id="wettkampfdatum" name="wettkampfdatum" type="date" required />
      </div>

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
        <Label>Trainingstage</Label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {TAGE.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`px-3 py-1 rounded text-sm border transition-colors ${
                selectedTage.includes(t)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              {TAGE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="fuenfKmZeit">5km Testzeit — optional (Format MM:SS)</Label>
        <Input
          id="fuenfKmZeit"
          name="fuenfKmZeit"
          placeholder="z.B. 25:39"
          pattern="\d{1,2}:\d{2}"
        />
      </div>

      <div>
        <Label htmlFor="andereAktivitaeten">Andere Sportarten — optional</Label>
        <Input
          id="andereAktivitaeten"
          name="andereAktivitaeten"
          placeholder="z.B. Frisbee 2x/Woche"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || selectedTage.length === 0}
      >
        {loading ? 'Speichern…' : 'Weiter →'}
      </Button>
    </form>
  )
}
