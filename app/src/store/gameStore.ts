import { create } from 'zustand'
import { DIFFICULTIES, REALMS } from '../data/gameData'
import {
  actionCostMonths,
  applyAge,
  attemptBreakthrough,
  createNewGame,
  normalizeProgress,
  reincarnate,
  resolveEncounter,
  settleAction,
} from '../core/game'
import { advanceMonthClock, calculateOfflineProgress } from '../core/time'
import type {
  ActionKind,
  CharacterDraft,
  Difficulty,
  EncounterChoice,
  GameData,
  GameSpeed,
  OfflineReport,
} from '../core/types'
import { clearGame, loadGame, saveGame } from '../persistence/saveRepository'

interface GameStore {
  game: GameData | null
  hydrated: boolean
  offlineReport: OfflineReport | null
  hydrate: () => Promise<void>
  createCharacter: (draft: CharacterDraft) => void
  tick: (now?: number) => void
  setRunning: (running: boolean) => void
  setSpeed: (speed: GameSpeed) => void
  setIdleMode: (idle: boolean) => void
  setActionPlan: (kind: ActionKind, difficulty: Difficulty) => void
  resolveEncounter: (choice: EncounterChoice) => void
  breakthrough: () => void
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

export function startPlannedAction(game: GameData, now: number): GameData {
  const plan = game.actionPlan
  if (!plan || !game.running || game.phase !== 'playing' || game.activeAction || game.pendingEncounter) return game

  const config = DIFFICULTIES.find((item) => item.id === plan.difficulty)
  if (!config || game.realmIndex < config.unlockRealm) return game
  if (plan.kind === 'alchemy' && game.inventory.herbs < 2) return game

  const aged = applyAge(game, actionCostMonths(plan.difficulty))
  if (aged.phase !== 'playing') return aged

  const durationScale = plan.kind === 'cultivate' ? 0.75 : 1
  return {
    ...aged,
    lastUpdatedAt: now,
    activeAction: { kind: plan.kind, difficulty: plan.difficulty, startedAt: now, endsAt: now + config.durationMs * durationScale },
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  hydrated: false,
  offlineReport: null,

  hydrate: async () => {
    const saved = await loadGame()
    if (!saved) {
      set({ hydrated: true })
      return
    }

    const now = Date.now()
    const elapsed = Math.max(now - saved.lastUpdatedAt, 0)
    let game: GameData = { ...saved, actionPlan: saved.actionPlan ?? null, pendingEncounter: saved.pendingEncounter ?? null, activeAction: null, lastUpdatedAt: now }
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
    set({ game, offlineReport: null })
  },

  tick: (now = Date.now()) => {
    const current = get().game
    if (!current) return
    let game = applyOnlineElapsed(current, now)
    if (game.activeAction && now >= game.activeAction.endsAt && game.phase === 'playing') {
      const settled = settleAction(game, game.activeAction.kind, game.activeAction.difficulty)
      game = settled.game
    }
    game = startPlannedAction(game, now)
    const meaningfulChange = game.ageMonths !== current.ageMonths
      || current.activeAction !== game.activeAction
      || current.chronicle !== game.chronicle
      || current.pendingEncounter !== game.pendingEncounter
      || game.phase !== current.phase
    if (meaningfulChange) persist(game)
    set({ game })
  },

  setRunning: (running) => {
    const current = get().game
    if (!current || current.phase !== 'playing') return
    const now = Date.now()
    const prepared = running
      ? { ...current, running: true, idleMode: false, lastUpdatedAt: now }
      : { ...applyOnlineElapsed(current, now), running: false, idleMode: false }
    const game = startPlannedAction(prepared, now)
    persist(game)
    set({ game })
  },

  setSpeed: (speed) => {
    const current = get().game
    if (!current) return
    const now = Date.now()
    const game = startPlannedAction({ ...applyOnlineElapsed(current, now), speed, idleMode: false }, now)
    persist(game)
    set({ game })
  },

  setIdleMode: (idleMode) => {
    const current = get().game
    if (!current || current.phase !== 'playing') return
    const now = Date.now()
    const game = startPlannedAction({ ...applyOnlineElapsed(current, now), running: idleMode || current.running, idleMode, lastUpdatedAt: now }, now)
    persist(game)
    set({ game })
  },

  setActionPlan: (kind, difficulty) => {
    const current = get().game
    if (!current || current.phase !== 'playing') return
    const config = DIFFICULTIES.find((item) => item.id === difficulty)
    if (!config || current.realmIndex < config.unlockRealm) return
    const now = Date.now()
    const planned = { ...applyOnlineElapsed(current, now), actionPlan: { kind, difficulty } }
    const game = startPlannedAction(planned, now)
    persist(game)
    set({ game })
  },

  resolveEncounter: (choice) => {
    const current = get().game
    if (!current || !current.pendingEncounter) return
    const now = Date.now()
    const resolved = resolveEncounter(current, choice)
    const game = startPlannedAction(resolved, now)
    persist(game)
    set({ game })
  },

  breakthrough: () => {
    const current = get().game
    if (!current || current.activeAction || current.phase !== 'playing') return
    const attempted = attemptBreakthrough(current)
    persist(attempted.game)
    set({ game: attempted.game })
  },

  dismissOfflineReport: () => set({ offlineReport: null }),

  reincarnate: () => {
    const current = get().game
    if (!current || (current.phase !== 'dead' && current.phase !== 'ascended')) return
    const game = reincarnate(current)
    persist(game)
    set({ game, offlineReport: null })
  },

  reset: async () => {
    await clearGame()
    set({ game: null, offlineReport: null })
  },

  persistNow: async () => {
    const game = get().game
    if (game) await saveGame(game)
  },
}))

export function currentRealm(game: GameData) {
  return REALMS[game.realmIndex]
}
