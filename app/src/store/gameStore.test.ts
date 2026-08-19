import { describe, expect, it, vi } from 'vitest'
import { createNewGame, settleAction } from '../core/game'
import { startPlannedAction } from './gameStore'

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
      inventory: { herbs: 1, ore: 0, pills: 0 },
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
})
