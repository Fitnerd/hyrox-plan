import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tests = await prisma.bestandsTest.findMany({
    where: { userId: session.user.id },
    orderBy: { datum: 'desc' },
  })
  return NextResponse.json(tests)
}

const CreateSchema = z.object({
  datum: z.string().datetime(),
  kategorie: z.enum(['AUSDAUER', 'KRAFT', 'MOBILITAET']),
  name: z.string().min(1).max(100),
  wert: z.number(),
  einheit: z.string().min(1).max(20),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const test = await prisma.bestandsTest.create({
    data: { userId: session.user.id, ...parsed.data, datum: new Date(parsed.data.datum) },
  })
  return NextResponse.json(test, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const existing = await prisma.bestandsTest.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.bestandsTest.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
