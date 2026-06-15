import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  alter: z.number().int().min(16).max(90),
  gewicht: z.number().min(30).max(250),
  wettkampfdatum: z.string().datetime(),
  format: z.enum(['SOLO', 'DOUBLES']),
  trainingstage: z.array(z.string()).min(1),
  andereAktivitaeten: z.string().optional(),
  fuenfKmZeit: z.number().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {
      ...parsed.data,
      wettkampfdatum: new Date(parsed.data.wettkampfdatum),
    },
    create: {
      userId: session.user.id,
      ...parsed.data,
      wettkampfdatum: new Date(parsed.data.wettkampfdatum),
    },
  })

  return NextResponse.json({ ok: true })
}
