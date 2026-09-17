export const realms = ['练气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'] as const

export type Realm = (typeof realms)[number]
export type Element = '金' | '木' | '水' | '火' | '土'
export type Roots = Record<Element, number>
export type MapId = 'qinglan' | 'wuyin' | 'chiyan' | 'xuanshui' | 'yunmeng' | 'duankong' | 'hetian' | 'jiuxiao' | 'jieyun'
export type ActionTier = '基础' | '中阶' | '高阶'
export type ExploreEventType = 'friend' | 'battle' | 'harvest' | 'merchant' | 'ruin' | 'calm'
export type BattleChoice = 'fight' | 'retreat'
export type RuinChoice = 'enter' | 'leave'
export type ExploreChoice = BattleChoice | RuinChoice | string

export interface ResourceBag {
  spiritStones: number
  stamina: number
  focus: number
  health: number
  materials: Record<string, number>
}

export interface Equipment {
  weaponAttack: number
  armorDefense: number
  accessoryHealth: number
}

export interface Statuses {
  lightInjury: boolean
  heavyInjury: boolean
  attackBonusActions: number
  defenseBonusActions: number
  healthBonusActions: number
  harvestBonusActions: number
}

export interface Player {
  name: string
  realm: Realm
  level: number
  perfected: boolean
  alchemyExperience: number
  ageDays: number
  lifespanDays: number
  roots: Roots
  resources: ResourceBag
  equipment: Equipment
  statuses: Statuses
}

export interface MapDefinition {
  id: MapId
  name: string
  description: string
  realm: Realm
  actionTier: ActionTier
  travelCost: number
  staminaCost: number
  enemy: { name: string; description: string; attack: number; defense: number; health: number }
  materials: readonly [string, string, string]
  eventText: { harvest: string; merchant: string; ruin: string; calm: string }
}

export interface ActionLog {
  id: string
  title: string
  detail: string
  ageDays: number
  important?: boolean
}

export interface DerivedStats {
  attack: number
  defense: number
  maximumHealth: number
  materialChance: number
  quantityChance: number
}

export interface PendingExplore {
  mapId: MapId
  player: Player
  durationDays: number
  event: ExploreEventType
  baseDetail: string
}

export interface ExploreResult {
  player: Player
  log: ActionLog
  durationDays: number
}
