# Hyrox Plan — TODOs

## Deployment

- [ ] Supabase PostgreSQL Datenbank anlegen (supabase.com → neues Projekt → Connection String kopieren)
- [ ] `DATABASE_URL` in Hosting-Plattform als Umgebungsvariable setzen
- [ ] `NEXTAUTH_SECRET` generieren (`openssl rand -base64 32`) und als Umgebungsvariable setzen
- [ ] `NEXTAUTH_URL` setzen (z.B. `https://deine-domain.com`)
- [ ] `pnpm prisma migrate deploy` auf dem Server ausführen
- [ ] App Icons erstellen und in `public/icons/` ablegen (192×192 und 512×512 PNG)
- [ ] App deployen (Railway, Render oder eigener Server)

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
