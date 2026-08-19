import { FRIEND_NAMES, PERSONALITIES, ROOT_ELEMENTS } from '../data/gameData'
import type { Friend, SpiritRoot } from './types'

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function generateSpiritRoot(): SpiritRoot {
  const roll = Math.random()
  const count = roll < 0.08 ? 1 : roll < 0.32 ? 2 : roll < 0.68 ? 3 : roll < 0.9 ? 4 : 5
  const elements = [...ROOT_ELEMENTS].sort(() => Math.random() - 0.5).slice(0, count)
  const aptitude = count === 1 ? randomInt(9, 10) : randomInt(2, 9)
  const multipliers: Record<number, number> = { 1: 1.5, 2: 1.2, 3: 1, 4: 0.75, 5: 0.5 }
  const label = count === 1 && aptitude >= 9 ? `天${elements[0]}灵根` : count === 5 ? '五行杂灵根' : `${count === 2 ? '双' : count === 3 ? '三' : '四'}灵根`

  return {
    name: label,
    elements,
    aptitude,
    structureMultiplier: multipliers[count],
  }
}

export function generateFriend(life: number): Friend {
  const name = pick(FRIEND_NAMES)
  return {
    soulId: `${name}-${Date.now()}-${randomInt(100, 999)}`,
    name,
    title: pick(['山中散修', '药庐弟子', '负剑游人', '观星客']),
    personality: pick(PERSONALITIES),
    affection: 10,
    metInLife: life,
    memory: '初见时山风正好，彼此只道了一声珍重。',
  }
}
