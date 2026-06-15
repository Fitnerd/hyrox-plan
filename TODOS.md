# Hyrox Plan — TODOs

## Woche 2026-06-15

Konsolidiert aus den wöchentlichen Reviews vom 2026-06-15:
[Security-Review](./reviews/2026-06-15-weekly-security-review.md) und
[Code-Review](./reviews/2026-06-15-weekly-code-review.md).

### Security-Review (nach Schweregrad)

**🟡 Mittel**

- [ ] **M-1: API-Key-Verschlüsselung auf AES-256-GCM umstellen** (authentifizierte Verschlüsselung, Format z. B. `iv:authTag:ciphertext`). Dabei L-1 (zufälliges, pro-Datensatz gespeichertes Salt) und L-4 (Format-/Eingabevalidierung in `decrypt()`) miterledigen. Migrationspfad für bereits gespeicherte CBC-Keys mitbedenken. *Vor Produktivnutzung des AI-Key-Features.* — `lib/crypto/encrypt.ts` (Z. 6, 9–24) — Security M-1 / L-1 / L-4
- [ ] **M-2: Generische Client-Fehlermeldung statt rohem `err.message`** über SSE senden; Detailmeldung nur serverseitig loggen (Information Disclosure). — `app/api/plan/generate/route.ts` (Z. 21–27) — Security M-2
- [ ] **M-3: Auf stabile NextAuth-v5-Version aktualisieren**, sobald verfügbar; bis dahin exakt gepinnt lassen und Advisories beobachten. — `package.json` (Z. 38, `next-auth: 5.0.0-beta.31`) — Security M-3

**🔵 Niedrig**

- [ ] **L-2: Optional Rate-Limiting / neutrale Antworten auf Auth-Endpunkten** gegen User-/E-Mail-Enumeration (`409 "Email already registered"`). — `app/api/auth/register/route.ts` (Z. 18), `lib/auth/config.ts` — Security L-2
- [ ] **L-3: Explizite Session-Lebensdauer setzen** (`maxAge`/`updateAge`, z. B. 7 Tage) statt NextAuth-Default von 30 Tagen. — `lib/auth/config.ts` (Z. 15) — Security L-3
- [ ] **L-5: `pnpm audit --prod` manuell ausführen** und High/Critical-Findings bewerten (Shell stand im Review-Lauf nicht zur Verfügung). — Dependencies / `package.json` — Security L-5

### Code-Review (priorisiert)

**Hoch**

- [ ] **Krypto härten:** `lib/crypto/encrypt.ts` auf AES-256-GCM mit Auth-Tag umstellen, Format-Validierung in `decrypt()` ergänzen, Roundtrip-/Fehler-Tests hinzufügen (überschneidet sich mit Security M-1). — `lib/crypto/encrypt.ts` — Code-Review Hoch #1
- [ ] **Offene Verifikation abschließen:** `pnpm audit`; prüfen ob `PROJEKT.md` trotz `.gitignore` in der Git-History getrackt ist (`git ls-files | grep -i PROJEKT.md`, `git log --oneline -- PROJEKT.md`, ggf. `git rm --cached`); Secret-Scan; `git diff --stat` für nicht committete Worktree-Änderungen. — Code-Review Hoch #2 / „Offene Verifikation"

**Mittel**

- [ ] **SSE-Parser-Bug beheben:** Unvollständige Zeilen über `reader.read()`-Grenzen hinweg puffern (String-Puffer, an `\n\n` splitten, Rest behalten). Sonst können `[DONE]`/`__PLAN_SAVED__`-Marker verloren gehen und die UI hängt im Status „generating". — `app/(onboarding)/onboarding/generieren/page.tsx` (Z. 32–33) — Code-Review Mittel #3
- [ ] **Provider-Routen entduplizieren:** Die byte-identischen Routen in einen gemeinsamen Handler extrahieren (z. B. `lib/api/saveProvider.ts`). — `app/api/onboarding/provider/route.ts` & `app/api/settings/provider/route.ts` — Code-Review Mittel #4
- [ ] **Generische Client-Fehlermeldung** in `plan/generate` (überschneidet sich mit Security M-2). — `app/api/plan/generate/route.ts` (Z. 22–26) — Code-Review Mittel #5
- [ ] **Test-Lücken schließen:** Krypto-Tests (Roundtrip + Fehlerfälle) und mind. Smoke-Tests für das `auth()`-Gating der API-Routen sowie AI-Client-Streaming ergänzen. — `tests/lib/...`, `lib/crypto/encrypt.ts` — Code-Review Mittel #6

**Niedrig**

- [ ] **`tool_choice` erzwingen** für Anthropic (`{ type: 'tool', name: 'save_plan' }`) und OpenAI (`{ type: 'function', function: { name: 'save_plan' } }`), damit der `save_plan`-Tool-Aufruf zuverlässig erfolgt. — `lib/ai/client.ts` (Z. 71, 131) — Code-Review Niedrig #7
- [ ] **Negativ-Guard in `secondsToMmSs`** (`Math.max(0, …)`) gegen fehlerhaftes Format bei negativen Werten. — `lib/utils/pace.ts` (Z. 8–12) — Code-Review Niedrig #8
- [ ] **Rate-Limiting / Enumeration-Härtung** bei `register` für später vormerken (überschneidet sich mit Security L-2). — `app/api/auth/register/route.ts` — Code-Review Niedrig #9

---

## Deployment

Deployment-Anleitung: siehe [DEPLOYMENT.md](./DEPLOYMENT.md)

- [ ] Supabase Projekt anlegen und `DATABASE_URL` kopieren
- [ ] `.env` Datei auf dem Server anlegen (Vorlage: `.env.example`)
- [ ] `NEXTAUTH_SECRET` generieren: `openssl rand -base64 32`
- [ ] `ENCRYPTION_SECRET` generieren: `openssl rand -base64 32`
- [ ] `ANTHROPIC_API_KEY` eintragen (console.anthropic.com)
- [ ] Erste Migration: `docker compose run --rm app sh -c "pnpm prisma migrate deploy"`
- [ ] App starten: `docker compose up -d --build`
- [ ] Reverse Proxy + HTTPS einrichten:
  - Domain kaufen und DNS auf Server-IP zeigen lassen
  - Caddy installieren (`apt install caddy`)
  - `Caddyfile` anlegen: `deine-domain.com { reverse_proxy localhost:3000 }`
  - Caddy übernimmt SSL-Zertifikat automatisch (Let's Encrypt)
  - `NEXTAUTH_URL` in `.env` auf `https://deine-domain.com` aktualisieren
  - Container neu starten: `docker compose up -d`
- [ ] App Icons erstellen und in `public/icons/` ablegen (192×192 und 512×512 PNG)

---

## Feature: AI Provider Wahl

User soll beim Start seinen KI-Anbieter wählen können (Anthropic, Google Gemini, OpenAI) und
einen eigenen API-Key eintragen. Das soll später im Profil änderbar bleiben.

### Datenbank
- [ ] `aiProvider` Feld zu `User` hinzufügen (Enum: `ANTHROPIC | GEMINI | OPENAI`)
- [ ] `aiApiKey` Feld zu `User` hinzufügen (String, verschlüsselt gespeichert)
- [ ] Prisma Migration erstellen

### Backend
- [ ] `@google/generative-ai` SDK installieren (für Gemini)
- [ ] `openai` SDK installieren (für OpenAI)
- [ ] `lib/ai/client.ts` erstellen — gibt basierend auf User-Provider den richtigen Client zurück
- [ ] `lib/ai/generate.ts` umbauen — nutzt User-Provider + Key statt hardcoded Anthropic
- [ ] Prompt-Adapter für Gemini und OpenAI (Tool Use Syntax unterscheidet sich je nach Anbieter)
- [ ] API-Key Verschlüsselung serverseitig (`crypto` AES-256, Key aus `ENCRYPTION_SECRET` Env-Var)
- [ ] `ENCRYPTION_SECRET` zu Deployment-Todos hinzufügen
- [ ] `POST /api/settings/provider` Route erstellen (Provider + Key speichern)

### Onboarding
- [ ] Provider-Auswahl Schritt hinzufügen (nach Registrierung, vor Profil)
  - Anthropic Claude (beste Planqualität, API Key erforderlich)
  - Google Gemini (kostenlos nutzbar, API Key erforderlich — kostenloser Tier verfügbar)
  - OpenAI GPT-4 (API Key erforderlich)
- [ ] Link zu den jeweiligen API-Key-Seiten der Anbieter anzeigen
- [ ] Onboarding Flow anpassen: `/onboarding/provider` als neuer Schritt 1

### Profil-Seite
- [ ] Provider + Key Anzeige im Profil (Key nur maskiert: `sk-...****`)
- [ ] "Provider ändern" Button → bearbeiten Dialog

---

## Nice-to-have (V2)

- [ ] Trainingseinheiten abhaken / Tracking
- [ ] Google OAuth Login (NextAuth Google Provider)
- [ ] Plan-Versionshistorie anzeigen (aktuell nur neueste Version sichtbar)
