import { mapById } from '../data/maps'
import { clamp, randomInt, systemRandom, type RandomSource } from './random'
import { realms, type ActionLog, type Element, type ExploreResult, type MapId, type Player, type Roots } from './types'

const elements: readonly Element[] = ['金', '木', '水', '火', '土']
const realmBaseHealth: Record<(typeof realms)[number], number> = { 练气: 90, 筑基: 140, 金丹: 210, 元婴: 300, 化神: 420, 炼虚: 580, 合体: 780, 大乘: 1040, 渡劫: 1360 }

export function createRoots(random: RandomSource = systemRandom): Roots {
  const roots: Roots = { 金: 1, 木: 1, 水: 1, 火: 1, 土: 1 }
  for (let point = 0; point < 20; point += 1) {
    const candidates = elements.filter((element) => roots[element] < 10)
    const selected = candidates[Math.floor(random.next() * candidates.length)]
    roots[selected] += 1
  }
  return roots
}

export function createInitialPlayer(random: RandomSource = systemRandom): Player {
  return { name: '沈青岚', realm: '练气', level: 1, alchemyExperience: 0, ageDays: 0, lifespanDays: 50 * 360, roots: createRoots(random), resources: { spiritStones: 120, stamina: 100, focus: 100, health: 90, materials: {} }, equipment: { weaponAttack: 6, armorDefense: 6, accessoryHealth: 0 } }
}

export function maximumHealth(player: Player): number {
  const base = realmBaseHealth[player.realm] + player.equipment.accessoryHealth
  return Math.round(base * (1 + (player.roots.水 - 5) * 0.05))
}

export function resolveExplore(player: Player, mapId: MapId, random: RandomSource = systemRandom): ExploreResult {
  const map = mapById.get(mapId)
  if (!map) throw new Error('地图不存在')
  if (player.resources.spiritStones < map.travelCost) throw new Error('灵石不足')
  if (player.resources.stamina < map.staminaCost) throw new Error('体力不足')
  const [minimumDays, maximumDays] = map.actionTier === '基础' ? [20, 40] : map.actionTier === '中阶' ? [40, 80] : [60, 120]
  const durationDays = randomInt(random, minimumDays, maximumDays)
  const extraMaterialChance = clamp(0.3 + clamp((player.roots.木 - 5) * 0.04, -0.18, 0.24), 0, 1)
  const extraQuantityChance = clamp(0.1 + clamp((player.roots.木 - 5) * 0.03, -0.14, 0.18), 0, 1)
  const materials = { ...player.resources.materials }
  for (const material of map.materials) {
    const extraMaterial = random.next() < extraMaterialChance ? 1 : 0
    const extraQuantity = random.next() < extraQuantityChance ? 1 : 0
    materials[material] = (materials[material] ?? 0) + 2 + extraMaterial + extraQuantity
  }
  const nextPlayer: Player = { ...player, ageDays: player.ageDays + durationDays, resources: { ...player.resources, spiritStones: player.resources.spiritStones - map.travelCost, stamina: player.resources.stamina - map.staminaCost, health: Math.min(player.resources.health, maximumHealth(player)), materials } }
  const materialDetail = map.materials.map((material) => `${material} +${materials[material] - (player.resources.materials[material] ?? 0)}`).join('、')
  const log: ActionLog = { id: `explore-${nextPlayer.ageDays}-${map.id}`, title: `探索 · ${map.name}`, detail: `行程 ${durationDays} 天，${materialDetail}。后续将接入地图事件与妖物遭遇。`, ageDays: nextPlayer.ageDays }
  return { player: nextPlayer, log, durationDays }
}
