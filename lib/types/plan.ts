export interface PlanPace {
  easyMin: string; easyMax: string
  longRunMin: string; longRunMax: string
  tempo: string; kombiStart: string; kombiEnd: string
  ziel5km: string
}

export interface PlanPhase {
  nummer: number; wochenVon: number; wochenBis: number
  titel: string; fokus: string
}

export interface PlanEinheit {
  typ: string
  beschreibung?: string
  ablauf?: unknown[]
  distanz?: number
  pace?: string
  uebungen?: unknown[]
}

export interface PlanWoche {
  nummer: number
  phase: number
  einheiten: Record<string, PlanEinheit>
}

export interface PlanContent {
  phasen: PlanPhase[]
  wochen: PlanWoche[]
}
