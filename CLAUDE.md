# Hyrox Plan — Claude Guidelines

## Git-Workflow

Jedes neue Feature oder jede Bugfix-Arbeit läuft über einen Feature-Branch:

1. **Worktree anlegen** (isolierter Workspace, kein Branch-Wechsel nötig):
   ```bash
   git worktree add .worktrees/feature/<name> -b feature/<name>
   ```
   Worktrees liegen unter `.worktrees/` (in `.gitignore`).

2. **Arbeiten und committen** im Worktree unter `.worktrees/feature/<name>`

3. **Merge in main:**
   ```bash
   git merge feature/<name> --no-ff
   git push origin main
   ```

4. **Worktree aufräumen:**
   ```bash
   git worktree remove .worktrees/feature/<name>
   git branch -d feature/<name>
   ```

**Niemals direkt auf `main` committen** — immer über einen Feature-Branch.

PRs werden mit `gh pr create` erstellt, bevor in main gemergt wird.

---

## Tech Stack

- **Framework:** Next.js 15 App Router (route groups: `(auth)`, `(onboarding)`, `(app)`)
- **Datenbank:** PostgreSQL via Supabase, Prisma v7 mit `@prisma/adapter-pg`
- **Auth:** NextAuth v5 (beta), JWT-Strategie
- **AI:** Anthropic / Gemini / OpenAI — provider-agnostisch via `lib/ai/client.ts`
- **Styling:** Tailwind CSS v4, shadcn/ui (manuell installiert)
- **Deployment:** Docker + Hetzner, `output: 'standalone'`

## Wichtige Konventionen

- **Prisma v7:** URL nur in `prisma.config.ts`, nicht in `schema.prisma`. Adapter-Pattern in `lib/db/prisma.ts`.
- **Edge Runtime:** Middleware (`middleware.ts`) importiert aus `lib/auth/middleware.ts` — kein Prisma, kein bcrypt.
- **API Keys:** Verschlüsselt mit AES-256 via `lib/crypto/encrypt.ts`, `ENCRYPTION_SECRET` aus Env.
- **Supabase:** Session Pooler (Port 5432) für App + `prisma db push`. Transaction Pooler (6543) hängt.
- **pnpm:** Bei neuen Paketen mit nativen Binaries `pnpm approve-builds` auf dem Server ausführen.

## Secrets — niemals committen

- `.env`, `.env.local`
- `PROJEKT.md`
- `.claude/`
