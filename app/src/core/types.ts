export const realms = ['练气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'] as const

export type Realm = (typeof realms)[number]
export type Element = '金' | '木' | '水' | '火' | '土'
export type Roots = Record<Element, number>
export type MapId = 'qinglan' | 'wuyin' | 'chiyan' | 'xuanshui' | 'yunmeng' | 'duankong' | 'hetian' | 'jiuxiao' | 'jieyun'

export interface ResourceBag { spiritStones: number; stamina: number; focus: number; health: number; materials: Record<string, number> }
export interface Equipment { weaponAttack: number; armorDefense: number; accessoryHealth: number }
export interface Player { name: string; realm: Realm; level: number; alchemyExperience: number; ageDays: number; lifespanDays: number; roots: Roots; resources: ResourceBag; equipment: Equipment }
export interface MapDefinition { id: MapId; name: string; realm: Realm; actionTier: '基础' | '中阶' | '高阶'; travelCost: number; staminaCost: number; enemy: { name: string; attack: number; defense: number; health: number }; materials: readonly [string, string, string] }
export interface ActionLog { id: string; title: string; detail: string; ageDays: number }
export interface ExploreResult { player: Player; log: ActionLog; durationDays: number }
