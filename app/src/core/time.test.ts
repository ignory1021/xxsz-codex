import { describe, expect, it } from 'vitest'
import { advanceMonthClock, calculateOfflineProgress, effectiveOfflineMs, formatAge } from './time'

describe('month clock', () => {
  it('advances one month every three seconds at x1', () => {
    expect(advanceMonthClock(3_000, 1, 0)).toEqual({ months: 1, progress: 0 })
  })

  it('keeps fractional month progress across ticks', () => {
    const first = advanceMonthClock(1_500, 1, 0)
    const second = advanceMonthClock(1_500, 1, first.progress)
    expect(first).toEqual({ months: 0, progress: 0.5 })
    expect(second).toEqual({ months: 1, progress: 0 })
  })

  it('applies x3 and x5 to age without changing the unit', () => {
    expect(advanceMonthClock(1_000, 3, 0).months).toBe(1)
    expect(advanceMonthClock(600, 5, 0).months).toBe(1)
  })
})

describe('offline progress', () => {
  it('uses the documented weighted efficiency for ten hours', () => {
    expect(effectiveOfflineMs(10 * 3_600_000)).toBe(7 * 3_600_000)
  })

  it('caps a ten-hour absence to thirty years in qi refining', () => {
    const report = calculateOfflineProgress(10 * 3_600_000, 0, 0, 0)
    expect(report.advancedMonths).toBe(30 * 12)
    expect(report.capped).toBe(true)
    expect(report.died).toBe(false)
  })

  it('never advances beyond the remaining lifespan', () => {
    const report = calculateOfflineProgress(60 * 60_000, 0, 69 * 12, 0)
    expect(report.advancedMonths).toBe(12)
    expect(report.died).toBe(true)
  })

  it('includes small-realm lifespan gains in the remaining lifespan', () => {
    const report = calculateOfflineProgress(60 * 60_000, 0, 70 * 12, 0, 2)
    expect(report.advancedMonths).toBe(8 * 12)
    expect(report.died).toBe(true)
  })
})

describe('age display', () => {
  it('formats whole and partial years', () => {
    expect(formatAge(24)).toBe('2年')
    expect(formatAge(31)).toBe('2年7月')
  })
})
