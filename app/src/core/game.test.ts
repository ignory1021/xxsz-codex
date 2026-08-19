import { describe, expect, it } from 'vitest'
import { applyAge, createNewGame, normalizeProgress, qiRequirement, resolveEncounter, settleAction } from './game'

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

describe('action records', () => {
  it('writes completed actions into the chronicle', () => {
    const game = settleAction(gameFixture(), 'cultivate', 'light').game
    expect(game.chronicle[0]).toMatchObject({ type: 'action', title: '吐纳归元' })
  })
})

describe('encounter choices', () => {
  it('records the selected way of meeting a friend and preserves its affinity range', () => {
    const game = resolveEncounter({
      ...gameFixture(),
      actionPlan: { kind: 'adventure', difficulty: 'light' },
      pendingEncounter: {
        id: 'friend-test',
        kind: 'friend',
        title: '山水相逢',
        narrative: '测试剧情。',
        friend: {
          soulId: 'friend-test',
          name: '顾长风',
          title: '负剑游人',
          personality: '豪迈',
          affection: 0,
          metInLife: 1,
          memory: '',
        },
      },
    }, 'challenge')

    expect(game.pendingEncounter).toBeNull()
    expect(game.friends).toHaveLength(1)
    expect(game.friends[0].affection).toBeGreaterThanOrEqual(-50)
    expect(game.friends[0].affection).toBeLessThanOrEqual(-15)
    expect(game.chronicle[0].type).toBe('friend')
  })
})
