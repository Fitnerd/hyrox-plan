import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { encrypt } from '@/lib/crypto/encrypt'
import { z } from 'zod'

const schema = z.object({
  provider: z.enum(['ANTHROPIC', 'GEMINI', 'OPENAI']),
  apiKey: z.string().min(10),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { provider, apiKey } = parsed.data
  const aiApiKeyEncrypted = encrypt(apiKey)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { aiProvider: provider, aiApiKeyEncrypted },
  })

  return NextResponse.json({ ok: true })
}
