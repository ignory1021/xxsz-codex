import { createInitialPlayer, createRoots, maximumHealth, resolveExplore } from './game'
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
})
