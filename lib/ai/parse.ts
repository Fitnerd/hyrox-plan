import { z } from 'zod'

const EinheitSchema = z.object({
  typ: z.enum(['KOMBI', 'LONG_RUN', 'GYM', 'INTERVALL', 'TEMPO']),
  beschreibung: z.string().optional(),
  ablauf: z.array(z.string()).optional(),
  distanz: z.number().optional(),
  pace: z.string().optional(),
  uebungen: z.array(z.string()).optional(),
})

const PlanSchema = z.object({
  coachAnalysis: z.string().min(1),
  paces: z.object({
    easyMin: z.string(), easyMax: z.string(),
    longRunMin: z.string(), longRunMax: z.string(),
    tempo: z.string(), kombiStart: z.string(),
    kombiEnd: z.string(), ziel5km: z.string(),
  }),
  stationsPrioritaeten: z.array(z.string()).min(1),
  phasen: z.array(z.object({
    nummer: z.number(),
    wochenVon: z.number(),
    wochenBis: z.number(),
    titel: z.string(),
    fokus: z.string(),
  })).min(1),
  wochen: z.array(z.object({
    nummer: z.number(),
    phase: z.number(),
    einheiten: z.object({
      MI: EinheitSchema.optional(),
      SA: EinheitSchema.optional(),
      SO: EinheitSchema.optional(),
    }),
  })).min(1),
})

export type PlanResponse = z.infer<typeof PlanSchema>

export function parsePlanResponse(raw: unknown): PlanResponse {
  return PlanSchema.parse(raw)
}
