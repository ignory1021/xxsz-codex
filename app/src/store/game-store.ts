import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { beginExplore, createInitialPlayer, resolveExploreEvent, rest } from '../core/game'
import type { ActionLog, ExploreChoice, MapId, PendingExplore, Player } from '../core/types'

interface GameStore {
  player: Player
  logs: ActionLog[]
  pendingExplore?: PendingExplore
  notice?: string
  explore: (mapId: MapId) => void
  resolveExplore: (choice?: ExploreChoice) => void
  rest: () => void
  dismissNotice: () => void
  restart: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      player: createInitialPlayer(),
      logs: [],
      pendingExplore: undefined,
      notice: undefined,
      explore: (mapId) => {
        set((state) => {
          try {
            const pendingExplore = beginExplore(state.player, mapId)
            if (pendingExplore.event === 'harvest' || pendingExplore.event === 'calm') {
              const result = resolveExploreEvent(pendingExplore)
              return { player: result.player, logs: [result.log, ...state.logs].slice(0, 100), notice: undefined }
            }

            return {
              pendingExplore,
              notice: undefined,
            }
          } catch (error) {
            return { notice: error instanceof Error ? error.message : '行动结算失败' }
          }
        })
      },
      resolveExplore: (choice = '') => set((state) => {
        if (!state.pendingExplore) return { notice: '没有待结算的探索事件' }
        const result = resolveExploreEvent(state.pendingExplore, choice)
        return { player: result.player, logs: [result.log, ...state.logs].slice(0, 100), pendingExplore: undefined, notice: undefined }
      }),
      rest: () => set((state) => {
        const result = rest(state.player)
        return { player: result.player, logs: [result.log, ...state.logs].slice(0, 100), notice: undefined }
      }),
      dismissNotice: () => set({ notice: undefined }),
      restart: () => set({ player: createInitialPlayer(), logs: [], pendingExplore: undefined, notice: undefined }),
    }),
    {
      name: 'xxsz-codex-save-v1',
      version: 2,
      merge: (persistedState, currentState) => {
        const stored = persistedState as Partial<GameStore>
        const storedPlayer = stored.player
        if (!storedPlayer) return currentState
        return {
          ...currentState,
          ...stored,
          player: {
            ...currentState.player,
            ...storedPlayer,
            resources: { ...currentState.player.resources, ...storedPlayer.resources, materials: { ...currentState.player.resources.materials, ...storedPlayer.resources?.materials } },
            equipment: { ...currentState.player.equipment, ...storedPlayer.equipment },
            statuses: { ...currentState.player.statuses, ...storedPlayer.statuses },
          },
        }
      },
    },
  ),
)
