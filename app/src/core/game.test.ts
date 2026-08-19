import { describe, expect, it } from 'vitest'
import { applyAge, createNewGame, normalizeProgress, qiRequirement } from './game'

function gameFixture() {
  return createNewGame({ name: '测试修士', gender: '无定', personality: '豁达' }, 1)
}

describe('realm progression', () => {
  it('uses the documented qi thresholds', () => {
    expect(qiRequirement(0, 1, false)).toBe(100)
    expect(qiRequirement(0, 9, false)).toBe(300)
    expect(qiRequirement(0, 10, false)).toBe(500)
  })

  it('carries excess qi into the next layer', () => {
    const game = normalizeProgress({ ...gameFixture(), qi: 130 })
    expect(game.layer).toBe(2)
    expect(game.qi).toBe(30)
  })

  it('reaches great perfection after the tenth-layer threshold', () => {
    const game = normalizeProgress({ ...gameFixture(), layer: 10, qi: 500 })
    expect(game.perfect).toBe(true)
    expect(game.qi).toBe(0)
  })
})

describe('lifespan', () => {
  it('enters death settlement at the realm lifespan', () => {
    const game = applyAge(gameFixture(), 70 * 12)
    expect(game.phase).toBe('dead')
    expect(game.running).toBe(false)
    expect(game.ageMonths).toBe(70 * 12)
  })
})
