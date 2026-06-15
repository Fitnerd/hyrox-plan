import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const splitSchema = z.object({
  station: z.enum(['SKIERG', 'SLED_PUSH', 'SLED_PULL', 'BURPEE', 'ROWING', 'FARMERS', 'SANDBAG', 'WALLBALLS']),
  zeit: z.number().int().min(1),
  platzierung: z.number().int().optional().nullable(),
})

const schema = z.discriminatedUnion('path', [
  z.object({ path: z.literal('FIRST') }),
  z.object({
    path: z.literal('TOTAL_ONLY'),
    gesamtzeit: z.number().int().min(1),
    format: z.enum(['SOLO', 'DOUBLES']),
  }),
  z.object({
    path: z.literal('SPLITS'),
    gesamtzeit: z.number().int().min(1),
    format: z.enum(['SOLO', 'DOUBLES']),
    splits: z.array(splitSchema),
  }),
])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (parsed.data.path !== 'FIRST') {
    await prisma.previousRace.create({
      data: {
        userId: session.user.id,
        gesamtzeit: parsed.data.gesamtzeit,
        format: parsed.data.format,
        splits: parsed.data.path === 'SPLITS' ? {
          create: parsed.data.splits.map(s => ({
            station: s.station,
            zeit: s.zeit,
            platzierung: s.platzierung,
          })),
        } : undefined,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
