#!/bin/bash
set -e

echo "================================================"
echo "  Hyrox Plan — Server Setup"
echo "================================================"
echo ""

# 1. System update
echo ">>> [1/6] System aktualisieren..."
apt update && apt upgrade -y

# 2. Docker
echo ">>> [2/6] Docker installieren..."
curl -fsSL https://get.docker.com | sh

# 3. Node.js + pnpm (für Prisma Migrationen)
echo ">>> [3/6] Node.js + pnpm installieren..."
apt install -y nodejs npm
npm install -g pnpm

# 4. GitHub Deploy Key generieren
echo ">>> [4/6] GitHub Deploy Key generieren..."
ssh-keygen -t ed25519 -C "hyrox-server" -f ~/.ssh/id_ed25519 -N ""
echo ""
echo "========================================================"
echo "  Füge diesen Deploy Key bei GitHub ein:"
echo "  github.com/Fitnerd/hyrox-plan → Settings → Deploy keys"
echo "========================================================"
cat ~/.ssh/id_ed25519.pub
echo "========================================================"
echo ""
read -p "Deploy Key bei GitHub eingetragen? Dann Enter drücken..."

# 5. Repo klonen
echo ">>> [5/6] Repository klonen..."
git clone git@github.com:Fitnerd/hyrox-plan.git
cd hyrox-plan

# 6. .env anlegen
echo ">>> [6/6] .env Datei anlegen..."
cp .env.example .env
echo ""
echo "========================================================"
echo "  Bitte .env jetzt befüllen:"
echo "  nano .env"
echo ""
echo "  Benötigte Werte:"
echo "  - DATABASE_URL     (Supabase Session Pooler, Port 5432)"
echo "  - NEXTAUTH_SECRET  (openssl rand -base64 32)"
echo "  - NEXTAUTH_URL     (http://DEINE-IP:3000)"
echo "  - ANTHROPIC_API_KEY"
echo "  - ENCRYPTION_SECRET (openssl rand -base64 32)"
echo "========================================================"
echo ""
nano .env

# Secrets generieren (Hilfe)
echo ""
echo ">>> Tipp: Secrets generieren mit:"
echo "    openssl rand -base64 32"
echo ""

# Datenbank einrichten
echo ">>> Datenbank einrichten..."
export DATABASE_URL=$(grep '^DATABASE_URL' .env | cut -d '=' -f2-)
pnpm install
pnpm prisma db push

# App starten
echo ">>> App bauen und starten..."
docker compose up -d --build

echo ""
echo "========================================================"
echo "  Setup abgeschlossen!"
echo "  App läuft auf: $(grep 'NEXTAUTH_URL' .env | cut -d '=' -f2-)"
echo "========================================================"
