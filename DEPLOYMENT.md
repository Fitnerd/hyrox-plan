# Deployment Guide

## Voraussetzungen

- Docker + Docker Compose auf dem Server installiert
- Supabase Projekt angelegt
- Domain (optional, aber empfohlen)

## 1. Supabase Datenbank einrichten

1. [supabase.com](https://supabase.com) → Neues Projekt anlegen
2. **Settings → Database → Connection string → URI** kopieren
3. Das ist deine `DATABASE_URL`

## 2. Umgebungsvariablen vorbereiten

Auf dem Server eine `.env` Datei anlegen (NIE committen):

```bash
cp .env.example .env
# Dann .env mit echten Werten befüllen
```

Werte generieren:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_SECRET  
openssl rand -base64 32
```

## 3. Datenbank migrieren

Einmalig beim ersten Deployment (oder nach Schema-Änderungen):

```bash
docker compose run --rm app sh -c "pnpm prisma migrate deploy"
```

## 4. App starten

```bash
# Bauen und starten
docker compose up -d --build

# Logs prüfen
docker compose logs -f app
```

Die App läuft auf Port 3000. Mit einem Reverse Proxy (nginx, Caddy) auf Port 80/443 forwarden.

## 5. Caddy als Reverse Proxy (empfohlen)

Caddy erledigt HTTPS automatisch. Beispiel `Caddyfile`:

```
deine-domain.com {
    reverse_proxy localhost:3000
}
```

## Updates deployen

```bash
git pull
docker compose up -d --build
```

## Umgebungsvariablen Übersicht

| Variable | Beschreibung | Generieren |
|---|---|---|
| `DATABASE_URL` | Supabase Connection String | Supabase Dashboard |
| `NEXTAUTH_SECRET` | JWT Signing Key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | z.B. `https://hyrox.deine-domain.com` |
| `ANTHROPIC_API_KEY` | Claude API Key | console.anthropic.com |
| `ENCRYPTION_SECRET` | Key Encryption (AI Provider Feature) | `openssl rand -base64 32` |
