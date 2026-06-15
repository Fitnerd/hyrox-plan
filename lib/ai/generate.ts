import Anthropic from '@anthropic-ai/sdk'
import { buildPlanPrompt } from './prompt'
import { parsePlanResponse } from './parse'
import { calcPaces } from '@/lib/utils/pace'
import { prisma } from '@/lib/db/prisma'

const client = new Anthropic()

export async function* generatePlanStream(userId: string): AsyncGenerator<string> {
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

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
    tools: [
      {
        name: 'save_plan',
        description: 'Save the training plan as structured data',
        input_schema: {
          type: 'object' as const,
          properties: {
            coachAnalysis: { type: 'string', description: 'Coach analysis text (German)' },
            paces: {
              type: 'object',
              properties: {
                easyMin: { type: 'string' }, easyMax: { type: 'string' },
                longRunMin: { type: 'string' }, longRunMax: { type: 'string' },
                tempo: { type: 'string' }, kombiStart: { type: 'string' },
                kombiEnd: { type: 'string' }, ziel5km: { type: 'string' },
              },
              required: ['easyMin', 'easyMax', 'longRunMin', 'longRunMax', 'tempo', 'kombiStart', 'kombiEnd', 'ziel5km'],
            },
            stationsPrioritaeten: {
              type: 'array',
              items: { type: 'string' },
              description: 'Stations ordered by training priority',
            },
            phasen: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nummer: { type: 'number' }, wochenVon: { type: 'number' },
                  wochenBis: { type: 'number' }, titel: { type: 'string' },
                  fokus: { type: 'string' },
                },
                required: ['nummer', 'wochenVon', 'wochenBis', 'titel', 'fokus'],
              },
            },
            wochen: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nummer: { type: 'number' },
                  phase: { type: 'number' },
                  einheiten: {
                    type: 'object',
                    properties: {
                      MI: { type: 'object' },
                      SA: { type: 'object' },
                      SO: { type: 'object' },
                    },
                  },
                },
                required: ['nummer', 'phase', 'einheiten'],
              },
            },
          },
          required: ['coachAnalysis', 'paces', 'stationsPrioritaeten', 'phasen', 'wochen'],
        },
      },
    ],
    tool_choice: { type: 'auto' },
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }

  const finalMessage = await stream.finalMessage()
  const toolUse = finalMessage.content.find(b => b.type === 'tool_use')

  if (toolUse && toolUse.type === 'tool_use') {
    const planData = parsePlanResponse(toolUse.input)
    await prisma.trainingPlan.create({
      data: {
        userId,
        coachAnalysis: planData.coachAnalysis,
        paces: planData.paces as object,
        content: {
          phasen: planData.phasen,
          wochen: planData.wochen,
        },
        stationsPrios: planData.stationsPrioritaeten,
      },
    })
    yield '\n\n__PLAN_SAVED__'
  } else {
    yield '\n\n__PLAN_ERROR__'
  }
}
