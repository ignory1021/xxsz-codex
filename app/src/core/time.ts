import { REALMS } from '../data/gameData'
import type { GameSpeed, OfflineReport } from './types'

export const MONTH_MS_AT_X1 = 1_000

export function advanceMonthClock(
  elapsedMs: number,
  speed: GameSpeed,
  previousProgress: number,
): { months: number; progress: number } {
  const total = previousProgress + (elapsedMs * speed) / MONTH_MS_AT_X1
  const months = Math.floor(total)
  return { months, progress: total - months }
}

export function effectiveOfflineMs(elapsedMs: number): number {
  const hours = elapsedMs / 3_600_000
  const first = Math.min(hours, 1)
  const second = Math.min(Math.max(hours - 1, 0), 5)
  const third = Math.min(Math.max(hours - 6, 0), 18)
  const rest = Math.max(hours - 24, 0)
  return (first + second * 0.8 + third * 0.5 + rest * 0.3) * 3_600_000
}

export function calculateOfflineProgress(
  elapsedMs: number,
  realmIndex: number,
  ageMonths: number,
  monthProgress: number,
  layer = 1,
): OfflineReport & { progress: number } {
  const realm = REALMS[realmIndex]
  const total = monthProgress + effectiveOfflineMs(elapsedMs) / MONTH_MS_AT_X1
  const rawMonths = Math.floor(total)
  const capMonths = realm.offlineCapYears * 12
  const lifespanMonths = (realm.lifespanYears + (layer - 1) * realm.lifespanLayerGainYears) * 12
  const remainingMonths = Math.max(lifespanMonths - ageMonths, 0)
  const advancedMonths = Math.min(rawMonths, capMonths, remainingMonths)
  const died = advancedMonths >= remainingMonths && remainingMonths > 0
  const qiGained = Math.floor(advancedMonths * 2)

  return {
    elapsedMs,
    advancedMonths,
    qiGained,
    capped: rawMonths > capMonths,
    died,
    progress: advancedMonths === rawMonths ? total - rawMonths : 0,
  }
}

export function formatAge(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  return months === 0 ? `${years}年` : `${years}年${months}月`
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return '片刻'
  const hours = Math.floor(minutes / 60)
  if (hours < 1) return `${minutes}分钟`
  return `${hours}小时${minutes % 60 ? `${minutes % 60}分` : ''}`
}
