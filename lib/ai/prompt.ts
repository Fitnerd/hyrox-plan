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
    ? `5km-Testzeit: ${secondsToMmSs(profile.fuenfKmZeit)} (${secondsToMmSs(Math.floor(profile.fuenfKmZeit / 5))}/km)`
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
