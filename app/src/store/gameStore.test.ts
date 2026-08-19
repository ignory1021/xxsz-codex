import { describe, expect, it, vi } from 'vitest'
import { EMPTY_PILL_STOCK } from '../data/gameData'
import { createNewGame, settleAction } from '../core/game'
import { pauseActiveAction, resumeActiveAction, startPlannedAction } from './gameStore'

function gameFixture() {
  return createNewGame({ name: '测试修士', gender: '无定', personality: '豁达' }, 1)
}

describe('automatic action plans', () => {
  it('starts the selected plan when time is running', () => {
    const game = startPlannedAction({
      ...gameFixture(),
      running: true,
      actionPlan: { kind: 'cultivate', difficulty: 'light' },
    }, 1_000)

    expect(game.activeAction).toMatchObject({ kind: 'cultivate', difficulty: 'light', startedAt: 1_000 })
    expect(game.ageMonths).toBe(0)
  })

  it('does not deduct lifespan when starting a longer action', () => {
    const game = startPlannedAction({
      ...gameFixture(),
      running: true,
      ageMonths: 17,
      actionPlan: { kind: 'cultivate', difficulty: 'medium' },
    }, 1_000)

    expect(game.ageMonths).toBe(17)
  })

  it('continues the plan after an action settles', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const started = startPlannedAction({
      ...gameFixture(),
      running: true,
      actionPlan: { kind: 'adventure', difficulty: 'light' },
    }, 1_000)
    const settled = settleAction(started, 'adventure', 'light').game
    const continued = startPlannedAction(settled, 2_000)

    expect(settled.chronicle[0].type).toBe('action')
    expect(continued.activeAction).toMatchObject({ kind: 'adventure', difficulty: 'light', startedAt: 2_000 })
    random.mockRestore()
  })

  it('waits for materials before starting an alchemy plan', () => {
    const game = startPlannedAction({
      ...gameFixture(),
      running: true,
      inventory: { herbs: 1, ore: 0, pills: { ...EMPTY_PILL_STOCK } },
      actionPlan: { kind: 'alchemy', difficulty: 'light' },
    }, 1_000)

    expect(game.activeAction).toBeNull()
  })

  it('waits for an encounter choice before starting the next action', () => {
    const game = startPlannedAction({
      ...gameFixture(),
      running: true,
      actionPlan: { kind: 'cultivate', difficulty: 'light' },
      pendingEncounter: {
        id: 'opportunity-test',
        kind: 'opportunity',
        title: '灵光乍现',
        narrative: '测试剧情。',
      },
    }, 1_000)

    expect(game.activeAction).toBeNull()
  })

  it('does not start another action after reaching great perfection', () => {
    const game = startPlannedAction({
      ...gameFixture(),
      running: true,
      layer: 10,
      perfect: true,
      actionPlan: { kind: 'cultivate', difficulty: 'light' },
    }, 1_000)

    expect(game.activeAction).toBeNull()
    expect(game.running).toBe(false)
  })

  it('freezes an active action while paused and resumes from the same progress', () => {
    const base = {
      ...gameFixture(),
      activeAction: { kind: 'cultivate' as const, difficulty: 'light' as const, startedAt: 1_000, endsAt: 3_000 },
    }
    const paused = pauseActiveAction(base, 1_500)
    const resumed = resumeActiveAction({ ...base, activeAction: paused }, 6_500)

    expect(paused?.pausedAt).toBe(1_500)
    expect(resumed).toMatchObject({ startedAt: 6_000, endsAt: 8_000, pausedAt: undefined })
  })
})
