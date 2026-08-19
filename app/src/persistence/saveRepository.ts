import { Preferences } from '@capacitor/preferences'
import type { GameData } from '../core/types'

const SAVE_KEY = 'xxsz.save.v1'

export async function loadGame(): Promise<GameData | null> {
  try {
    const { value } = await Preferences.get({ key: SAVE_KEY })
    if (!value) return null
    const parsed = JSON.parse(value) as GameData
    return parsed.schemaVersion === 1 ? parsed : null
  } catch {
    return null
  }
}

export async function saveGame(game: GameData): Promise<void> {
  await Preferences.set({ key: SAVE_KEY, value: JSON.stringify(game) })
}

export async function clearGame(): Promise<void> {
  await Preferences.remove({ key: SAVE_KEY })
}
