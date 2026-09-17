import { beginExplore, createInitialPlayer, createRoots, maximumHealth, resolveExplore, resolveExploreEvent, rest } from './game'
import type { RandomSource } from './random'
import { describe, expect, it } from 'vitest'

const sequence = (...values: number[]): RandomSource => {
  let index = 0
  return { next: () => values[index++] ?? 0 }
}

describe('core game rules', () => {
  it('creates five roots with a total value of 25 and no value over 10', () => {
    const roots = createRoots(sequence(...Array(20).fill(0)))

    expect(Object.values(roots).reduce((sum, value) => sum + value, 0)).toBe(25)
    expect(Object.values(roots).every((value) => value >= 1 && value <= 10)).toBe(true)
  })

  it('applies water root and accessory bonuses to maximum health', () => {
    const player = createInitialPlayer(sequence(...Array(20).fill(0)))
    player.roots.水 = 10
    player.equipment.accessoryHealth = 15

    expect(maximumHealth(player)).toBe(131)
  })

  it('settles an exploration with time, costs and materials', () => {
    const player = createInitialPlayer(sequence(...Array(20).fill(0)))
    const result = resolveExplore(player, 'qinglan', sequence(...Array(7).fill(0)))

    expect(result.player.ageDays).toBe(20)
    expect(result.player.resources.spiritStones).toBe(108)
    expect(result.player.resources.stamina).toBe(85)
    expect(result.player.resources.materials['青灵草']).toBeGreaterThan(2)
  })

  it('uses the documented automatic combat formula and rewards a victory', () => {
    const player = createInitialPlayer(sequence(...Array(20).fill(0)))
    player.roots = { 金: 5, 木: 5, 水: 5, 火: 5, 土: 5 }
    const pending = beginExplore(player, 'qinglan', sequence(0, 1, 1, 1, 1, 1, 1, 0.1))
    const result = resolveExploreEvent(pending, 'fight', sequence(0.9))

    expect(result.player.resources.health).toBe(44)
    expect(result.player.resources.spiritStones).toBe(128)
    expect(result.log.detail).toContain('击败')
  })

  it('clears light injury through rest and restores action resources', () => {
    const player = createInitialPlayer(sequence(...Array(20).fill(0)))
    player.resources.stamina = 30
    player.resources.focus = 20
    player.statuses.lightInjury = true
    const result = rest(player, sequence(0))

    expect(result.player.statuses.lightInjury).toBe(false)
    expect(result.player.resources.stamina).toBe(75)
    expect(result.player.resources.focus).toBe(65)
  })
})
