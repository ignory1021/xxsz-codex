import { describe, expect, it } from 'vitest'
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
    const started = startPlannedAction({
      ...gameFixture(),
      running: true,
      actionPlan: { kind: 'adventure', difficulty: 'light' },
    }, 1_000)
    const settled = settleAction(started, 'adventure', 'light').game
    const continued = startPlannedAction(settled, 2_000)

    expect(settled.chronicle[0].type).toBe('action')
    expect(continued.activeAction).toMatchObject({ kind: 'adventure', difficulty: 'light', startedAt: 2_000 })
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
})
