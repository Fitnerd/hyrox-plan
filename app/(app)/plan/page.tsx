import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { CoachAnalysis } from '@/components/plan/CoachAnalysis'
import { WeekCalendar } from '@/components/plan/WeekCalendar'
import type { PlanContent, PlanPace } from '@/lib/types/plan'

export default async function PlanPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const plan = await prisma.trainingPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { generatedAt: 'desc' },
  })

  if (!plan) redirect('/onboarding/profil')

  const content = plan.content as unknown as PlanContent
  const paces = plan.paces as unknown as PlanPace

  return (
    <main className="max-w-2xl mx-auto p-4 pb-24 space-y-8">
      <h1 className="text-2xl font-bold">Dein Trainingsplan</h1>
      <CoachAnalysis
        analysis={plan.coachAnalysis}
        paces={paces}
        stationsPrios={plan.stationsPrios}
      />
      <section>
        <h2 className="text-xl font-semibold mb-4">Wochenplan</h2>
        <WeekCalendar wochen={content.wochen} phasen={content.phasen} />
      </section>
    </main>
  )
}
