export function mmSsToSeconds(value: string): number | null {
  if (!value || !value.includes(':')) return null
  const [m, s] = value.split(':').map(Number)
  if (isNaN(m) || isNaN(s)) return null
  return m * 60 + s
}

export function secondsToMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function kmPaceSeconds(fiveKmSeconds: number): number {
  return Math.floor(fiveKmSeconds / 5)
}

export interface Paces {
  easyMin: string
  easyMax: string
  longRunMin: string
  longRunMax: string
  tempo: string
  kombiStart: string
  kombiEnd: string
  ziel5km: string
}

export function calcPaces(fiveKmSeconds: number | null): Paces {
  if (!fiveKmSeconds) {
    return {
      easyMin: '6:30',
      easyMax: '7:00',
      longRunMin: '6:20',
      longRunMax: '6:50',
      tempo: '5:45',
      kombiStart: '6:00',
      kombiEnd: '5:30',
      ziel5km: '5:45',
    }
  }
  const base = kmPaceSeconds(fiveKmSeconds) // e.g. 307s for 25:39
  return {
    easyMin: secondsToMmSs(base + 38),   // 5:07 + 0:38 = 5:45
    easyMax: secondsToMmSs(base + 53),   // 5:07 + 0:53 = 6:00
    longRunMin: secondsToMmSs(base + 28), // 5:07 + 0:28 = 5:35
    longRunMax: secondsToMmSs(base + 48), // 5:07 + 0:48 = 5:55
    tempo: secondsToMmSs(base - 17),      // 5:07 - 0:17 = 4:50
    kombiStart: secondsToMmSs(base - 12), // 5:07 - 0:12 = 4:55
    kombiEnd: secondsToMmSs(base - 32),   // 5:07 - 0:32 = 4:35
    ziel5km: secondsToMmSs(base - 37),    // 5:07 - 0:37 = 4:30
  }
}
