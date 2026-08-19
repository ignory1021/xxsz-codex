import { FRIEND_NAMES, PERSONALITIES, ROOT_ELEMENTS } from '../data/gameData'
import type { Friend, SpiritRoot } from './types'

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function createSpiritRoot(count: number, aptitude: number): SpiritRoot {
  const elements = [...ROOT_ELEMENTS].sort(() => Math.random() - 0.5).slice(0, count)
  const multipliers: Record<number, number> = { 1: 1.5, 2: 1.2, 3: 1, 4: 0.75, 5: 0.5 }
  const labels: Record<number, string> = { 1: '单', 2: '双', 3: '三', 4: '四', 5: '五行杂' }
  const label = count === 1 && aptitude >= 9 ? `天${elements[0]}灵根` : `${labels[count]}灵根`

  return {
    name: label,
    elements,
    aptitude,
    structureMultiplier: multipliers[count],
  }
}

export function generateSpiritRoot(previous?: SpiritRoot): SpiritRoot {
  if (!previous) {
    const roll = Math.random()
    const count = roll < 0.12 ? 1 : roll < 0.4 ? 2 : roll < 0.75 ? 3 : roll < 0.95 ? 4 : 5
    const aptitude = count === 1 ? randomInt(9, 10) : randomInt(4, 9)
    return createSpiritRoot(count, aptitude)
  }

  const roll = Math.random()
  const shift = roll < 0.2 ? -1 : roll < 0.8 ? 0 : 1
  const count = Math.min(5, Math.max(1, previous.elements.length + shift))
  const aptitude = Math.min(10, Math.max(3, previous.aptitude + randomInt(-2, 2)))
  return createSpiritRoot(count, aptitude)
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
