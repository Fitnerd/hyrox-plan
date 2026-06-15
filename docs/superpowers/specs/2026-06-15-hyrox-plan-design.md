# Hyrox Plan — Design Spec
_2026-06-15_

## Ziel

Eine Next.js Web-App (PWA) die es jedem ermöglicht, nach Eingabe seiner persönlichen Werte einen KI-generierten, personalisierten Hyrox-Trainingsplan zu erhalten und seinen Bestandstest-Fortschritt zu tracken.

## Scope (MVP)

**In Scope:**
- Onboarding mit progressiver Dateneingabe
- KI-generierter Trainingsplan (Coach-Analyse + Wochenkalender)
- Bestandstest erfassen und Verlauf anzeigen
- Account-System (Registrierung, Login, Profil)
- PWA (offline lesbar)

**Out of Scope (V2):**
- Trainingseinheiten abhaken / Tracking
- Ernährungsplan
- Regenerations-Tab
- Statistiken / Charts

## Tech Stack

| Schicht | Technologie |
|---|---|
| Frontend | Next.js 15 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes / Server Actions |
| Auth | NextAuth.js v5 (Email/Password + optional Google) |
| Datenbank | PostgreSQL via Prisma ORM |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Hosting | Eigener Server (Docker) oder Railway/Render |
| PWA | next-pwa, offline-fähig nach erstem Laden |

### Alternativer Ansatz für später (Ansatz B)

React (Vite) als separates Frontend-Repo + Express.js REST API. Gleiche DB- und Auth-Logik, aber getrennte Deployments. Empfohlen wenn:
- Mehrere Frontends (Web + native App) dieselbe API nutzen sollen
- Der AI-Service unabhängig skalieren soll
- Das Team wächst und Repo-Trennung sinnvoll wird

## Datenmodell

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  profile      Profile?
  races        PreviousRace[]
  plans        TrainingPlan[]
  tests        BestandsTest[]
}

model Profile {
  id               String   @id @default(cuid())
  userId           String   @unique
  alter            Int
  gewicht          Float
  wettkampfdatum   DateTime
  format           Format   // SOLO | DOUBLES
  trainingstage    String[] // ["MO", "MI", "SA", "SO"]
  andereAktivitaeten String? // Freitext, z.B. "Frisbee 2x/Woche"
  fuenfKmZeit      Int?     // Sekunden, optional
}

model PreviousRace {
  id          String   @id @default(cuid())
  userId      String
  gesamtzeit  Int      // Sekunden
  format      Format
  splits      Split[]
}

model Split {
  id            String   @id @default(cuid())
  raceId        String
  station       Station  // SKIERG | SLED_PUSH | SLED_PULL | BURPEE | ROWING | FARMERS | SANDBAG | WALLBALLS
  zeit          Int      // Sekunden
  platzierung   Int?     // optional
}

model TrainingPlan {
  id             String   @id @default(cuid())
  userId         String
  generatedAt    DateTime @default(now())
  coachAnalysis  String   // KI-Freitext (gestreamt)
  paces          Json     // { easy, longRun, tempo, kombi, ziel }
  content        Json     // Phasen → Wochen → Tage
  stationsPrios  String[] // Reihenfolge der 8 Stationen
}

model BestandsTest {
  id        String   @id @default(cuid())
  userId    String
  datum     DateTime
  kategorie Kategorie // AUSDAUER | KRAFT | MOBILITAET
  name      String   // z.B. "5km Lauf", "Liegestütze"
  wert      Float
  einheit   String   // "min:sec" | "Wdh." | "cm" | "kg"
}

enum Format    { SOLO DOUBLES }
enum Station   { SKIERG SLED_PUSH SLED_PULL BURPEE ROWING FARMERS SANDBAG WALLBALLS }
enum Kategorie { AUSDAUER KRAFT MOBILITAET }
```

## Onboarding-Flow

### Schritt 1 — Profil (für alle)
- Alter, Gewicht
- Wettkampfdatum
- Format (Solo / Doubles)
- Trainingstage (Tage-Buttons: Mo–So, Mehrfachauswahl)
- Andere Sportarten (Freitext, optional)
- 5km Testzeit (optional — wenn leer schätzt Claude konservativ)

_Größe wird nicht abgefragt (kein Einfluss auf Plan)._

### Schritt 2 — Erfahrung (3 Pfade)

**🟢 Erster Hyrox**
→ Direkt zu Schritt 3. Plan basiert auf 5km-Test und Trainingsstruktur.

**🟡 Ja — nur Gesamtzeit bekannt**
→ Gesamtzeit + Format eingeben. Claude schätzt Schwachstellen nach typischen Mustern.

**🔵 Ja — Splits bekannt**
→ Alle 8 Stations-Zeiten eingeben (Platzierungen optional). Präziseste Schwachstellenanalyse.
→ "Überspringen"-Button falls man mittendrin abbricht.

### Schritt 3 — Generierung
- Ladescreen mit Status ("Analysiere deine Daten…", "Erstelle Trainingsplan…")
- Coach-Analyse wird gestreamt (SSE) — User sieht sofort Text
- Danach: Button "Zum vollständigen Plan"

## KI-Logik

### Prompt-Input (an Claude)
```
Profildaten: Alter, Gewicht, Format, Wochen bis Wettkampf (auto-berechnet),
Trainingstage, andere Aktivitäten, 5km-Zeit (oder "unbekannt")

Erfahrungspfad A: Keine Vorjahreswerte
Erfahrungspfad B: Gesamtzeit [X] im Format [Y]
Erfahrungspfad C: Splits [Station: Zeit, Platz?] × 8
```

### Strukturierter Output (Claude Tool Use)
```json
{
  "coachAnalysis": "Freitext — Stärken, Schwächen, Strategie",
  "paces": {
    "easy": "5:45–6:00/km",
    "longRun": "5:35–5:55/km",
    "tempo": "4:45–4:50/km",
    "kombi": "4:55–4:35/km",
    "ziel5km": "4:30/km"
  },
  "stationsPrioritaeten": ["BURPEE", "SANDBAG", "ROWING", "..."],
  "phasen": [
    { "nummer": 1, "wochen": [1, 3], "titel": "Direkteinstieg Kombi", "fokus": "..." }
  ],
  "wochen": [
    {
      "nummer": 1,
      "phase": 1,
      "einheiten": {
        "MI": { "typ": "KOMBI", "beschreibung": "...", "ablauf": [...] },
        "SA": { "typ": "LONG_RUN", "distanz": 8, "pace": "5:45/km" },
        "SO": { "typ": "GYM", "uebungen": [...] }
      }
    }
  ]
}
```

### Re-Generierung
User kann jederzeit neuen 5km-Test eintragen → neuer Plan wird generiert und als neue Version gespeichert (alter Plan bleibt als Archiv erhalten).

### Kosten
Ca. 2–4 Cent pro Plan-Generierung bei claude-sonnet-4-6.

## App-Struktur (Next.js Routes)

```
/                        Landing Page (CTA: Plan erstellen)
/auth/register           Registrierung
/auth/login              Login

/onboarding/profil       Schritt 1: Persönliche Daten
/onboarding/erfahrung    Schritt 2: Hyrox-Erfahrung (3 Pfade)
/onboarding/generieren   Schritt 3: Streaming Coach-Analyse

/dashboard               Übersicht: Tage bis Hyrox, aktuelle Woche, letzter Test
/plan                    Coach-Analyse + Wochenkalender
/plan/woche/[n]          Detailansicht einer Woche
/bestandstest            Tests erfassen + Verlauf
/profil                  Daten ändern, Plan neu generieren, Account löschen
```

## Plan-Darstellung

1. **Coach-Analyse** (gestreamt beim ersten Laden, dann gecacht)
   - Stärken-Block (grün)
   - Priorität-1-Block (rot) — schwächste Station
   - Laufpace-Ziel-Block (blau)
   - Button: "Zum vollständigen Plan →"

2. **Wochenkalender** (nach Klick)
   - Phasen-Timeline oben (farblich: Phase 1–4)
   - Wochen-Liste mit klickbaren Einträgen
   - Klick auf Woche → Detailansicht mit Mi/Sa/So-Einheiten
   - Andere Tage (Frisbee, Physio, Ruhe) kommen aus Profil

## Bestandstest

- Kategorien: Ausdauer / Kraft / Mobilität
- Eintrag: Datum, Test-Name (Freitext oder aus Vorschlagsliste), Wert + Einheit
- Verlauf: Einträge chronologisch, Trend-Pfeil (↑ ↓ →) basierend auf letzten 2 Werten
- Löschbar (mit Bestätigung)

## PWA

- `next-pwa` mit Service Worker
- Installierbar auf Android + iOS Homescreen
- Offline: Plan und Bestandstest-Verlauf lesbar (gecacht)
- Neue Bestandstest-Einträge werden lokal gespeichert und beim nächsten Online-Gang sync't

## .gitignore

```
PROJEKT.md        ← persönliche Projektnotizen, nicht für die Allgemeinheit
.superpowers/     ← Brainstorming-Mockups
.env.local
.env
```
