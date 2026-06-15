import { describe, it, expect } from 'vitest'
import { calcPaces, secondsToMmSs, mmSsToSeconds } from '@/lib/utils/pace'

describe('mmSsToSeconds', () => {
  it('converts "25:39" to 1539', () => {
    expect(mmSsToSeconds('25:39')).toBe(1539)
  })
  it('returns null for empty string', () => {
    expect(mmSsToSeconds('')).toBeNull()
  })
})

describe('secondsToMmSs', () => {
  it('converts 307 to "5:07"', () => {
    expect(secondsToMmSs(307)).toBe('5:07')
  })
  it('pads seconds below 10', () => {
    expect(secondsToMmSs(300)).toBe('5:00')
  })
})

describe('calcPaces', () => {
  it('calculates paces from 5km time in seconds', () => {
    const paces = calcPaces(1539) // 25:39 = 5:07/km base pace
    expect(paces.easyMin).toBe('5:45')
    expect(paces.easyMax).toBe('6:00')
    expect(paces.longRunMin).toBe('5:35')
    expect(paces.longRunMax).toBe('5:55')
    expect(paces.tempo).toBe('4:50')
    expect(paces.kombiStart).toBe('4:55')
    expect(paces.kombiEnd).toBe('4:35')
  })

  it('returns conservative paces when 5km time is null', () => {
    const paces = calcPaces(null)
    expect(paces.easyMin).toBe('6:30')
    expect(paces.easyMax).toBe('7:00')
  })
})
