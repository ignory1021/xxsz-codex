import { mapById } from '../data/maps'
import { clamp, randomInt, systemRandom, type RandomSource } from './random'
import { realms, type ActionLog, type DerivedStats, type Element, type ExploreChoice, type ExploreEventType, type ExploreResult, type MapId, type PendingExplore, type Player, type Realm, type Roots } from './types'

const elements: readonly Element[] = ['金', '木', '水', '火', '土']
const realmStats: Record<Realm, { attack: number; defense: number; health: number }> = {
  练气: { attack: 8, defense: 6, health: 90 }, 筑基: { attack: 18, defense: 15, health: 140 }, 金丹: { attack: 35, defense: 30, health: 210 }, 元婴: { attack: 65, defense: 55, health: 300 }, 化神: { attack: 110, defense: 95, health: 420 }, 炼虚: { attack: 180, defense: 160, health: 580 }, 合体: { attack: 280, defense: 255, health: 780 }, 大乘: { attack: 420, defense: 390, health: 1040 }, 渡劫: { attack: 640, defense: 600, health: 1360 },
}

export const realmRank = (realm: Realm) => realms.indexOf(realm)

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
  return {
    name: '沈青岚', realm: '练气', level: 1, perfected: false, alchemyExperience: 0, ageDays: 0, lifespanDays: 50 * 360, roots: createRoots(random),
    resources: { spiritStones: 120, stamina: 100, focus: 100, health: 90, materials: {} }, equipment: { weaponAttack: 6, armorDefense: 6, accessoryHealth: 0 },
    statuses: { lightInjury: false, heavyInjury: false, attackBonusActions: 0, defenseBonusActions: 0, healthBonusActions: 0, harvestBonusActions: 0 },
  }
}

export function rootScale(player: Player): number {
  return 1 + 0.08 * realmRank(player.realm) + 0.02 * (player.level - 1)
}

export function derivedStats(player: Player, companion = false): DerivedStats {
  const scale = rootScale(player)
  const base = realmStats[player.realm]
  const injury = player.statuses.heavyInjury ? 0.7 : 1
  const attackMultiplier = (1 + (player.roots.金 - 5) * 0.035 * scale) * (player.statuses.attackBonusActions > 0 ? 1.15 : 1) * (companion ? 1.08 : 1) * injury
  const defenseMultiplier = (1 + (player.roots.土 - 5) * 0.035 * scale) * (player.statuses.defenseBonusActions > 0 ? 1.15 : 1) * (companion ? 1.08 : 1) * injury
  const healthMultiplier = (1 + (player.roots.水 - 5) * 0.05 * scale) * (player.statuses.healthBonusActions > 0 ? 1.2 : 1)
  const materialChance = clamp(0.3 + clamp((player.roots.木 - 5) * 0.04 * scale, -0.18, 0.24) + (player.statuses.harvestBonusActions > 0 ? 0.25 : 0), 0, 1) * injury
  const quantityChance = clamp(0.1 + clamp((player.roots.木 - 5) * 0.03 * scale, -0.14, 0.18) + (player.statuses.harvestBonusActions > 0 ? 0.1 : 0), 0, 1) * injury
  return { attack: Math.round((base.attack + player.equipment.weaponAttack) * attackMultiplier), defense: Math.round((base.defense + player.equipment.armorDefense) * defenseMultiplier), maximumHealth: Math.round((base.health + player.equipment.accessoryHealth) * healthMultiplier), materialChance, quantityChance }
}

export const maximumHealth = (player: Player) => derivedStats(player).maximumHealth
export const canEnterMap = (player: Player, mapId: MapId) => realmRank(player.realm) >= realmRank(mapById.get(mapId)!.realm)

const eventFor = (random: RandomSource): ExploreEventType => {
  const roll = random.next()
  if (roll < 0.1) return 'friend'
  if (roll < 0.4) return 'battle'
  if (roll < 0.55) return 'harvest'
  if (roll < 0.65) return 'merchant'
  if (roll < 0.75) return 'ruin'
  return 'calm'
}

const log = (title: string, detail: string, ageDays: number, important = false): ActionLog => ({ id: `${title}-${ageDays}-${Math.random().toString(36).slice(2, 7)}`, title, detail, ageDays, important })
const changeMaterial = (materials: Record<string, number>, material: string, amount: number) => ({ ...materials, [material]: (materials[material] ?? 0) + amount })

export function beginExplore(player: Player, mapId: MapId, random: RandomSource = systemRandom): PendingExplore {
  const map = mapById.get(mapId)
  if (!map) throw new Error('地图不存在')
  if (!canEnterMap(player, mapId)) throw new Error(`需达到${map.realm}方可进入`)
  const staminaCost = map.staminaCost + (player.statuses.lightInjury ? 5 : 0)
  if (player.resources.spiritStones < map.travelCost) throw new Error(`灵石不足，还需 ${map.travelCost - player.resources.spiritStones} 灵石`)
  if (player.resources.stamina < staminaCost) throw new Error(`体力不足，还需 ${staminaCost - player.resources.stamina} 体力`)

  const [minimumDays, maximumDays] = map.actionTier === '基础' ? [20, 40] : map.actionTier === '中阶' ? [40, 80] : [60, 120]
  const durationDays = randomInt(random, minimumDays, maximumDays)
  const stats = derivedStats(player)
  let materials = { ...player.resources.materials }
  const gained: string[] = []
  for (const material of map.materials) {
    const amount = 2 + (random.next() < stats.materialChance ? 1 : 0) + (random.next() < stats.quantityChance ? 1 : 0)
    materials = changeMaterial(materials, material, amount)
    gained.push(`${material} +${amount}`)
  }
  const nextPlayer: Player = { ...player, resources: { ...player.resources, spiritStones: player.resources.spiritStones - map.travelCost, stamina: player.resources.stamina - staminaCost, materials } }
  return { mapId, player: nextPlayer, durationDays, event: eventFor(random), baseDetail: `行程预计 ${durationDays} 天，采得${gained.join('、')}。` }
}

function completeExplore(player: Player, durationDays: number): Player {
  const statuses = {
    ...player.statuses,
    attackBonusActions: Math.max(0, player.statuses.attackBonusActions - 1),
    defenseBonusActions: Math.max(0, player.statuses.defenseBonusActions - 1),
    healthBonusActions: Math.max(0, player.statuses.healthBonusActions - 1),
    harvestBonusActions: Math.max(0, player.statuses.harvestBonusActions - 1),
  }
  const next = { ...player, ageDays: player.ageDays + durationDays, statuses }
  return { ...next, resources: { ...next.resources, health: Math.min(next.resources.health, maximumHealth(next)) } }
}

function monsterDrop(player: Player, tier: PendingExplore['mapId'], random: RandomSource): { player: Player; detail: string } {
  const map = mapById.get(tier)!
  const roll = random.next()
  if (roll < 0.6) {
    const item = ['妖丹碎片', '灵兽骨', '妖血精华'][randomInt(random, 0, 2)]
    return { player: { ...player, resources: { ...player.resources, materials: changeMaterial(player.resources.materials, item, 1) } }, detail: `${item} +1` }
  }
  if (roll < 0.85) {
    const first = ['妖丹碎片', '灵兽骨', '妖血精华'][randomInt(random, 0, 2)]
    const second = ['妖丹碎片', '灵兽骨', '妖血精华'][randomInt(random, 0, 2)]
    let materials = changeMaterial(player.resources.materials, first, 1)
    materials = changeMaterial(materials, second, 1)
    return { player: { ...player, resources: { ...player.resources, materials } }, detail: `${first}、${second} 各 +1` }
  }
  const stones = map.actionTier === '基础' ? 20 : map.actionTier === '中阶' ? 60 : 180
  return { player: { ...player, resources: { ...player.resources, spiritStones: player.resources.spiritStones + stones } }, detail: `灵石 +${stones}` }
}

export function resolveExploreEvent(pending: PendingExplore, choice: ExploreChoice = '', random: RandomSource = systemRandom): ExploreResult {
  const map = mapById.get(pending.mapId)!
  let player = pending.player
  let detail = pending.baseDetail
  let important = false
  switch (pending.event) {
    case 'battle': {
      important = true
      if (choice === 'retreat') detail += ` ${map.enemy.description} 你收敛气息，退避而去。`
      else {
        const stats = derivedStats(player)
        const playerDamage = Math.max(1, stats.attack - map.enemy.defense * 0.4)
        const enemyDamage = Math.max(1, map.enemy.attack - stats.defense * 0.4)
        const rounds = Math.ceil(map.enemy.health / playerDamage)
        const expectedDamage = rounds * enemyDamage
        if (player.resources.health > expectedDamage) {
          player = { ...player, resources: { ...player.resources, health: player.resources.health - expectedDamage } }
          const drop = monsterDrop(player, pending.mapId, random)
          player = drop.player
          detail += ` ${map.enemy.description} 你以 ${rounds} 合将其击败，生命 -${expectedDamage}，额外获得：${drop.detail}。`
        } else {
          const injured = random.next() < 0.3
          player = { ...player, statuses: { ...player.statuses, lightInjury: player.statuses.lightInjury || injured }, resources: { ...player.resources, health: 1 } }
          detail += ` ${map.enemy.description} 你不敌而退，生命降至 1${injured ? '，并留下轻伤' : ''}。`
        }
      }
      break
    }
    case 'harvest': {
      const material = map.materials[randomInt(random, 0, 2)]
      player = { ...player, resources: { ...player.resources, materials: changeMaterial(player.resources.materials, material, 1) } }
      detail += ` ${map.eventText.harvest} ${material} +1。`
      break
    }
    case 'merchant': {
      important = true
      if (choice && map.materials.includes(choice)) {
        if (player.resources.spiritStones < map.travelCost) detail += ` ${map.eventText.merchant} 但你的灵石不足，只得离开。`
        else {
          player = { ...player, resources: { ...player.resources, spiritStones: player.resources.spiritStones - map.travelCost, materials: changeMaterial(player.resources.materials, choice, 2) } }
          detail += ` ${map.eventText.merchant} 你换得 ${choice} +2。`
        }
      } else detail += ` ${map.eventText.merchant} 你没有停留。`
      break
    }
    case 'ruin': {
      important = true
      if (choice === 'enter') {
        if (random.next() < 0.7) {
          const item = ['妖丹碎片', '灵兽骨', '妖血精华'][randomInt(random, 0, 2)]
          player = { ...player, resources: { ...player.resources, materials: changeMaterial(player.resources.materials, item, 1) } }
          detail += ` ${map.eventText.ruin} 你寻得 ${item} +1。`
        } else {
          const damage = Math.max(1, Math.floor(maximumHealth(player) * 0.2))
          player = { ...player, resources: { ...player.resources, health: Math.max(1, player.resources.health - damage) } }
          detail += ` ${map.eventText.ruin} 禁制反噬，生命 -${damage}。`
        }
      } else detail += ` ${map.eventText.ruin} 你未贸然踏入。`
      break
    }
    case 'friend': detail += ' 远处有位陌生修士向你行礼，因缘簿待你亲自续写。'; important = true; break
    default: detail += ` ${map.eventText.calm}`
  }
  player = completeExplore(player, pending.durationDays)
  return { player, durationDays: pending.durationDays, log: log(`探索 · ${map.name}`, detail, player.ageDays, important) }
}

export function resolveExplore(player: Player, mapId: MapId, random: RandomSource = systemRandom): ExploreResult {
  const pending = beginExplore(player, mapId, random)
  const fallbackChoice: ExploreChoice = pending.event === 'battle' ? 'retreat' : pending.event === 'ruin' ? 'leave' : ''
  return resolveExploreEvent(pending, fallbackChoice, random)
}

export function rest(player: Player, random: RandomSource = systemRandom): ExploreResult {
  const days = randomInt(random, 7, 13)
  const maxHealth = maximumHealth(player)
  const next: Player = { ...player, ageDays: player.ageDays + days, statuses: { ...player.statuses, lightInjury: false }, resources: { ...player.resources, stamina: Math.min(100, player.resources.stamina + 45), focus: Math.min(100, player.resources.focus + 45), health: Math.min(maxHealth, player.resources.health + Math.round(maxHealth * 0.3)) } }
  return { player: next, durationDays: days, log: log('调息', `静坐调息 ${days} 天，体力、精力恢复，生命回复。`, next.ageDays) }
}
