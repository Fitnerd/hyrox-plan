import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [profile, plan, lastTest] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.trainingPlan.findFirst({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    }),
    prisma.bestandsTest.findFirst({
      where: { userId },
      orderBy: { datum: 'desc' },
    }),
  ])

  if (!profile) redirect('/onboarding/profil')
  if (!plan) redirect('/onboarding/generieren')

  const now = new Date()
  const wettkampf = new Date(profile.wettkampfdatum)
  const daysLeft = Math.max(0, Math.ceil((wettkampf.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const weeksSincePlanStart = Math.max(1, Math.ceil(
    (now.getTime() - new Date(plan.generatedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
  ))

  return (
    <main className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Countdown */}
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-5xl font-bold text-primary">{daysLeft}</p>
        <p className="text-muted-foreground mt-1">Tage bis zum Wettkampf</p>
        <p className="text-xs text-muted-foreground mt-1">
          {wettkampf.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Current week */}
      <Link href="/plan" className="block rounded-xl border bg-card p-6 hover:bg-accent transition-colors">
        <p className="text-sm text-muted-foreground mb-1">Aktuelle Woche</p>
        <p className="text-3xl font-bold">Woche {weeksSincePlanStart}</p>
        <p className="text-sm text-muted-foreground mt-2">Plan ansehen →</p>
      </Link>

      {/* Last test */}
      <Link href="/bestandstest" className="block rounded-xl border bg-card p-6 hover:bg-accent transition-colors">
        <p className="text-sm text-muted-foreground mb-1">Letzter Bestandstest</p>
        {lastTest ? (
          <>
            <p className="text-xl font-semibold">{lastTest.name}</p>
            <p className="text-muted-foreground">
              {lastTest.wert} {lastTest.einheit} —{' '}
              {new Date(lastTest.datum).toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">Noch kein Test eingetragen →</p>
        )}
      </Link>
    </main>
  )
}
