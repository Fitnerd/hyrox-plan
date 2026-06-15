'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProviderForm } from '@/components/onboarding/ProviderForm'

type Provider = 'ANTHROPIC' | 'GEMINI' | 'OPENAI'

interface Props {
  currentProvider: string | null
}

export function ProviderEditDialog({ currentProvider }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-primary hover:underline"
      >
        Ändern
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">KI-Anbieter ändern</h2>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>
        <ProviderForm
          apiPath="/api/settings/provider"
          nextPath="/profil"
          initialProvider={(currentProvider as Provider) ?? undefined}
        />
      </div>
    </div>
  )
}
