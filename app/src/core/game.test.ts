import { describe, expect, it, vi } from 'vitest'
import { applyAge, attemptBreakthrough, createNewGame, lifespanYears, normalizeProgress, qiRequirement, resolveEncounter, settleAction, takePill } from './game'
import { generateFriend, generateSpiritRoot } from './random'

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

  it('pauses the automatic plan as soon as great perfection is reached', () => {
    const game = normalizeProgress({
      ...gameFixture(),
      layer: 10,
      qi: 500,
      running: true,
      idleMode: true,
      activeAction: { kind: 'cultivate', difficulty: 'light', startedAt: 1, endsAt: 2 },
    })

    expect(game.perfect).toBe(true)
    expect(game.running).toBe(false)
    expect(game.activeAction).toBeNull()
  })
})

describe('lifespan', () => {
  it('enters death settlement at the realm lifespan', () => {
    const game = applyAge(gameFixture(), 70 * 12)
    expect(game.phase).toBe('dead')
    expect(game.running).toBe(false)
    expect(game.ageMonths).toBe(70 * 12)
  })

  it('increases the lifespan cap for every small layer', () => {
    expect(lifespanYears({ ...gameFixture(), layer: 2 })).toBe(78)
    expect(lifespanYears({ ...gameFixture(), realmIndex: 1, layer: 2 })).toBe(166)
  })

  it('does not move age backwards when a lost layer lowers the lifespan cap', () => {
    const game = applyAge({ ...gameFixture(), layer: 1, ageMonths: 80 * 12 }, 0)
    expect(game.phase).toBe('dead')
    expect(game.ageMonths).toBe(80 * 12)
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

  it('does not repeat an opportunity from the previous three encounters', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = settleAction(gameFixture(), 'cultivate', 'light').game
    const firstId = first.pendingEncounter?.opportunity?.id
    const afterFirst = resolveEncounter(first, 'leave')
    const second = settleAction(afterFirst, 'cultivate', 'light').game

    expect(first.pendingEncounter?.kind).toBe('opportunity')
    expect(second.pendingEncounter?.kind).toBe('opportunity')
    expect(second.pendingEncounter?.opportunity?.id).not.toBe(firstId)
    expect(second.recentEncounterIds).toHaveLength(2)
    random.mockRestore()
  })

  it('can trigger an opportunity after a completed alchemy action', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = settleAction({ ...gameFixture(), inventory: { herbs: 2, ore: 0, pills: 0 } }, 'alchemy', 'light').game

    expect(game.pendingEncounter?.kind).toBe('opportunity')
    random.mockRestore()
  })
})

describe('friend generation', () => {
  it('uses a surname and given-name pool without repeating a known name', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = generateFriend(1)
    const second = generateFriend(1, [first.name])

    expect(first.name).not.toBe(second.name)
    expect(first.name.length).toBeGreaterThanOrEqual(2)
    expect(second.name.length).toBeGreaterThanOrEqual(2)
    random.mockRestore()
  })
})

describe('pills and breakthrough', () => {
  it('consumes a Peiyuan pill for its documented qi gain', () => {
    const game = takePill({ ...gameFixture(), inventory: { herbs: 0, ore: 0, pills: 1 } }).game
    expect(game.inventory.pills).toBe(0)
    expect(game.qi).toBe(50)
    expect(game.chronicle[0].title).toBe('服用培元丹')
  })

  it('does not consume a Peiyuan pill during breakthrough', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = attemptBreakthrough({
      ...gameFixture(),
      layer: 10,
      perfect: true,
      inventory: { herbs: 0, ore: 0, pills: 1 },
    }).game

    expect(game.realmIndex).toBe(1)
    expect(game.inventory.pills).toBe(1)
    random.mockRestore()
  })

  it('allows a great-perfection breakthrough even when an old active action is present', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = attemptBreakthrough({
      ...gameFixture(),
      layer: 10,
      perfect: true,
      running: true,
      actionPlan: { kind: 'cultivate', difficulty: 'light' },
      activeAction: { kind: 'cultivate', difficulty: 'light', startedAt: 1, endsAt: 2 },
    }).game

    expect(game.realmIndex).toBe(1)
    expect(game.activeAction).toBeNull()
    expect(game.running).toBe(true)
    random.mockRestore()
  })
})

describe('reincarnation spirit roots', () => {
  it('keeps the next life within the documented variation around the prior life', () => {
    const previous = { name: '双灵根', elements: ['金', '木'], aptitude: 6, structureMultiplier: 1.2 }
    const next = generateSpiritRoot(previous)

    expect(next.elements.length).toBeGreaterThanOrEqual(1)
    expect(next.elements.length).toBeLessThanOrEqual(3)
    expect(next.aptitude).toBeGreaterThanOrEqual(4)
    expect(next.aptitude).toBeLessThanOrEqual(8)
  })
})
