'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Provider = 'ANTHROPIC' | 'GEMINI' | 'OPENAI'

const PROVIDERS: { id: Provider; label: string; desc: string; keyUrl: string; placeholder: string }[] = [
  {
    id: 'ANTHROPIC',
    label: 'Anthropic Claude',
    desc: 'Beste Planqualität · API Key erforderlich',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...',
  },
  {
    id: 'GEMINI',
    label: 'Google Gemini',
    desc: 'Kostenloser Tier verfügbar · API Key erforderlich',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIza...',
  },
  {
    id: 'OPENAI',
    label: 'OpenAI GPT-4o',
    desc: 'Sehr gut · API Key erforderlich',
    keyUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-...',
  },
]

interface Props {
  apiPath?: string
  nextPath?: string
  initialProvider?: Provider
}

export function ProviderForm({ apiPath = '/api/onboarding/provider', nextPath = '/onboarding/profil', initialProvider }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Provider>(initialProvider ?? 'ANTHROPIC')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const current = PROVIDERS.find(p => p.id === selected)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selected, apiKey }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error?.fieldErrors?.apiKey?.[0] ?? 'Fehler beim Speichern')
        return
      }
      router.push(nextPath)
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        {PROVIDERS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className={`w-full text-left rounded-lg border p-4 transition-colors ${
              selected === p.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="font-medium">{p.label}</div>
            <div className="text-sm text-muted-foreground">{p.desc}</div>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder={current.placeholder}
          required
          minLength={10}
        />
        <p className="text-xs text-muted-foreground">
          API Key holen:{' '}
          <a
            href={current.keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            {current.keyUrl.replace('https://', '')}
          </a>
          <br />
          Der Key wird verschlüsselt gespeichert und nie weitergegeben.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Speichern...' : 'Weiter'}
      </Button>
    </form>
  )
}
