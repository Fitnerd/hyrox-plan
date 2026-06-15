import { describe, it, expect } from 'vitest'
import { buildPlanPrompt } from '@/lib/ai/prompt'

const basePaces = {
  easyMin: '5:45', easyMax: '6:00', longRunMin: '5:35',
  longRunMax: '5:55', tempo: '4:50', kombiStart: '4:55',
  kombiEnd: '4:35', ziel5km: '4:30',
}

const baseProfile = {
  alter: 35,
  gewicht: 93,
  format: 'DOUBLES' as const,
  wettkampfWochen: 20,
  trainingstage: ['MO', 'MI', 'SA', 'SO'],
  andereAktivitaeten: 'Ultimate Frisbee Mo + Do',
  fuenfKmZeit: 1539,
  paces: basePaces,
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
