# Hyrox Plan App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js PWA where users register, enter their Hyrox profile, and receive a Claude-generated personalized training plan with Bestandstest tracking.

**Architecture:** Next.js 15 App Router fullstack app — Server Actions call Claude API for streaming plan generation, NextAuth v5 handles auth, Prisma+PostgreSQL persists data. UI is Tailwind + shadcn/ui components.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, NextAuth v5, Prisma 5, PostgreSQL, Anthropic SDK, Vitest, next-pwa

---

## File Map

```
/app
  /(auth)/login/page.tsx
  /(auth)/register/page.tsx
  /(onboarding)/onboarding/profil/page.tsx
  /(onboarding)/onboarding/erfahrung/page.tsx
  /(onboarding)/onboarding/generieren/page.tsx
  /(app)/dashboard/page.tsx
  /(app)/plan/page.tsx
  /(app)/plan/woche/[n]/page.tsx
  /(app)/bestandstest/page.tsx
  /(app)/profil/page.tsx
  /api/auth/[...nextauth]/route.ts
  /api/plan/generate/route.ts
  /api/bestandstest/route.ts
/components
  /onboarding/ProfilForm.tsx
  /onboarding/ErfahrungForm.tsx
  /onboarding/SplitsForm.tsx
  /plan/CoachAnalysis.tsx
  /plan/WeekCalendar.tsx
  /plan/WeekDetail.tsx
  /bestandstest/TestForm.tsx
  /bestandstest/TestHistory.tsx
  /ui/ (shadcn components)
/lib
  /ai/prompt.ts        — build Claude prompt from profile
  /ai/generate.ts      — call Anthropic SDK, stream response
  /ai/parse.ts         — validate/parse Claude JSON output
  /auth/config.ts      — NextAuth config
  /db/prisma.ts        — Prisma client singleton
  /utils/pace.ts       — pace calculations from 5km time
/prisma
  schema.prisma
/tests
  /lib/ai/prompt.test.ts
  /lib/ai/parse.test.ts
  /lib/utils/pace.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`

- [ ] **Step 1: Bootstrap Next.js project**

```bash
cd D:/claudi/hyrox-plan
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Next.js project files created. Say yes to all prompts.

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @prisma/client @auth/prisma-adapter next-auth@beta @anthropic-ai/sdk zod next-pwa
pnpm add -D prisma vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Install shadcn/ui**

```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button input label card form select checkbox toast
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json` scripts, add:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: Configure .env.local**

Create `.env.local`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/hyrox_plan"
AUTH_SECRET="run-openssl-rand-base64-32-and-paste-here"
ANTHROPIC_API_KEY="sk-ant-..."
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 7: Verify project starts**

```bash
pnpm dev
```

Expected: App running at http://localhost:3000 showing default Next.js page.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind, shadcn, Vitest"
```

---

## Task 2: Prisma Schema + Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
pnpm dlx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String         @id @default(cuid())
  email        String         @unique
  passwordHash String
  name         String?
  createdAt    DateTime       @default(now())
  profile      Profile?
  races        PreviousRace[]
  plans        TrainingPlan[]
  tests        BestandsTest[]
  accounts     Account[]
  sessions     Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Profile {
  id                 String   @id @default(cuid())
  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  alter              Int
  gewicht            Float
  wettkampfdatum     DateTime
  format             Format
  trainingstage      String[]
  andereAktivitaeten String?
  fuenfKmZeit        Int?     // Sekunden, optional
}

model PreviousRace {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  gesamtzeit Int
  format     Format
  splits     Split[]
}

model Split {
  id           String       @id @default(cuid())
  raceId       String
  race         PreviousRace @relation(fields: [raceId], references: [id], onDelete: Cascade)
  station      Station
  zeit         Int
  platzierung  Int?
}

model TrainingPlan {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  generatedAt    DateTime @default(now())
  coachAnalysis  String
  paces          Json
  content        Json
  stationsPrios  String[]
}

model BestandsTest {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  datum     DateTime
  kategorie Kategorie
  name      String
  wert      Float
  einheit   String
}

enum Format    { SOLO DOUBLES }
enum Station   { SKIERG SLED_PUSH SLED_PULL BURPEE ROWING FARMERS SANDBAG WALLBALLS }
enum Kategorie { AUSDAUER KRAFT MOBILITAET }
```

- [ ] **Step 3: Create Prisma client singleton**

Create `lib/db/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Run migration**

```bash
pnpm dlx prisma migrate dev --name init
pnpm dlx prisma generate
```

Expected: Migration applied, Prisma client generated.

- [ ] **Step 5: Commit**

```bash
git add prisma/ lib/db/prisma.ts
git commit -m "feat: add Prisma schema and DB client"
```

---

## Task 3: Auth Configuration

**Files:**
- Create: `lib/auth/config.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Write NextAuth config**

Create `lib/auth/config.ts`:

```typescript
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
```

- [ ] **Step 2: Install bcryptjs**

```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

- [ ] **Step 3: Create API route**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/lib/auth/config'
export const { GET, POST } = handlers
```

- [ ] **Step 4: Add auth middleware**

Create `middleware.ts` in project root:

```typescript
import { auth } from '@/lib/auth/config'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnboarding = req.nextUrl.pathname.startsWith('/onboarding')
  const isAuth = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')
  const isProtected = !isAuth && !req.nextUrl.pathname.startsWith('/')

  if (!isLoggedIn && isProtected) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/plan/:path*', '/bestandstest/:path*', '/profil/:path*', '/onboarding/:path*'],
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/auth/ app/api/auth/ middleware.ts
git commit -m "feat: add NextAuth v5 with credentials provider"
```

---

## Task 4: Register + Login Pages

**Files:**
- Create: `app/(auth)/register/page.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/api/auth/register/route.ts`

- [ ] **Step 1: Create register API route**

Create `app/api/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
  })

  return NextResponse.json({ id: user.id }, { status: 201 })
}
```

- [ ] **Step 2: Create register page**

Create `app/(auth)/register/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        password: fd.get('password'),
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      setLoading(false)
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Konto erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
            <div><Label htmlFor="email">E-Mail</Label><Input id="email" name="email" type="email" required /></div>
            <div><Label htmlFor="password">Passwort (min. 8 Zeichen)</Label><Input id="password" name="password" type="password" minLength={8} required /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Erstelle Konto…' : 'Registrieren'}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            Bereits registriert? <Link href="/login" className="underline">Anmelden</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create login page**

Create `app/(auth)/login/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      redirect: false,
    })
    if (result?.error) {
      setError('E-Mail oder Passwort falsch')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Anmelden</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="email">E-Mail</Label><Input id="email" name="email" type="email" required /></div>
            <div><Label htmlFor="password">Passwort</Label><Input id="password" name="password" type="password" required /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Anmelden…' : 'Anmelden'}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            Noch kein Konto? <Link href="/register" className="underline">Registrieren</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Manual test**

```
1. pnpm dev
2. Open http://localhost:3000/register
3. Register with test@example.com / password123
4. Should redirect to /login?registered=1
5. Login with same credentials
6. Should redirect to /dashboard (404 is fine — page not built yet)
```

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: add register and login pages with NextAuth credentials"
```

---

## Task 5: Pace Calculations (TDD)

**Files:**
- Create: `lib/utils/pace.ts`
- Create: `tests/lib/utils/pace.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/utils/pace.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calcPaces, secondsToMmSs, mmSsToSeconds } from '@/lib/utils/pace'

describe('mmSsToSeconds', () => {
  it('converts "25:39" to 1539', () => {
    expect(mmSsToSeconds('25:39')).toBe(1539)
  })
  it('returns null for empty string', () => {
    expect(mmSsToSeconds('')).toBeNull()
  })
})

describe('secondsToMmSs', () => {
  it('converts 307 to "5:07"', () => {
    expect(secondsToMmSs(307)).toBe('5:07')
  })
  it('pads seconds below 10', () => {
    expect(secondsToMmSs(300)).toBe('5:00')
  })
})

describe('calcPaces', () => {
  it('calculates paces from 5km time in seconds', () => {
    const paces = calcPaces(1539) // 25:39 = 5:07/km
    expect(paces.easyMin).toBe('5:45')
    expect(paces.easyMax).toBe('6:00')
    expect(paces.longRunMin).toBe('5:35')
    expect(paces.longRunMax).toBe('5:55')
    expect(paces.tempo).toBe('4:50')
    expect(paces.kombiStart).toBe('4:55')
    expect(paces.kombiEnd).toBe('4:35')
  })

  it('returns conservative paces when 5km time is null', () => {
    const paces = calcPaces(null)
    expect(paces.easyMin).toBe('6:30')
    expect(paces.easyMax).toBe('7:00')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test:run tests/lib/utils/pace.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/utils/pace'`

- [ ] **Step 3: Implement pace utilities**

Create `lib/utils/pace.ts`:

```typescript
export function mmSsToSeconds(value: string): number | null {
  if (!value) return null
  const [m, s] = value.split(':').map(Number)
  return m * 60 + s
}

export function secondsToMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// pace per km in seconds, from 5km total seconds
function kmPaceSeconds(fiveKmSeconds: number): number {
  return Math.round(fiveKmSeconds / 5)
}

export interface Paces {
  easyMin: string
  easyMax: string
  longRunMin: string
  longRunMax: string
  tempo: string
  kombiStart: string
  kombiEnd: string
  ziel5km: string
}

export function calcPaces(fiveKmSeconds: number | null): Paces {
  if (!fiveKmSeconds) {
    // conservative defaults for unknown fitness
    return {
      easyMin: '6:30', easyMax: '7:00',
      longRunMin: '6:20', longRunMax: '6:50',
      tempo: '5:45', kombiStart: '6:00', kombiEnd: '5:30',
      ziel5km: '5:45',
    }
  }
  const base = kmPaceSeconds(fiveKmSeconds) // e.g. 307s = 5:07/km
  return {
    easyMin: secondsToMmSs(base + 38),  // +38s
    easyMax: secondsToMmSs(base + 53),  // +53s
    longRunMin: secondsToMmSs(base + 28),
    longRunMax: secondsToMmSs(base + 48),
    tempo: secondsToMmSs(base - 17),
    kombiStart: secondsToMmSs(base - 12),
    kombiEnd: secondsToMmSs(base - 32),
    ziel5km: secondsToMmSs(base - 37),
  }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
pnpm test:run tests/lib/utils/pace.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/utils/pace.ts tests/lib/utils/pace.test.ts
git commit -m "feat: add pace calculation utilities (TDD)"
```

---

## Task 6: Claude Prompt Builder (TDD)

**Files:**
- Create: `lib/ai/prompt.ts`
- Create: `lib/ai/parse.ts`
- Create: `tests/lib/ai/prompt.test.ts`
- Create: `tests/lib/ai/parse.test.ts`

- [ ] **Step 1: Write prompt builder tests**

Create `tests/lib/ai/prompt.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildPlanPrompt } from '@/lib/ai/prompt'

const baseProfile = {
  alter: 35,
  gewicht: 93,
  format: 'DOUBLES' as const,
  wettkampfWochen: 20,
  trainingstage: ['MO', 'MI', 'SA', 'SO'],
  andereAktivitaeten: 'Ultimate Frisbee Mo + Do',
  fuenfKmZeit: 1539,
  paces: {
    easyMin: '5:45', easyMax: '6:00', longRunMin: '5:35',
    longRunMax: '5:55', tempo: '4:50', kombiStart: '4:55',
    kombiEnd: '4:35', ziel5km: '4:30',
  },
}

describe('buildPlanPrompt', () => {
  it('includes user profile data', () => {
    const prompt = buildPlanPrompt({ profile: baseProfile, experiencePath: 'FIRST' })
    expect(prompt).toContain('35 Jahre')
    expect(prompt).toContain('93 kg')
    expect(prompt).toContain('DOUBLES')
    expect(prompt).toContain('20 Wochen')
  })

  it('mentions first-time path when no prior race', () => {
    const prompt = buildPlanPrompt({ profile: baseProfile, experiencePath: 'FIRST' })
    expect(prompt).toContain('erster Hyrox')
  })

  it('includes gesamtzeit in total-only path', () => {
    const prompt = buildPlanPrompt({
      profile: baseProfile,
      experiencePath: 'TOTAL_ONLY',
      gesamtzeit: 5820,
    })
    expect(prompt).toContain('1:37')
  })

  it('includes split data in splits path', () => {
    const prompt = buildPlanPrompt({
      profile: baseProfile,
      experiencePath: 'SPLITS',
      splits: [{ station: 'BURPEE', zeit: 275, platzierung: 860 }],
    })
    expect(prompt).toContain('BURPEE')
    expect(prompt).toContain('860')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm test:run tests/lib/ai/prompt.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement prompt builder**

Create `lib/ai/prompt.ts`:

```typescript
import { Paces, secondsToMmSs } from '@/lib/utils/pace'

type ExperiencePath = 'FIRST' | 'TOTAL_ONLY' | 'SPLITS'

interface Split {
  station: string
  zeit: number
  platzierung?: number | null
}

interface PromptInput {
  profile: {
    alter: number
    gewicht: number
    format: 'SOLO' | 'DOUBLES'
    wettkampfWochen: number
    trainingstage: string[]
    andereAktivitaeten?: string | null
    fuenfKmZeit?: number | null
    paces: Paces
  }
  experiencePath: ExperiencePath
  gesamtzeit?: number
  splits?: Split[]
}

export function buildPlanPrompt(input: PromptInput): string {
  const { profile, experiencePath, gesamtzeit, splits } = input
  const { paces } = profile

  const fiveKmInfo = profile.fuenfKmZeit
    ? `5km-Testzeit: ${secondsToMmSs(profile.fuenfKmZeit)} (${secondsToMmSs(Math.round(profile.fuenfKmZeit / 5))}/km)`
    : '5km-Zeit: unbekannt — bitte konservative Paces schätzen'

  let experienceSection = ''
  if (experiencePath === 'FIRST') {
    experienceSection = 'Erfahrung: erster Hyrox — keine Vorjahresdaten vorhanden.'
  } else if (experiencePath === 'TOTAL_ONLY' && gesamtzeit) {
    const h = Math.floor(gesamtzeit / 3600)
    const m = Math.floor((gesamtzeit % 3600) / 60)
    experienceSection = `Erfahrung: Vorjahres-Gesamtzeit ${h}:${m.toString().padStart(2, '0')} (${profile.format}). Keine Split-Zeiten — bitte typische Schwachstellen für dieses Niveau schätzen.`
  } else if (experiencePath === 'SPLITS' && splits?.length) {
    const splitsText = splits
      .map(s => `  ${s.station}: ${secondsToMmSs(s.zeit)}${s.platzierung ? ` (Platz ${s.platzierung})` : ''}`)
      .join('\n')
    experienceSection = `Erfahrung: Vorjahres-Splits:\n${splitsText}`
  }

  return `Du bist ein Hyrox-Coach. Erstelle einen personalisierten Trainingsplan als strukturiertes JSON.

## Athleten-Profil
- Alter: ${profile.alter} Jahre, Gewicht: ${profile.gewicht} kg
- Wettkampfformat: ${profile.format}
- Wochen bis Wettkampf: ${profile.wettkampfWochen} Wochen
- Verfügbare Trainingstage: ${profile.trainingstage.join(', ')}
- Andere Aktivitäten: ${profile.andereAktivitaeten ?? 'keine'}
- ${fiveKmInfo}

## Berechnete Trainingspaces
- Easy Run: ${paces.easyMin}–${paces.easyMax}/km
- Long Run: ${paces.longRunMin}–${paces.longRunMax}/km
- Tempo: ${paces.tempo}/km
- Kombi-Splits: ${paces.kombiStart}→${paces.kombiEnd}/km
- 5km-Ziel: ${paces.ziel5km}/km

## ${experienceSection}

## Aufgabe
Erstelle einen ${profile.wettkampfWochen}-Wochen-Plan mit 4 Phasen (Direkteinstieg → Tempo+Kraft → Simulation → Taper).
Pro Woche: Mittwoch-Einheit (Kombi/Intervall/Tempo), Samstag (Long Run), Sonntag (Gym/Kraft).
Andere Tage werden aus dem Profil befüllt.

Antworte NUR mit validem JSON gemäß dem bereitgestellten Schema. Kein Prosa-Text außerhalb des JSON.`
}
```

- [ ] **Step 4: Write parse tests**

Create `tests/lib/ai/parse.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parsePlanResponse } from '@/lib/ai/parse'

const validResponse = {
  coachAnalysis: 'Deine Stärken sind SkiErg und Sled Push.',
  paces: { easyMin: '5:45', easyMax: '6:00', longRunMin: '5:35', longRunMax: '5:55', tempo: '4:50', kombiStart: '4:55', kombiEnd: '4:35', ziel5km: '4:30' },
  stationsPrioritaeten: ['BURPEE', 'SANDBAG', 'ROWING'],
  phasen: [{ nummer: 1, wochenVon: 1, wochenBis: 3, titel: 'Direkteinstieg', fokus: 'Kombi-Einheiten' }],
  wochen: [{ nummer: 1, phase: 1, einheiten: { MI: { typ: 'KOMBI', beschreibung: 'Kombi-Einheit', ablauf: ['1km @ 4:55/km', 'SkiErg 500m'] }, SA: { typ: 'LONG_RUN', distanz: 8, pace: '5:45/km' }, SO: { typ: 'GYM', uebungen: ['Kniebeuge 3x10'] } } }],
}

describe('parsePlanResponse', () => {
  it('accepts valid response', () => {
    const result = parsePlanResponse(validResponse)
    expect(result.coachAnalysis).toBe('Deine Stärken sind SkiErg und Sled Push.')
    expect(result.stationsPrioritaeten).toHaveLength(3)
    expect(result.wochen).toHaveLength(1)
  })

  it('throws on missing coachAnalysis', () => {
    const invalid = { ...validResponse, coachAnalysis: undefined }
    expect(() => parsePlanResponse(invalid)).toThrow()
  })

  it('throws on empty wochen', () => {
    const invalid = { ...validResponse, wochen: [] }
    expect(() => parsePlanResponse(invalid)).toThrow()
  })
})
```

- [ ] **Step 5: Implement parse**

Create `lib/ai/parse.ts`:

```typescript
import { z } from 'zod'

const EinheitSchema = z.object({
  typ: z.enum(['KOMBI', 'LONG_RUN', 'GYM', 'INTERVALL', 'TEMPO']),
  beschreibung: z.string().optional(),
  ablauf: z.array(z.string()).optional(),
  distanz: z.number().optional(),
  pace: z.string().optional(),
  uebungen: z.array(z.string()).optional(),
})

const PlanSchema = z.object({
  coachAnalysis: z.string().min(1),
  paces: z.object({
    easyMin: z.string(), easyMax: z.string(),
    longRunMin: z.string(), longRunMax: z.string(),
    tempo: z.string(), kombiStart: z.string(),
    kombiEnd: z.string(), ziel5km: z.string(),
  }),
  stationsPrioritaeten: z.array(z.string()).min(1),
  phasen: z.array(z.object({
    nummer: z.number(), wochenVon: z.number(), wochenBis: z.number(),
    titel: z.string(), fokus: z.string(),
  })).min(1),
  wochen: z.array(z.object({
    nummer: z.number(), phase: z.number(),
    einheiten: z.object({
      MI: EinheitSchema.optional(),
      SA: EinheitSchema.optional(),
      SO: EinheitSchema.optional(),
    }),
  })).min(1),
})

export type PlanResponse = z.infer<typeof PlanSchema>

export function parsePlanResponse(raw: unknown): PlanResponse {
  return PlanSchema.parse(raw)
}
```

- [ ] **Step 6: Run all tests — expect PASS**

```bash
pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add lib/ai/ tests/lib/ai/
git commit -m "feat: add Claude prompt builder and response parser (TDD)"
```

---

## Task 7: Onboarding — Profil Form

**Files:**
- Create: `app/(onboarding)/onboarding/profil/page.tsx`
- Create: `components/onboarding/ProfilForm.tsx`
- Create: `app/api/onboarding/profil/route.ts`

- [ ] **Step 1: Create Profil API route**

Create `app/api/onboarding/profil/route.ts`:

```typescript
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
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data, wettkampfdatum: new Date(parsed.data.wettkampfdatum) },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create ProfilForm component**

Create `components/onboarding/ProfilForm.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mmSsToSeconds } from '@/lib/utils/pace'

const TAGE = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO']
const TAGE_LABEL: Record<string, string> = { MO: 'Mo', DI: 'Di', MI: 'Mi', DO: 'Do', FR: 'Fr', SA: 'Sa', SO: 'So' }

export function ProfilForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTage, setSelectedTage] = useState<string[]>(['MO', 'MI', 'SA', 'SO'])
  const [format, setFormat] = useState<'SOLO' | 'DOUBLES'>('DOUBLES')

  function toggleTag(tag: string) {
    setSelectedTage(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const fuenfKmRaw = fd.get('fuenfKmZeit') as string
    const fuenfKmZeit = fuenfKmRaw ? mmSsToSeconds(fuenfKmRaw) : null

    const res = await fetch('/api/onboarding/profil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alter: Number(fd.get('alter')),
        gewicht: Number(fd.get('gewicht')),
        wettkampfdatum: new Date(fd.get('wettkampfdatum') as string).toISOString(),
        format,
        trainingstage: selectedTage,
        andereAktivitaeten: fd.get('andereAktivitaeten') || undefined,
        fuenfKmZeit,
      }),
    })
    if (!res.ok) { setError('Fehler beim Speichern'); setLoading(false); return }
    router.push('/onboarding/erfahrung')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Alter</Label><Input name="alter" type="number" min={16} max={90} required /></div>
        <div><Label>Gewicht (kg)</Label><Input name="gewicht" type="number" step="0.1" required /></div>
      </div>
      <div><Label>Wettkampfdatum</Label><Input name="wettkampfdatum" type="date" required /></div>
      <div>
        <Label>Format</Label>
        <div className="flex gap-3 mt-1">
          {(['SOLO', 'DOUBLES'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFormat(f)}
              className={`px-4 py-2 rounded border text-sm ${format === f ? 'bg-primary text-primary-foreground' : 'border-input'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Trainingstage</Label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {TAGE.map(t => (
            <button key={t} type="button" onClick={() => toggleTag(t)}
              className={`px-3 py-1 rounded text-sm border ${selectedTage.includes(t) ? 'bg-primary text-primary-foreground' : 'border-input'}`}>
              {TAGE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>5km Testzeit (optional, Format MM:SS)</Label>
        <Input name="fuenfKmZeit" placeholder="z.B. 25:39" pattern="\d{1,2}:\d{2}" />
      </div>
      <div><Label>Andere Sportarten (optional)</Label><Input name="andereAktivitaeten" placeholder="z.B. Frisbee 2x/Woche" /></div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || selectedTage.length === 0}>
        {loading ? 'Speichern…' : 'Weiter →'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Create onboarding profil page**

Create `app/(onboarding)/onboarding/profil/page.tsx`:

```typescript
import { ProfilForm } from '@/components/onboarding/ProfilForm'

export default function OnboardingProfilPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Schritt 1 von 2</p>
          <h1 className="text-2xl font-bold">Dein Profil</h1>
        </div>
        <ProfilForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Manual test**

```
1. Login, then navigate to /onboarding/profil
2. Fill in form, submit
3. Should redirect to /onboarding/erfahrung (404 is fine for now)
4. Check DB: SELECT * FROM "Profile"; — should have 1 row
```

- [ ] **Step 5: Commit**

```bash
git add app/api/onboarding/ app/\(onboarding\)/ components/onboarding/ProfilForm.tsx
git commit -m "feat: add onboarding step 1 - profile form"
```

---

## Task 8: Onboarding — Erfahrung Form

**Files:**
- Create: `app/(onboarding)/onboarding/erfahrung/page.tsx`
- Create: `components/onboarding/ErfahrungForm.tsx`
- Create: `components/onboarding/SplitsForm.tsx`
- Create: `app/api/onboarding/erfahrung/route.ts`

- [ ] **Step 1: Create Erfahrung API route**

Create `app/api/onboarding/erfahrung/route.ts`:

```typescript
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
  z.object({ path: z.literal('TOTAL_ONLY'), gesamtzeit: z.number().int(), format: z.enum(['SOLO', 'DOUBLES']) }),
  z.object({ path: z.literal('SPLITS'), gesamtzeit: z.number().int(), format: z.enum(['SOLO', 'DOUBLES']), splits: z.array(splitSchema) }),
])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (parsed.data.path !== 'FIRST') {
    const race = await prisma.previousRace.create({
      data: {
        userId: session.user.id,
        gesamtzeit: parsed.data.gesamtzeit,
        format: parsed.data.format,
        splits: parsed.data.path === 'SPLITS' ? {
          create: parsed.data.splits.map(s => ({ station: s.station, zeit: s.zeit, platzierung: s.platzierung }))
        } : undefined,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create SplitsForm component**

Create `components/onboarding/SplitsForm.tsx`:

```typescript
'use client'
import { Input } from '@/components/ui/input'
import { mmSsToSeconds, secondsToMmSs } from '@/lib/utils/pace'

const STATIONS = [
  { key: 'SKIERG', label: 'SkiErg 1000m' },
  { key: 'SLED_PUSH', label: 'Sled Push 50m' },
  { key: 'SLED_PULL', label: 'Sled Pull 50m' },
  { key: 'BURPEE', label: 'Burpee Broad Jump 80m' },
  { key: 'ROWING', label: 'Rowing 1000m' },
  { key: 'FARMERS', label: 'Farmers Carry 200m' },
  { key: 'SANDBAG', label: 'Sandbag Lunges 100m' },
  { key: 'WALLBALLS', label: 'Wall Balls' },
]

interface Split { station: string; zeit: number; platzierung?: number | null }

interface Props {
  value: Split[]
  onChange: (splits: Split[]) => void
}

export function SplitsForm({ value, onChange }: Props) {
  function handleChange(station: string, field: 'zeit' | 'platzierung', raw: string) {
    const existing = value.find(s => s.station === station) ?? { station, zeit: 0 }
    let updated: Split
    if (field === 'zeit') {
      const secs = mmSsToSeconds(raw)
      updated = { ...existing, zeit: secs ?? 0 }
    } else {
      updated = { ...existing, platzierung: raw ? Number(raw) : null }
    }
    onChange([...value.filter(s => s.station !== station), updated].filter(s => s.zeit > 0))
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_90px_80px] gap-2 text-xs text-muted-foreground px-1">
        <span>Station</span><span>Zeit (MM:SS)</span><span>Platz (opt.)</span>
      </div>
      {STATIONS.map(({ key, label }) => {
        const split = value.find(s => s.station === key)
        return (
          <div key={key} className="grid grid-cols-[1fr_90px_80px] gap-2 items-center">
            <span className="text-sm">{label}</span>
            <Input
              placeholder="3:48"
              defaultValue={split ? secondsToMmSs(split.zeit) : ''}
              pattern="\d{1,2}:\d{2}"
              onChange={e => handleChange(key, 'zeit', e.target.value)}
            />
            <Input
              placeholder="220"
              type="number"
              defaultValue={split?.platzierung ?? ''}
              onChange={e => handleChange(key, 'platzierung', e.target.value)}
            />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create ErfahrungForm component**

Create `components/onboarding/ErfahrungForm.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SplitsForm } from './SplitsForm'
import { mmSsToSeconds } from '@/lib/utils/pace'

type Path = 'FIRST' | 'TOTAL_ONLY' | 'SPLITS'

export function ErfahrungForm() {
  const router = useRouter()
  const [path, setPath] = useState<Path | null>(null)
  const [format, setFormat] = useState<'SOLO' | 'DOUBLES'>('DOUBLES')
  const [splits, setSplits] = useState<{ station: string; zeit: number; platzierung?: number | null }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!path) return
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)

    let body: Record<string, unknown> = { path }
    if (path !== 'FIRST') {
      const gesamtRaw = fd.get('gesamtzeit') as string
      const gesamtzeit = mmSsToSeconds(gesamtRaw.replace('h', ':').replace(':', ''))
      // parse h:mm:ss format
      const parts = gesamtRaw.split(':').map(Number)
      const gesamtsekunden = parts.length === 3 ? parts[0]*3600 + parts[1]*60 + parts[2] : parts[0]*60 + parts[1]
      body = { path, gesamtzeit: gesamtsekunden, format }
    }
    if (path === 'SPLITS') body = { ...body, splits }

    const res = await fetch('/api/onboarding/erfahrung', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (!res.ok) { setError('Fehler beim Speichern'); setLoading(false); return }
    router.push('/onboarding/generieren')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {([
          { key: 'FIRST', label: '🟢 Nein — mein erster Hyrox', desc: 'Plan basiert auf deinem Profil und 5km-Test.' },
          { key: 'TOTAL_ONLY', label: '🟡 Ja — ich kenne nur meine Gesamtzeit', desc: 'KI schätzt Schwachstellen anhand typischer Muster.' },
          { key: 'SPLITS', label: '🔵 Ja — ich kenne meine Split-Zeiten', desc: 'Präziseste Analyse — trage deine Station-Zeiten ein.' },
        ] as const).map(opt => (
          <button key={opt.key} type="button" onClick={() => setPath(opt.key)}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${path === opt.key ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50'}`}>
            <div className="font-medium">{opt.label}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      {path && path !== 'FIRST' && (
        <div className="space-y-3 pt-2">
          <div>
            <Label>Format</Label>
            <div className="flex gap-3 mt-1">
              {(['SOLO', 'DOUBLES'] as const).map(f => (
                <button key={f} type="button" onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded border text-sm ${format === f ? 'bg-primary text-primary-foreground' : 'border-input'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Gesamtzeit (H:MM:SS)</Label>
            <Input name="gesamtzeit" placeholder="1:37:00" required />
          </div>
        </div>
      )}

      {path === 'SPLITS' && (
        <div className="pt-2">
          <Label className="mb-2 block">Station-Zeiten</Label>
          <SplitsForm value={splits} onChange={setSplits} />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {path && (
        <div className="flex gap-3 pt-2">
          {path === 'SPLITS' && (
            <Button type="button" variant="outline" className="flex-1"
              onClick={() => { setSplits([]); router.push('/onboarding/generieren') }}>
              Überspringen
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Speichern…' : 'Plan generieren →'}
          </Button>
        </div>
      )}
    </form>
  )
}
```

- [ ] **Step 4: Create erfahrung page**

Create `app/(onboarding)/onboarding/erfahrung/page.tsx`:

```typescript
import { ErfahrungForm } from '@/components/onboarding/ErfahrungForm'

export default function OnboardingErfahrungPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Schritt 2 von 2</p>
          <h1 className="text-2xl font-bold">Hyrox-Erfahrung</h1>
          <p className="text-muted-foreground mt-1">Hast du schon einen Hyrox gemacht?</p>
        </div>
        <ErfahrungForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Manual test**

```
1. Complete step 1, then navigate to /onboarding/erfahrung
2. Test all 3 paths (FIRST, TOTAL_ONLY, SPLITS)
3. On submit each should redirect to /onboarding/generieren (404 is fine)
4. Check DB: SELECT * FROM "PreviousRace" and "Split" for TOTAL_ONLY and SPLITS paths
```

- [ ] **Step 6: Commit**

```bash
git add app/ components/onboarding/
git commit -m "feat: add onboarding step 2 - experience form with 3 paths"
```

---

## Task 9: Plan Generation API + Streaming

**Files:**
- Create: `lib/ai/generate.ts`
- Create: `app/api/plan/generate/route.ts`
- Create: `app/(onboarding)/onboarding/generieren/page.tsx`

- [ ] **Step 1: Implement generate function**

Create `lib/ai/generate.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { buildPlanPrompt } from './prompt'
import { parsePlanResponse, PlanResponse } from './parse'
import { calcPaces, secondsToMmSs } from '@/lib/utils/pace'
import { prisma } from '@/lib/db/prisma'

const client = new Anthropic()

interface GenerateInput {
  userId: string
}

export async function* generatePlanStream(userId: string): AsyncGenerator<string> {
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) throw new Error('Profile not found')

  const races = await prisma.previousRace.findMany({
    where: { userId }, include: { splits: true }, orderBy: { id: 'desc' }, take: 1,
  })

  const wettkampfWochen = Math.round(
    (new Date(profile.wettkampfdatum).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)
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

  const prompt = buildPlanPrompt({
    profile: {
      alter: profile.alter,
      gewicht: profile.gewicht,
      format: profile.format,
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

  let fullResponse = ''

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
    tools: [{
      name: 'save_plan',
      description: 'Save the training plan as structured data',
      input_schema: {
        type: 'object' as const,
        properties: {
          coachAnalysis: { type: 'string' },
          paces: { type: 'object' },
          stationsPrioritaeten: { type: 'array', items: { type: 'string' } },
          phasen: { type: 'array' },
          wochen: { type: 'array' },
        },
        required: ['coachAnalysis', 'paces', 'stationsPrioritaeten', 'phasen', 'wochen'],
      },
    }],
    tool_choice: { type: 'auto' },
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
      fullResponse += event.delta.text
    }
    if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
      fullResponse += event.delta.partial_json
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
        paces: planData.paces,
        content: { phasen: planData.phasen, wochen: planData.wochen },
        stationsPrios: planData.stationsPrioritaeten,
      },
    })
    yield '\n\n__PLAN_SAVED__'
  }
}
```

- [ ] **Step 2: Create streaming API route**

Create `app/api/plan/generate/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { generatePlanStream } from '@/lib/ai/generate'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generatePlanStream(session.user.id)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
```

- [ ] **Step 3: Create generieren page**

Create `app/(onboarding)/onboarding/generieren/page.tsx`:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function OnboardingGenerierenPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'generating' | 'done' | 'error'>('generating')
  const [text, setText] = useState('')

  useEffect(() => {
    let es: EventSource | null = null

    async function generate() {
      const res = await fetch('/api/plan/generate', { method: 'POST' })
      if (!res.body) { setStatus('error'); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') { setStatus('done'); return }
          try {
            const { text: chunk, error } = JSON.parse(payload)
            if (error) { setStatus('error'); return }
            if (chunk?.includes('__PLAN_SAVED__')) { setStatus('done'); return }
            if (chunk) setText(prev => prev + chunk)
          } catch {}
        }
      }
    }

    generate()
    return () => { es?.close() }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {status === 'generating' && (
          <>
            <div className="text-4xl mb-4 animate-pulse">⚡</div>
            <h1 className="text-2xl font-bold mb-2">Dein Plan wird erstellt…</h1>
            <p className="text-muted-foreground mb-6">Claude analysiert dein Profil und erstellt deinen persönlichen Hyrox-Plan.</p>
            {text && (
              <div className="text-left bg-muted p-4 rounded-lg text-sm font-mono max-h-48 overflow-y-auto">
                {text}
              </div>
            )}
          </>
        )}
        {status === 'done' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2">Plan erstellt!</h1>
            <p className="text-muted-foreground mb-6">Dein persönlicher Hyrox-Trainingsplan ist bereit.</p>
            <Button onClick={() => router.push('/plan')} size="lg">Zum Plan →</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2">Fehler</h1>
            <p className="text-muted-foreground mb-6">Plan konnte nicht erstellt werden. Bitte versuche es erneut.</p>
            <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Manual test**

```
1. Complete onboarding steps 1 + 2
2. Navigate to /onboarding/generieren
3. Should show loading state with streaming text
4. After ~30s should show "Plan erstellt!" and redirect button
5. Check DB: SELECT id, "generatedAt" FROM "TrainingPlan";
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/generate.ts app/api/plan/ app/\(onboarding\)/onboarding/generieren/
git commit -m "feat: add Claude plan generation with SSE streaming"
```

---

## Task 10: Plan Display

**Files:**
- Create: `components/plan/CoachAnalysis.tsx`
- Create: `components/plan/WeekCalendar.tsx`
- Create: `components/plan/WeekDetail.tsx`
- Create: `app/(app)/plan/page.tsx`
- Create: `app/(app)/plan/woche/[n]/page.tsx`
- Create: `app/api/plan/route.ts`

- [ ] **Step 1: Create plan API route**

Create `app/api/plan/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan = await prisma.trainingPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { generatedAt: 'desc' },
  })

  return NextResponse.json(plan)
}
```

- [ ] **Step 2: Create CoachAnalysis component**

Create `components/plan/CoachAnalysis.tsx`:

```typescript
interface Props {
  analysis: string
}

export function CoachAnalysis({ analysis }: Props) {
  // Split analysis into sections by looking for keywords
  const sections = analysis.split('\n\n').filter(Boolean)

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-xl font-bold">Deine Analyse</h2>
      {sections.map((section, i) => {
        const isStrength = section.toLowerCase().includes('stärk') || section.toLowerCase().includes('stark')
        const isPriority = section.toLowerCase().includes('priorität') || section.toLowerCase().includes('schwäch')
        const isRunning = section.toLowerCase().includes('lauf') || section.toLowerCase().includes('pace')

        const color = isStrength
          ? 'border-green-500 bg-green-50 dark:bg-green-950'
          : isPriority
          ? 'border-red-500 bg-red-50 dark:bg-red-950'
          : isRunning
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-border bg-muted'

        return (
          <div key={i} className={`border-l-4 p-4 rounded-r-lg ${color}`}>
            <p className="text-sm">{section}</p>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create WeekCalendar component**

Create `components/plan/WeekCalendar.tsx`:

```typescript
'use client'
import { useRouter } from 'next/navigation'

interface Woche {
  nummer: number
  phase: number
  einheiten: Record<string, { typ: string; beschreibung?: string; distanz?: number; pace?: string }>
}

interface Phase {
  nummer: number
  wochenVon: number
  wochenBis: number
  titel: string
  fokus: string
}

interface Props {
  wochen: Woche[]
  phasen: Phase[]
  aktuelleWoche?: number
}

const PHASE_COLORS = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-orange-100 text-orange-800', 'bg-purple-100 text-purple-800']
const TYP_LABELS: Record<string, string> = {
  KOMBI: 'Kombi', LONG_RUN: 'Long Run', GYM: 'Gym', INTERVALL: 'Intervalle', TEMPO: 'Tempo'
}

export function WeekCalendar({ wochen, phasen, aktuelleWoche }: Props) {
  const router = useRouter()

  return (
    <div className="space-y-2">
      {wochen.map((woche) => {
        const phase = phasen.find(p => woche.phase === p.nummer)
        const phaseColor = PHASE_COLORS[(woche.phase - 1) % 4]
        const isAktuell = woche.nummer === aktuelleWoche

        return (
          <button key={woche.nummer} onClick={() => router.push(`/plan/woche/${woche.nummer}`)}
            className={`w-full text-left p-3 rounded-lg border transition-colors hover:border-primary ${isAktuell ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseColor}`}>
                W{woche.nummer}
              </span>
              <div className="flex-1 flex gap-3 text-sm text-muted-foreground">
                {Object.entries(woche.einheiten).map(([tag, einheit]) => (
                  <span key={tag}><span className="font-medium text-foreground">{tag}:</span> {TYP_LABELS[einheit.typ] ?? einheit.typ}</span>
                ))}
              </div>
              <span className="text-muted-foreground text-sm">→</span>
            </div>
            {isAktuell && <div className="text-xs text-primary mt-1 font-medium">← Aktuelle Woche</div>}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create WeekDetail component**

Create `components/plan/WeekDetail.tsx`:

```typescript
interface Einheit {
  typ: string
  beschreibung?: string
  ablauf?: string[]
  distanz?: number
  pace?: string
  uebungen?: string[]
}

interface Props {
  woche: {
    nummer: number
    phase: number
    einheiten: Record<string, Einheit>
  }
}

const TYP_LABELS: Record<string, string> = {
  KOMBI: 'Kombi-Einheit', LONG_RUN: 'Long Run', GYM: 'Kraft & Gym', INTERVALL: 'Intervalle', TEMPO: 'Tempolauf'
}

export function WeekDetail({ woche }: Props) {
  return (
    <div className="space-y-4">
      {Object.entries(woche.einheiten).map(([tag, einheit]) => (
        <div key={tag} className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-sm uppercase text-muted-foreground">{tag}</span>
            <h3 className="font-semibold">{TYP_LABELS[einheit.typ] ?? einheit.typ}</h3>
          </div>
          {einheit.beschreibung && <p className="text-sm text-muted-foreground mb-3">{einheit.beschreibung}</p>}
          {einheit.distanz && <p className="text-sm mb-2">Distanz: {einheit.distanz} km · Pace: {einheit.pace}</p>}
          {einheit.ablauf && einheit.ablauf.length > 0 && (
            <ol className="space-y-1">
              {einheit.ablauf.map((schritt, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-muted-foreground font-mono text-xs mt-0.5">{i + 1}.</span>
                  <span>{schritt}</span>
                </li>
              ))}
            </ol>
          )}
          {einheit.uebungen && einheit.uebungen.length > 0 && (
            <ul className="space-y-1">
              {einheit.uebungen.map((u, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-muted-foreground">•</span><span>{u}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create plan page**

Create `app/(app)/plan/page.tsx`:

```typescript
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { CoachAnalysis } from '@/components/plan/CoachAnalysis'
import { WeekCalendar } from '@/components/plan/WeekCalendar'

export default async function PlanPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const plan = await prisma.trainingPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { generatedAt: 'desc' },
  })

  if (!plan) redirect('/onboarding/profil')

  const content = plan.content as { phasen: any[]; wochen: any[] }

  // Calculate current week number from profile
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  const wettkampfWochen = profile
    ? Math.round((new Date(profile.wettkampfdatum).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
    : 0
  const gesamtWochen = content.wochen.length
  const aktuelleWoche = Math.max(1, gesamtWochen - wettkampfWochen + 1)

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Dein Trainingsplan</h1>
      <CoachAnalysis analysis={plan.coachAnalysis} />
      <h2 className="text-xl font-bold mb-3">20-Wochen-Übersicht</h2>
      <WeekCalendar wochen={content.wochen} phasen={content.phasen} aktuelleWoche={aktuelleWoche} />
    </div>
  )
}
```

- [ ] **Step 6: Create week detail page**

Create `app/(app)/plan/woche/[n]/page.tsx`:

```typescript
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect, notFound } from 'next/navigation'
import { WeekDetail } from '@/components/plan/WeekDetail'
import Link from 'next/link'

export default async function WocheDetailPage({ params }: { params: { n: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const wocheNummer = parseInt(params.n)
  if (isNaN(wocheNummer)) notFound()

  const plan = await prisma.trainingPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { generatedAt: 'desc' },
  })
  if (!plan) redirect('/onboarding/profil')

  const content = plan.content as { phasen: any[]; wochen: any[] }
  const woche = content.wochen.find((w: any) => w.nummer === wocheNummer)
  if (!woche) notFound()

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <Link href="/plan" className="text-sm text-muted-foreground hover:underline mb-4 block">← Zurück zum Plan</Link>
      <h1 className="text-2xl font-bold mb-6">Woche {wocheNummer}</h1>
      <WeekDetail woche={woche} />
    </div>
  )
}
```

- [ ] **Step 7: Manual test**

```
1. After generating a plan, navigate to /plan
2. Should show coach analysis blocks + week list
3. Click on a week → /plan/woche/1 should show week detail
4. Verify week detail shows all training sessions correctly
```

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/plan/ components/plan/ app/api/plan/route.ts
git commit -m "feat: add plan display with coach analysis and week calendar"
```

---

## Task 11: Bestandstest

**Files:**
- Create: `components/bestandstest/TestForm.tsx`
- Create: `components/bestandstest/TestHistory.tsx`
- Create: `app/(app)/bestandstest/page.tsx`
- Create: `app/api/bestandstest/route.ts`

- [ ] **Step 1: Create Bestandstest API**

Create `app/api/bestandstest/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  datum: z.string().datetime(),
  kategorie: z.enum(['AUSDAUER', 'KRAFT', 'MOBILITAET']),
  name: z.string().min(1),
  wert: z.number(),
  einheit: z.string().min(1),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tests = await prisma.bestandsTest.findMany({
    where: { userId: session.user.id },
    orderBy: { datum: 'desc' },
  })
  return NextResponse.json(tests)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const test = await prisma.bestandsTest.create({
    data: { userId: session.user.id, ...parsed.data, datum: new Date(parsed.data.datum) },
  })
  return NextResponse.json(test, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await prisma.bestandsTest.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create TestForm component**

Create `components/bestandstest/TestForm.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const KATEGORIEN = [
  { key: 'AUSDAUER', label: 'Ausdauer' },
  { key: 'KRAFT', label: 'Kraft' },
  { key: 'MOBILITAET', label: 'Mobilität' },
] as const

const VORSCHLAEGE: Record<string, { name: string; einheit: string }[]> = {
  AUSDAUER: [{ name: '5km Lauf', einheit: 'min:sec' }, { name: '10km Lauf', einheit: 'min:sec' }, { name: '1km Pace', einheit: 'min:sec' }],
  KRAFT: [{ name: 'Liegestütze', einheit: 'Wdh.' }, { name: 'Klimmzüge', einheit: 'Wdh.' }, { name: 'Plank', einheit: 'sec' }, { name: 'Kniebeuge', einheit: 'kg' }],
  MOBILITAET: [{ name: 'Sit & Reach', einheit: 'cm' }, { name: 'Thomas-Test L', einheit: 'cm' }, { name: 'Thomas-Test R', einheit: 'cm' }],
}

interface Props { onSaved: () => void }

export function TestForm({ onSaved }: Props) {
  const [kategorie, setKategorie] = useState<'AUSDAUER' | 'KRAFT' | 'MOBILITAET'>('AUSDAUER')
  const [name, setName] = useState('')
  const [einheit, setEinheit] = useState('')
  const [loading, setLoading] = useState(false)

  function selectVorschlag(v: { name: string; einheit: string }) {
    setName(v.name); setEinheit(v.einheit)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await fetch('/api/bestandstest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datum: new Date().toISOString(),
        kategorie,
        name,
        wert: Number(fd.get('wert')),
        einheit,
      }),
    })
    setLoading(false)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
      <h3 className="font-semibold">Neuer Eintrag</h3>
      <div>
        <Label>Kategorie</Label>
        <div className="flex gap-2 mt-1">
          {KATEGORIEN.map(k => (
            <button key={k.key} type="button" onClick={() => { setKategorie(k.key); setName(''); setEinheit('') }}
              className={`px-3 py-1 rounded text-sm border ${kategorie === k.key ? 'bg-primary text-primary-foreground' : 'border-input'}`}>
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Test</Label>
        <div className="flex gap-2 flex-wrap mt-1 mb-2">
          {VORSCHLAEGE[kategorie].map(v => (
            <button key={v.name} type="button" onClick={() => selectVorschlag(v)}
              className={`text-xs px-2 py-1 rounded border ${name === v.name ? 'bg-primary text-primary-foreground' : 'border-input'}`}>
              {v.name}
            </button>
          ))}
        </div>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="oder eigenen Test eingeben" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Wert</Label><Input name="wert" type="number" step="0.01" required /></div>
        <div><Label>Einheit</Label><Input value={einheit} onChange={e => setEinheit(e.target.value)} placeholder="z.B. Wdh." required /></div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Speichern…' : 'Eintragen'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Create TestHistory component**

Create `components/bestandstest/TestHistory.tsx`:

```typescript
'use client'

interface Test {
  id: string
  datum: string
  kategorie: string
  name: string
  wert: number
  einheit: string
}

interface Props {
  tests: Test[]
  onDelete: (id: string) => void
}

function getTrend(tests: Test[], name: string, currentDatum: string): '↑' | '↓' | '→' | null {
  const sameTests = tests.filter(t => t.name === name && t.datum !== currentDatum)
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
  if (!sameTests.length) return null
  const current = tests.find(t => t.name === name && t.datum === currentDatum)?.wert ?? 0
  const prev = sameTests[0].wert
  if (current > prev) return '↑'
  if (current < prev) return '↓'
  return '→'
}

const KATEGORIE_LABEL: Record<string, string> = {
  AUSDAUER: 'Ausdauer', KRAFT: 'Kraft', MOBILITAET: 'Mobilität'
}

export function TestHistory({ tests, onDelete }: Props) {
  const grouped = tests.reduce<Record<string, Test[]>>((acc, t) => {
    acc[t.kategorie] = [...(acc[t.kategorie] ?? []), t]
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([kat, entries]) => (
        <div key={kat}>
          <h3 className="font-semibold mb-2">{KATEGORIE_LABEL[kat] ?? kat}</h3>
          <div className="space-y-2">
            {entries.map(test => {
              const trend = getTrend(tests, test.name, test.datum)
              return (
                <div key={test.id} className="flex items-center gap-3 p-3 border rounded-lg text-sm">
                  <span className="text-muted-foreground text-xs w-20 shrink-0">
                    {new Date(test.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="flex-1 font-medium">{test.name}</span>
                  <span>{test.wert} {test.einheit}</span>
                  {trend && (
                    <span className={trend === '↑' ? 'text-green-600' : trend === '↓' ? 'text-red-600' : 'text-muted-foreground'}>
                      {trend}
                    </span>
                  )}
                  <button onClick={() => onDelete(test.id)} className="text-muted-foreground hover:text-red-500 text-xs ml-1">✕</button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {tests.length === 0 && <p className="text-muted-foreground text-sm">Noch keine Tests eingetragen.</p>}
    </div>
  )
}
```

- [ ] **Step 4: Create Bestandstest page**

Create `app/(app)/bestandstest/page.tsx`:

```typescript
'use client'
import { useEffect, useState, useCallback } from 'react'
import { TestForm } from '@/components/bestandstest/TestForm'
import { TestHistory } from '@/components/bestandstest/TestHistory'

export default function BestandstestPage() {
  const [tests, setTests] = useState<any[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/bestandstest')
    setTests(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm('Eintrag löschen?')) return
    await fetch('/api/bestandstest', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Bestandstest</h1>
      <TestForm onSaved={load} />
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Verlauf</h2>
        <TestHistory tests={tests} onDelete={handleDelete} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Manual test**

```
1. Navigate to /bestandstest
2. Add 3 entries: e.g. 5km Lauf 25:39, Liegestütze 30, Sit & Reach 10
3. Add same tests again with different values
4. Verify trend arrows appear (↑ ↓ →)
5. Delete one entry, verify it disappears
```

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/bestandstest/ components/bestandstest/ app/api/bestandstest/
git commit -m "feat: add Bestandstest with history and trend indicators"
```

---

## Task 12: Dashboard + Navigation

**Files:**
- Create: `app/(app)/dashboard/page.tsx`
- Create: `components/BottomNav.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create BottomNav**

Create `components/BottomNav.tsx`:

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/plan', label: 'Plan', icon: '📅' },
  { href: '/bestandstest', label: 'Tests', icon: '📊' },
  { href: '/profil', label: 'Profil', icon: '👤' },
]

export function BottomNav() {
  const pathname = usePathname()
  const hide = pathname.startsWith('/onboarding') || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname === '/'
  if (hide) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t flex">
      {NAV.map(item => (
        <Link key={item.href} href={item.href}
          className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 ${pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'}`}>
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Add BottomNav to root layout**

In `app/layout.tsx`, add inside `<body>`:

```typescript
import { BottomNav } from '@/components/BottomNav'

// Inside <body> after {children}:
<BottomNav />
```

- [ ] **Step 3: Create Dashboard page**

Create `app/(app)/dashboard/page.tsx`:

```typescript
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [profile, plan, testCount] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.trainingPlan.findFirst({ where: { userId: session.user.id }, orderBy: { generatedAt: 'desc' } }),
    prisma.bestandsTest.count({ where: { userId: session.user.id } }),
  ])

  if (!profile) redirect('/onboarding/profil')
  if (!plan) redirect('/onboarding/generieren')

  const tagesBisHyrox = Math.ceil((new Date(profile.wettkampfdatum).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  const content = plan.content as { wochen: any[] }
  const aktuelleWoche = Math.max(1, content.wochen.length - Math.round(tagesBisHyrox / 7) + 1)

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-1">Hey {session.user.name?.split(' ')[0]} 👋</h1>
      <p className="text-muted-foreground mb-6">Dein Hyrox Dashboard</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary">{tagesBisHyrox}</div>
          <div className="text-sm text-muted-foreground">Tage bis Hyrox</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary">{aktuelleWoche}</div>
          <div className="text-sm text-muted-foreground">Aktuelle Woche</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{testCount}</div>
          <div className="text-sm text-muted-foreground">Bestandstests</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{profile.format}</div>
          <div className="text-sm text-muted-foreground">Format</div>
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/plan"><Button className="w-full" variant="default">Zum Trainingsplan →</Button></Link>
        <Link href="/bestandstest"><Button className="w-full" variant="outline">Bestandstest eintragen</Button></Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Manual test**

```
1. Navigate to /dashboard
2. Verify Tage bis Hyrox, aktuelle Woche, test count render correctly
3. Verify bottom navigation appears and highlights correct tab
4. Verify nav disappears on /onboarding/* and /login pages
```

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/dashboard/ components/BottomNav.tsx app/layout.tsx
git commit -m "feat: add dashboard and bottom navigation"
```

---

## Task 13: Profil Page + Plan Re-Generation

**Files:**
- Create: `app/(app)/profil/page.tsx`
- Create: `app/api/profil/route.ts`

- [ ] **Step 1: Create Profil API (update + delete)**

Create `app/api/profil/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth, signOut } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.user.delete({ where: { id: session.user.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create Profil page**

Create `app/(app)/profil/page.tsx`:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function ProfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRegenerate() {
    setLoading(true)
    router.push('/onboarding/generieren')
  }

  async function handleDelete() {
    if (!confirm('Wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return
    if (!confirm('Bist du sicher? Account und alle Daten werden permanent gelöscht.')) return
    await fetch('/api/profil', { method: 'DELETE' })
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Profil</h1>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Plan</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Neuen 5km-Test gelaufen? Generiere deinen Plan neu mit aktualisierten Paces.
          </p>
          <Button onClick={handleRegenerate} disabled={loading} className="w-full">
            Plan neu generieren
          </Button>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Anmeldung</h2>
          <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" className="w-full">
            Abmelden
          </Button>
        </div>

        <div className="border border-red-200 rounded-lg p-4">
          <h2 className="font-semibold mb-2 text-red-600">Gefahrenzone</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Account und alle Daten permanent löschen.
          </p>
          <Button onClick={handleDelete} variant="destructive" className="w-full">
            Account löschen
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Manual test**

```
1. Navigate to /profil
2. Click "Plan neu generieren" → should go to /onboarding/generieren and create new plan version
3. Verify signOut works → redirects to /
4. Test account deletion (use a test account)
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/profil/ app/api/profil/
git commit -m "feat: add profile page with plan regeneration and account deletion"
```

---

## Task 14: PWA Setup

**Files:**
- Modify: `next.config.ts`
- Create: `public/manifest.json`
- Create: `public/sw.js` (generated by next-pwa)

- [ ] **Step 1: Configure next-pwa**

Replace `next.config.ts`:

```typescript
import type { NextConfig } from 'next'
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig: NextConfig = {
  // your existing config here
}

module.exports = withPWA(nextConfig)
```

- [ ] **Step 2: Create web manifest**

Create `public/manifest.json`:

```json
{
  "name": "Hyrox Plan",
  "short_name": "HyroxPlan",
  "description": "Dein persönlicher KI-Hyrox-Trainingsplan",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Add manifest link to root layout**

In `app/layout.tsx` `<head>`:

```typescript
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#000000" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

- [ ] **Step 4: Copy existing icons**

The existing `icon-192.png` and `icon-512.png` are already in the project root. Move them to `public/`:

```bash
mv icon-192.png public/icon-192.png
mv icon-512.png public/icon-512.png
```

- [ ] **Step 5: Build and verify PWA**

```bash
pnpm build
pnpm start
```

Open Chrome DevTools → Application → Manifest. Should show app manifest. Application → Service Workers should show registered SW.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts public/manifest.json public/icon-*.png app/layout.tsx
git commit -m "feat: configure PWA with next-pwa, manifest, and icons"
```

---

## Task 15: Landing Page + Final Polish

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Create landing page**

Replace `app/page.tsx`:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold mb-3">Hyrox Plan</h1>
        <p className="text-xl text-muted-foreground mb-2">Dein persönlicher KI-Trainingsplan</p>
        <p className="text-muted-foreground mb-8">
          Gib deine Werte ein — Wettkampfdatum, Leistungsstand, verfügbare Trainingstage.
          Claude erstellt dir einen maßgeschneiderten 20-Wochen-Plan.
        </p>
        <div className="space-y-3">
          <Link href="/register"><Button className="w-full" size="lg">Jetzt Plan erstellen</Button></Link>
          <Link href="/login"><Button className="w-full" variant="outline">Bereits registriert? Anmelden</Button></Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Final E2E walkthrough**

```
1. Open http://localhost:3000/
2. Register new account
3. Complete onboarding: Profil → Erfahrung (alle 3 Pfade testen) → Generieren
4. Verify /plan shows coach analysis + week calendar
5. Click a week → verify detail view
6. Go to /bestandstest → add 3+ tests → verify trends
7. Go to /dashboard → verify counters correct
8. Go to /profil → test regenerate
9. Test on mobile viewport (375px) — bottom nav usable
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page — MVP complete"
```

- [ ] **Step 4: Push to GitHub**

```bash
git push -u origin main
```

Expected: Code pushed to `git@github.com:Fitnerd/hyrox-plan.git`

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Onboarding with progressive disclosure (3 paths)
- ✅ 5km Zeit optional
- ✅ Größe nicht abgefragt
- ✅ KI-generierter Plan via Claude API
- ✅ Streaming Coach-Analyse
- ✅ Coach-Analyse → Wochenkalender flow
- ✅ Bestandstest mit Kategorien, Verlauf, Trend-Pfeilen
- ✅ Account-System (Register, Login, Delete)
- ✅ Plan-Regenerierung
- ✅ PWA
- ✅ Ansatz B dokumentiert (in Design Spec)

**Type consistency:**
- `calcPaces()` defined in Task 5, used in Task 9 ✅
- `buildPlanPrompt()` defined in Task 6, used in Task 9 ✅
- `parsePlanResponse()` defined in Task 6, used in Task 9 ✅
- `PlanResponse` schema matches DB schema ✅
- `SplitsForm` interface matches API schema ✅
