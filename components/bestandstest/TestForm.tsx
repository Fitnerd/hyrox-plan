'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TestFormProps {
  onSuccess: () => void
}

export function TestForm({ onSuccess }: TestFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [datum, setDatum] = useState(today)
  const [kategorie, setKategorie] = useState('AUSDAUER')
  const [name, setName] = useState('')
  const [wert, setWert] = useState('')
  const [einheit, setEinheit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/bestandstest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datum: new Date(datum).toISOString(),
          kategorie,
          name,
          wert: parseFloat(wert),
          einheit,
        }),
      })
      if (res.status === 201) {
        setName('')
        setWert('')
        setEinheit('')
        setDatum(today)
        setKategorie('AUSDAUER')
        onSuccess()
      } else {
        const data = await res.json()
        setError(data?.error ? JSON.stringify(data.error) : 'Fehler beim Speichern.')
      }
    } catch {
      setError('Netzwerkfehler.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="datum">Datum</Label>
          <Input
            id="datum"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="kategorie">Kategorie</Label>
          <select
            id="kategorie"
            value={kategorie}
            onChange={(e) => setKategorie(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="AUSDAUER">Ausdauer</option>
            <option value="KRAFT">Kraft</option>
            <option value="MOBILITAET">Mobilität</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="name">Übung / Test</Label>
        <Input
          id="name"
          type="text"
          list="name-suggestions"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. 5km Lauf"
          required
          maxLength={100}
        />
        <datalist id="name-suggestions">
          {['5km Lauf', '1km Lauf', 'Liegestütze', 'Klimmzüge', 'Plank', 'Schulter-Mobilität', 'Hüft-Mobilität'].map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="wert">Wert</Label>
          <Input
            id="wert"
            type="number"
            step="any"
            value={wert}
            onChange={(e) => setWert(e.target.value)}
            placeholder="z. B. 25"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="einheit">Einheit</Label>
          <Input
            id="einheit"
            type="text"
            list="einheit-suggestions"
            value={einheit}
            onChange={(e) => setEinheit(e.target.value)}
            placeholder="z. B. min:sec"
            required
            maxLength={20}
          />
          <datalist id="einheit-suggestions">
            {['min:sec', 'Wdh.', 'Sek.', 'cm', 'kg', 'm'].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Speichern…' : 'Eintrag speichern'}
      </Button>
    </form>
  )
}
