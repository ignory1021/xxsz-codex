import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createInitialPlayer, resolveExplore } from '../core/game'
import type { ActionLog, MapId, Player } from '../core/types'

interface GameStore {
  player: Player
  logs: ActionLog[]
  notice?: string
  explore: (mapId: MapId) => void
  dismissNotice: () => void
  restart: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      player: createInitialPlayer(),
      logs: [],
      notice: undefined,
      explore: (mapId) => {
        set((state) => {
          try {
            const result = resolveExplore(state.player, mapId)

            return {
              player: result.player,
              logs: [result.log, ...state.logs].slice(0, 20),
              notice: undefined,
            }
          } catch (error) {
            return { notice: error instanceof Error ? error.message : '行动结算失败' }
          }
        })
      },
      dismissNotice: () => set({ notice: undefined }),
      restart: () => set({ player: createInitialPlayer(), logs: [], notice: undefined }),
    }),
    { name: 'xxsz-codex-save-v1' },
  ),
)
