import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { RegenButton } from '@/components/profil/RegenButton'
import { ProviderEditDialog } from '@/components/profil/ProviderEditDialog'
import Link from 'next/link'

const PROVIDER_LABELS: Record<string, string> = {
  ANTHROPIC: 'Anthropic Claude',
  GEMINI: 'Google Gemini',
  OPENAI: 'OpenAI GPT-4o',
}

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id
  const [profile, user] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, aiProvider: true, aiApiKeyEncrypted: true } }),
  ])

  if (!profile) redirect('/onboarding/profil')

  const wettkampf = new Date(profile.wettkampfdatum)
  const formatLabel = profile.format === 'SOLO' ? 'Solo' : 'Doubles'
  const paceDisplay = profile.fuenfKmZeit != null
    ? `${Math.floor(profile.fuenfKmZeit / 60)}:${String(profile.fuenfKmZeit % 60).padStart(2, '0')} min/km`
    : 'Nicht angegeben'

  return (
    <main className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      {/* User info */}
      <div className="rounded-xl border bg-card p-6 space-y-1">
        <p className="font-semibold text-lg">{user?.name ?? '—'}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {/* Profile data */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="flex justify-between items-start">
          <h2 className="font-semibold">Trainingsprofil</h2>
          <Link href="/onboarding/profil" className="text-sm text-primary hover:underline">
            Bearbeiten
          </Link>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Alter</dt>
            <dd>{profile.alter} Jahre</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Gewicht</dt>
            <dd>{profile.gewicht} kg</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Wettkampf</dt>
            <dd>{wettkampf.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Format</dt>
            <dd>{formatLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Trainingstage</dt>
            <dd>{profile.trainingstage.join(', ')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">5km-Zeit</dt>
            <dd>{paceDisplay}</dd>
          </div>
          {profile.andereAktivitaeten && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Andere Aktivitäten</dt>
              <dd>{profile.andereAktivitaeten}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* AI Provider */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="flex justify-between items-start">
          <h2 className="font-semibold">KI-Anbieter</h2>
          <ProviderEditDialog currentProvider={user?.aiProvider ?? null} />
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Anbieter</dt>
            <dd>{user?.aiProvider ? PROVIDER_LABELS[user.aiProvider] : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">API Key</dt>
            <dd>{user?.aiApiKeyEncrypted ? '••••••••' : '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Re-generate plan */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Plan neu generieren</h2>
        <p className="text-sm text-muted-foreground">
          Erstellt einen neuen Plan basierend auf deinem aktuellen Profil. Der alte Plan bleibt als Archiv erhalten.
        </p>
        <RegenButton />
      </div>
    </main>
  )
}
