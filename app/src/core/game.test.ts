import { describe, expect, it, vi } from 'vitest'
import { EMPTY_PILL_STOCK } from '../data/gameData'
import { applyAge, attemptBreakthrough, createNewGame, lifespanYears, normalizeProgress, qiRequirement, realmQiMultiplier, resolveEncounter, settleAction, takePill } from './game'
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

describe('action balance', () => {
  it('keeps the three action durations available from qi refining', () => {
    const game = settleAction(gameFixture(), 'cultivate', 'heavy').game
    expect(game.chronicle[0].title).toBe('吐纳归元')
  })

  it('scales the same action with the current realm', () => {
    expect(realmQiMultiplier(0)).toBe(1)
    expect(realmQiMultiplier(2)).toBe(2)
    expect(realmQiMultiplier(5)).toBe(300)
  })

  it('makes a successful adventure-and-alchemy loop exceed two pure actions', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const base = {
      ...gameFixture(),
      character: {
        ...gameFixture().character,
        spiritRoot: { name: '三灵根', elements: ['金', '木', '水'], aptitude: 6, structureMultiplier: 1 },
      },
      inventory: { herbs: 0, ore: 0, pills: { ...EMPTY_PILL_STOCK } },
    }
    const afterAdventure = settleAction(base, 'adventure', 'heavy').game
    const adventure = afterAdventure.chronicle[0]
    const alchemy = settleAction(afterAdventure, 'alchemy', 'heavy', 'peiyuan').result
    const cultivation = settleAction(base, 'cultivate', 'heavy').result

    expect(afterAdventure.inventory).toMatchObject({ herbs: 3, ore: 1 })
    expect(adventure.text).toContain('灵气 +180')
    expect(alchemy.rewards).toContain('灵气 +150')
    expect(180 + 150 + 100).toBeGreaterThan(200 * 2)
    expect(cultivation.rewards).toContain('灵气 +200')
    random.mockRestore()
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
    const game = settleAction({ ...gameFixture(), inventory: { herbs: 2, ore: 0, pills: { ...EMPTY_PILL_STOCK } } }, 'alchemy', 'light').game

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
    const game = takePill({ ...gameFixture(), inventory: { herbs: 0, ore: 0, pills: { ...EMPTY_PILL_STOCK, peiyuan: 1 } } }).game
    expect(game.inventory.pills.peiyuan).toBe(0)
    expect(game.layer).toBe(2)
    expect(game.qi).toBe(0)
    expect(game.chronicle[0].title).toBe('服用培元丹')
  })

  it('does not consume a Peiyuan pill during breakthrough', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const game = attemptBreakthrough({
      ...gameFixture(),
      layer: 10,
      perfect: true,
      inventory: { herbs: 0, ore: 0, pills: { ...EMPTY_PILL_STOCK, peiyuan: 1 } },
    }).game

    expect(game.realmIndex).toBe(1)
    expect(game.inventory.pills.peiyuan).toBe(1)
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

  it('unlocks and brews the Gold Core purification recipe independently from Peiyuan pills', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const crafted = settleAction({
      ...gameFixture(),
      realmIndex: 2,
      alchemyRecipeId: 'jinsui',
      inventory: { herbs: 4, ore: 2, pills: { ...EMPTY_PILL_STOCK } },
    }, 'alchemy', 'light', 'jinsui').game
    const taken = takePill({
      ...gameFixture(),
      realmIndex: 2,
      character: {
        ...gameFixture().character,
        spiritRoot: { name: '三灵根', elements: ['金', '木', '水'], aptitude: 6, structureMultiplier: 1 },
      },
      inventory: { herbs: 0, ore: 0, pills: { ...EMPTY_PILL_STOCK, jinsui: 1 } },
    }, 'jinsui').game

    expect(crafted.inventory.pills.jinsui).toBe(1)
    expect(taken.character.spiritRoot.elements).toHaveLength(2)
    random.mockRestore()
  })

  it('stores a breakthrough bonus until the next manual attempt', () => {
    const prepared = takePill({
      ...gameFixture(),
      realmIndex: 6,
      inventory: { herbs: 0, ore: 0, pills: { ...EMPTY_PILL_STOCK, hedao: 1 } },
    }, 'hedao').game
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.2)
    const attempted = attemptBreakthrough({ ...prepared, layer: 10, perfect: true }).game

    expect(prepared.breakthroughBonus).toBe(0.15)
    expect(attempted.breakthroughBonus).toBe(0)
    expect(attempted.realmIndex).toBe(7)
    random.mockRestore()
  })

  it('grants forty percent additional qi while a companion joins the action', () => {
    const base = gameFixture()
    const companion = {
      soulId: 'companion-test',
      name: '顾长风',
      title: '负剑游人',
      personality: '豪迈' as const,
      affection: 20,
      metInLife: 1,
      memory: '',
    }
    const solo = settleAction(base, 'cultivate', 'light').game
    const together = settleAction({ ...base, friends: [companion], companionSoulId: companion.soulId }, 'cultivate', 'light', 'peiyuan', companion.soulId).game

    expect(together.qi).toBe(solo.qi + Math.max(1, Math.round(solo.qi * 0.4)))
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
