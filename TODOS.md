# Hyrox Plan — TODOs

## Deployment

Deployment-Anleitung: siehe [DEPLOYMENT.md](./DEPLOYMENT.md)

- [ ] Supabase Projekt anlegen und `DATABASE_URL` kopieren
- [ ] `.env` Datei auf dem Server anlegen (Vorlage: `.env.example`)
- [ ] `NEXTAUTH_SECRET` generieren: `openssl rand -base64 32`
- [ ] `ENCRYPTION_SECRET` generieren: `openssl rand -base64 32`
- [ ] `ANTHROPIC_API_KEY` eintragen (console.anthropic.com)
- [ ] Erste Migration: `docker compose run --rm app sh -c "pnpm prisma migrate deploy"`
- [ ] App starten: `docker compose up -d --build`
- [ ] Reverse Proxy einrichten (Caddy empfohlen — übernimmt HTTPS automatisch)
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
