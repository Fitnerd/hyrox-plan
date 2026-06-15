'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Status = 'generating' | 'done' | 'error'

export default function OnboardingGenerierenPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('generating')
  const [streamText, setStreamText] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    async function generate() {
      try {
        const res = await fetch('/api/plan/generate', { method: 'POST', signal: controller.signal })
        if (!res.ok || !res.body) {
          setStatus('error')
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break

          const lines = decoder.decode(value, { stream: true }).split('\n')
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6)
            if (payload === '[DONE]') {
              if (!cancelled) setStatus('done')
              return
            }
            try {
              const { text, error } = JSON.parse(payload)
              if (error) {
                if (!cancelled) setStatus('error')
                return
              }
              if (text?.includes('__PLAN_SAVED__')) {
                if (!cancelled) setStatus('done')
                return
              }
              if (text?.includes('__PLAN_ERROR__')) {
                if (!cancelled) setStatus('error')
                return
              }
              if (text && !cancelled) {
                setStreamText(prev => prev + text)
              }
            } catch {
              // ignore parse errors on individual lines
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        if (!cancelled) setStatus('error')
      }
    }

    generate()
    return () => { cancelled = true; controller.abort() }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {status === 'generating' && (
          <>
            <div className="text-4xl mb-4 animate-pulse">⚡</div>
            <h1 className="text-2xl font-bold mb-2">Dein Plan wird erstellt…</h1>
            <p className="text-muted-foreground mb-6">
              Claude analysiert dein Profil und erstellt deinen persönlichen Hyrox-Plan.
            </p>
            {streamText && (
              <div className="text-left bg-muted p-4 rounded-lg text-sm font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                {streamText}
              </div>
            )}
          </>
        )}

        {status === 'done' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2">Plan erstellt!</h1>
            <p className="text-muted-foreground mb-6">
              Dein persönlicher Hyrox-Trainingsplan ist bereit.
            </p>
            <Button onClick={() => router.push('/plan')} size="lg">
              Zum Plan →
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2">Fehler</h1>
            <p className="text-muted-foreground mb-6">
              Plan konnte nicht erstellt werden. Bitte versuche es erneut.
            </p>
            <Button onClick={() => window.location.reload()}>
              Erneut versuchen
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
