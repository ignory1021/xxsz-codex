import { create } from 'zustand'
import { DIFFICULTIES, EMPTY_PILL_STOCK, PILL_RECIPES, REALMS } from '../data/gameData'
import {
  applyAge,
  attemptBreakthrough,
  createNewGame,
  normalizeProgress,
  pillRecipeById,
  reincarnate,
  resolveEncounter,
  settleAction,
  takePill,
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
  PillId,
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
  setAlchemyRecipe: (recipeId: PillId) => void
  resolveEncounter: (choice: EncounterChoice) => void
  takePill: (recipeId: PillId) => void
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

export function pauseActiveAction(game: GameData, now: number): GameData['activeAction'] {
  if (!game.activeAction || game.activeAction.pausedAt) return game.activeAction
  return { ...game.activeAction, pausedAt: now }
}

export function resumeActiveAction(game: GameData, now: number): GameData['activeAction'] {
  const action = game.activeAction
  if (!action || !action.pausedAt) return action
  const pausedDuration = Math.max(now - action.pausedAt, 0)
  return {
    ...action,
    startedAt: action.startedAt + pausedDuration,
    endsAt: action.endsAt + pausedDuration,
    pausedAt: undefined,
  }
}

export function startPlannedAction(game: GameData, now: number): GameData {
  const plan = game.actionPlan
  if (!plan || !game.running || game.phase !== 'playing' || game.activeAction || game.pendingEncounter) return game
  if (game.perfect) return { ...game, running: false, idleMode: false }

  const config = DIFFICULTIES.find((item) => item.id === plan.difficulty)
  if (!config || game.realmIndex < config.unlockRealm) return game
  const recipe = plan.kind === 'alchemy' ? pillRecipeById(game.alchemyRecipeId) : null
  if (recipe && (game.realmIndex < recipe.unlockRealm || game.inventory.herbs < recipe.herbsCost || game.inventory.ore < recipe.oreCost)) return game

  const durationScale = plan.kind === 'cultivate' ? 0.75 : 1
  return {
    ...game,
    lastUpdatedAt: now,
    activeAction: {
      kind: plan.kind,
      difficulty: plan.difficulty,
      startedAt: now,
      endsAt: now + config.durationMs * durationScale,
      recipeId: recipe?.id,
    },
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
    const savedPills = saved.inventory.pills as unknown
    const pills: GameData['inventory']['pills'] = typeof savedPills === 'number'
      ? { ...EMPTY_PILL_STOCK, peiyuan: savedPills }
      : { ...EMPTY_PILL_STOCK, ...(savedPills as Partial<GameData['inventory']['pills']>) }
    const savedSpeed = saved.speed as unknown
    const speed = savedSpeed === 10 ? 10 : savedSpeed === 5 || savedSpeed === 3 ? 5 : 1
    const alchemyRecipeId = PILL_RECIPES.some((recipe) => recipe.id === saved.alchemyRecipeId)
      ? saved.alchemyRecipeId
      : 'peiyuan'
    let game: GameData = {
      ...saved,
      speed,
      inventory: { ...saved.inventory, pills },
      alchemyRecipeId,
      actionPlan: saved.actionPlan ?? null,
      pendingEncounter: saved.pendingEncounter ?? null,
      activeAction: null,
      recentEncounterIds: saved.recentEncounterIds ?? [],
      lastUpdatedAt: now,
    }
    if (game.perfect) {
      game = { ...game, running: false, idleMode: false }
    }
    let offlineReport: OfflineReport | null = null
    if (game.running && elapsed >= 3_000 && game.phase === 'playing') {
      const calculated = calculateOfflineProgress(elapsed, saved.realmIndex, saved.ageMonths, saved.monthProgress, saved.layer)
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
    if (game.running && game.activeAction && !game.activeAction.pausedAt && now >= game.activeAction.endsAt && game.phase === 'playing') {
      const settled = settleAction(game, game.activeAction.kind, game.activeAction.difficulty, game.activeAction.recipeId)
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
      ? { ...current, running: true, idleMode: false, activeAction: resumeActiveAction(current, now), lastUpdatedAt: now }
      : (() => {
        const progressed = applyOnlineElapsed(current, now)
        return { ...progressed, running: false, idleMode: false, activeAction: pauseActiveAction(progressed, now) }
      })()
    const game = running ? startPlannedAction(prepared, now) : prepared
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
    const progressed = applyOnlineElapsed(current, now)
    const prepared = idleMode
      ? { ...progressed, running: true, idleMode: true, activeAction: resumeActiveAction(progressed, now), lastUpdatedAt: now }
      : { ...progressed, idleMode: false, lastUpdatedAt: now }
    const game = startPlannedAction(prepared, now)
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

  setAlchemyRecipe: (recipeId) => {
    const current = get().game
    const recipe = pillRecipeById(recipeId)
    if (!current || current.phase !== 'playing' || current.realmIndex < recipe.unlockRealm) return
    const now = Date.now()
    const selected = { ...applyOnlineElapsed(current, now), alchemyRecipeId: recipe.id }
    const game = startPlannedAction(selected, now)
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

  takePill: (recipeId) => {
    const current = get().game
    if (!current || current.phase !== 'playing') return
    const taken = takePill(current, recipeId)
    persist(taken.game)
    set({ game: taken.game })
  },

  breakthrough: () => {
    const current = get().game
    if (!current || current.phase !== 'playing') return
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
