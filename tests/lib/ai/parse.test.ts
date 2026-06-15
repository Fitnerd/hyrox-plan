import { describe, it, expect } from 'vitest'
import { parsePlanResponse } from '@/lib/ai/parse'

const validResponse = {
  coachAnalysis: 'Deine Stärken sind SkiErg und Sled Push.',
  paces: {
    easyMin: '5:45', easyMax: '6:00', longRunMin: '5:35', longRunMax: '5:55',
    tempo: '4:50', kombiStart: '4:55', kombiEnd: '4:35', ziel5km: '4:30',
  },
  stationsPrioritaeten: ['BURPEE', 'SANDBAG', 'ROWING'],
  phasen: [{
    nummer: 1, wochenVon: 1, wochenBis: 3,
    titel: 'Direkteinstieg', fokus: 'Kombi-Einheiten',
  }],
  wochen: [{
    nummer: 1, phase: 1,
    einheiten: {
      MI: { typ: 'KOMBI', beschreibung: 'Kombi-Einheit', ablauf: ['1km @ 4:55/km'] },
      SA: { typ: 'LONG_RUN', distanz: 8, pace: '5:45/km' },
      SO: { typ: 'GYM', uebungen: ['Kniebeuge 3x10'] },
    },
  }],
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
