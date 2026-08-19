import { create } from 'zustand'
import { DIFFICULTIES, REALMS } from '../data/gameData'
import {
  actionCostMonths,
  applyAge,
  attemptBreakthrough,
  createNewGame,
  normalizeProgress,
  reincarnate,
  settleAction,
} from '../core/game'
import { advanceMonthClock, calculateOfflineProgress } from '../core/time'
import type {
  ActionKind,
  ActionResult,
  CharacterDraft,
  Difficulty,
  GameData,
  GameSpeed,
  OfflineReport,
} from '../core/types'
import { clearGame, loadGame, saveGame } from '../persistence/saveRepository'

interface GameStore {
  game: GameData | null
  hydrated: boolean
  result: ActionResult | null
  offlineReport: OfflineReport | null
  hydrate: () => Promise<void>
  createCharacter: (draft: CharacterDraft) => void
  tick: (now?: number) => void
  setRunning: (running: boolean) => void
  setSpeed: (speed: GameSpeed) => void
  setIdleMode: (idle: boolean) => void
  beginAction: (kind: ActionKind, difficulty: Difficulty) => void
  breakthrough: () => void
  dismissResult: () => void
  dismissOfflineReport: () => void
  reincarnate: () => void
  reset: () => Promise<void>
  persistNow: () => Promise<void>
}

function persist(game: GameData): void {
  void saveGame(game)
}

function applyOnlineElapsed(game: GameData, now: number): GameData {
  const elapsed = Math.max(now - game.lastUpdatedAt, 0)
  if (!game.running || game.phase !== 'playing') return { ...game, lastUpdatedAt: now }
  const clock = advanceMonthClock(elapsed, game.idleMode ? 1 : game.speed, game.monthProgress)
  const aged = applyAge({ ...game, monthProgress: clock.progress, lastUpdatedAt: now }, clock.months)
  return aged
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  hydrated: false,
  result: null,
  offlineReport: null,

  hydrate: async () => {
    const saved = await loadGame()
    if (!saved) {
      set({ hydrated: true })
      return
    }

    const now = Date.now()
    const elapsed = Math.max(now - saved.lastUpdatedAt, 0)
    let game: GameData = { ...saved, activeAction: null, lastUpdatedAt: now }
    let offlineReport: OfflineReport | null = null
    if (saved.running && elapsed >= 3_000 && saved.phase === 'playing') {
      const calculated = calculateOfflineProgress(elapsed, saved.realmIndex, saved.ageMonths, saved.monthProgress)
      offlineReport = calculated
      game = normalizeProgress({ ...game, qi: game.qi + calculated.qiGained, monthProgress: calculated.progress })
      game = applyAge(game, calculated.advancedMonths)
    }
    persist(game)
    set({ game, hydrated: true, offlineReport })
  },

  createCharacter: (draft) => {
    const game = createNewGame(draft)
    persist(game)
    set({ game, result: null, offlineReport: null })
  },

  tick: (now = Date.now()) => {
    const current = get().game
    if (!current) return
    let game = applyOnlineElapsed(current, now)
    let result: ActionResult | null = null
    if (game.activeAction && now >= game.activeAction.endsAt && game.phase === 'playing') {
      const settled = settleAction(game, game.activeAction.kind, game.activeAction.difficulty)
      game = settled.game
      result = settled.result
    }
    const meaningfulChange = game.ageMonths !== current.ageMonths || current.activeAction !== game.activeAction || result !== null || game.phase !== current.phase
    if (meaningfulChange) persist(game)
    set({ game, ...(result ? { result } : {}) })
  },

  setRunning: (running) => {
    const current = get().game
    if (!current || current.phase !== 'playing') return
    const now = Date.now()
    const game = running ? { ...current, running: true, idleMode: false, lastUpdatedAt: now } : { ...applyOnlineElapsed(current, now), running: false, idleMode: false }
    persist(game)
    set({ game })
  },

  setSpeed: (speed) => {
    const current = get().game
    if (!current) return
    const now = Date.now()
    const game = { ...applyOnlineElapsed(current, now), speed, idleMode: false }
    persist(game)
    set({ game })
  },

  setIdleMode: (idleMode) => {
    const current = get().game
    if (!current || current.phase !== 'playing') return
    const now = Date.now()
    const game = { ...applyOnlineElapsed(current, now), running: idleMode || current.running, idleMode, lastUpdatedAt: now }
    persist(game)
    set({ game })
  },

  beginAction: (kind, difficulty) => {
    const current = get().game
    if (!current || !current.running || current.phase !== 'playing' || current.activeAction) return
    const config = DIFFICULTIES.find((item) => item.id === difficulty)
    if (!config || current.realmIndex < config.unlockRealm) return
    const aged = applyAge(current, actionCostMonths(difficulty))
    if (aged.phase !== 'playing') {
      persist(aged)
      set({ game: aged })
      return
    }
    const now = Date.now()
    const durationScale = kind === 'cultivate' ? 0.75 : 1
    const game: GameData = {
      ...aged,
      lastUpdatedAt: now,
      activeAction: { kind, difficulty, startedAt: now, endsAt: now + config.durationMs * durationScale },
    }
    persist(game)
    set({ game, result: null })
  },

  breakthrough: () => {
    const current = get().game
    if (!current || current.activeAction || current.phase !== 'playing') return
    const attempted = attemptBreakthrough(current)
    persist(attempted.game)
    set({ game: attempted.game, result: attempted.result })
  },

  dismissResult: () => set({ result: null }),
  dismissOfflineReport: () => set({ offlineReport: null }),

  reincarnate: () => {
    const current = get().game
    if (!current || (current.phase !== 'dead' && current.phase !== 'ascended')) return
    const game = reincarnate(current)
    persist(game)
    set({ game, result: null, offlineReport: null })
  },

  reset: async () => {
    await clearGame()
    set({ game: null, result: null, offlineReport: null })
  },

  persistNow: async () => {
    const game = get().game
    if (game) await saveGame(game)
  },
}))

export function currentRealm(game: GameData) {
  return REALMS[game.realmIndex]
}
