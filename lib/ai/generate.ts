import { buildPlanPrompt } from './prompt'
import { parsePlanResponse } from './parse'
import { calcPaces } from '@/lib/utils/pace'
import { prisma } from '@/lib/db/prisma'
import { decrypt } from '@/lib/crypto/encrypt'
import { streamPlan, AiProvider } from './client'

export async function* generatePlanStream(userId: string): AsyncGenerator<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiProvider: true, aiApiKeyEncrypted: true },
  })

  if (!user?.aiProvider || !user?.aiApiKeyEncrypted) {
    throw new Error('Kein AI-Provider konfiguriert. Bitte gehe zu Profil → Provider ändern.')
  }

  const apiKey = decrypt(user.aiApiKeyEncrypted)
  const provider = user.aiProvider as AiProvider

  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) throw new Error('Profile not found')

  const races = await prisma.previousRace.findMany({
    where: { userId },
    include: { splits: true },
    orderBy: { id: 'desc' },
    take: 1,
  })

  const wettkampfWochen = Math.max(
    1,
    Math.round(
      (new Date(profile.wettkampfdatum).getTime() - Date.now()) /
        (7 * 24 * 60 * 60 * 1000)
    )
  )

  const paces = calcPaces(profile.fuenfKmZeit)
  const latestRace = races[0]

  let experiencePath: 'FIRST' | 'TOTAL_ONLY' | 'SPLITS' = 'FIRST'
  let gesamtzeit: number | undefined
  let splits: { station: string; zeit: number; platzierung?: number | null }[] = []

  if (latestRace) {
    if (latestRace.splits.length > 0) {
      experiencePath = 'SPLITS'
      gesamtzeit = latestRace.gesamtzeit
      splits = latestRace.splits
    } else {
      experiencePath = 'TOTAL_ONLY'
      gesamtzeit = latestRace.gesamtzeit
    }
  }

  const fmt = profile.format
  if (fmt !== 'SOLO' && fmt !== 'DOUBLES') throw new Error(`Unknown format: ${fmt}`)

  const prompt = buildPlanPrompt({
    profile: {
      alter: profile.alter,
      gewicht: profile.gewicht,
      format: fmt,
      wettkampfWochen,
      trainingstage: profile.trainingstage,
      andereAktivitaeten: profile.andereAktivitaeten,
      fuenfKmZeit: profile.fuenfKmZeit,
      paces,
    },
    experiencePath,
    gesamtzeit,
    splits,
  })

  const gen = streamPlan(provider, apiKey, prompt)
  let planData: Record<string, unknown> | null = null

  while (true) {
    const result = await gen.next()
    if (result.done) {
      planData = result.value
      break
    }
    yield result.value
  }

  if (!planData) {
    yield '\n\n__PLAN_ERROR__'
    return
  }

  const parsed = parsePlanResponse(planData)
  await prisma.trainingPlan.create({
    data: {
      userId,
      coachAnalysis: parsed.coachAnalysis,
      paces: parsed.paces as object,
      content: {
        phasen: parsed.phasen,
        wochen: parsed.wochen,
      },
      stationsPrios: parsed.stationsPrioritaeten,
    },
  })
  yield '\n\n__PLAN_SAVED__'
}
