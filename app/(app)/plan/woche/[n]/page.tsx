import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import type { PlanContent, PlanWoche, PlanPhase } from '@/lib/types/plan'

export default async function WocheDetailPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const wocheNr = parseInt(n)
  if (isNaN(wocheNr)) notFound()

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const plan = await prisma.trainingPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { generatedAt: 'desc' },
  })
  if (!plan) redirect('/onboarding/profil')

  const content = plan.content as unknown as PlanContent
  const woche: PlanWoche | undefined = content.wochen.find(w => w.nummer === wocheNr)
  if (!woche) notFound()

  const phase: PlanPhase | undefined = content.phasen.find(p => p.nummer === woche.phase)

  return (
    <main className="max-w-2xl mx-auto p-4 pb-24">
      <Link href="/plan" className="text-sm text-muted-foreground hover:underline mb-4 block">
        ← Zurück zum Plan
      </Link>
      <h1 className="text-2xl font-bold mb-1">Woche {wocheNr}</h1>
      {phase && (
        <p className="text-sm text-muted-foreground mb-6">
          Phase {phase.nummer}: {phase.titel} — {phase.fokus}
        </p>
      )}
      <div className="space-y-4">
        {Object.entries(woche.einheiten).map(([tag, einheit]) => (
          <div key={tag} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg">{tag}</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{einheit.typ}</span>
            </div>
            {einheit.beschreibung && (
              <p className="text-sm text-muted-foreground">{einheit.beschreibung}</p>
            )}
            {einheit.distanz && einheit.pace && (
              <p className="text-sm mt-1">
                {einheit.distanz} km @ {einheit.pace}
              </p>
            )}
            {Array.isArray(einheit.ablauf) && einheit.ablauf.length > 0 && (
              <ul className="mt-2 space-y-1">
                {einheit.ablauf.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {typeof item === 'string' ? item : JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
