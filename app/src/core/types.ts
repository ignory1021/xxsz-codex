export type Gender = '男' | '女' | '无定'
export type Personality = '豪迈' | '谨慎' | '豁达' | '温和' | '孤僻' | '清冷'
export type Difficulty = 'light' | 'medium' | 'heavy' | 'extreme'
export type ActionKind = 'cultivate' | 'adventure' | 'alchemy'
export type EncounterChoice = 'observe' | 'risk' | 'leave' | 'invite' | 'greet' | 'challenge'
export type GameSpeed = 1 | 3 | 5
export type GamePhase = 'playing' | 'dead' | 'ascended'

export interface SpiritRoot {
  name: string
  elements: string[]
  aptitude: number
  structureMultiplier: number
}

export interface Character {
  name: string
  gender: Gender
  personality: Personality
  spiritRoot: SpiritRoot
  insight: number
}

export interface RealmConfig {
  name: string
  lifespanYears: number
  lifespanLayerGainYears: number
  offlineCapYears: number
  qiStart: number
  qiEnd: number
  qiPerfect: number
  map: string
}

export interface DifficultyConfig {
  id: Difficulty
  name: string
  months: number
  baseQi: number
  durationMs: number
  unlockRealm: number
}

export interface Friend {
  soulId: string
  name: string
  title: string
  personality: Personality
  affection: number
  metInLife: number
  memory: string
}

export interface ChronicleEntry {
  id: string
  atMonths: number
  life: number
  type: 'birth' | 'realm' | 'event' | 'friend' | 'alchemy' | 'action' | 'death' | 'reincarnation'
  title: string
  text: string
}

export interface LineageEntry {
  life: number
  name: string
  spiritRoot: string
  highestRealm: string
  livedMonths: number
  ending: string
}

export interface Inventory {
  herbs: number
  ore: number
  pills: number
}

export interface ActiveAction {
  kind: ActionKind
  difficulty: Difficulty
  startedAt: number
  endsAt: number
}

export interface ActionPlan {
  kind: ActionKind
  difficulty: Difficulty
}

export interface PendingEncounter {
  id: string
  kind: 'opportunity' | 'friend'
  title: string
  narrative: string
  friend?: Friend
}

export interface ActionResult {
  kind: ActionKind
  title: string
  narrative: string
  rewards: string[]
}

export interface OfflineReport {
  elapsedMs: number
  advancedMonths: number
  qiGained: number
  capped: boolean
  died: boolean
}

export interface GameData {
  schemaVersion: 1
  character: Character
  life: number
  phase: GamePhase
  ageMonths: number
  monthProgress: number
  realmIndex: number
  layer: number
  perfect: boolean
  qi: number
  running: boolean
  speed: GameSpeed
  idleMode: boolean
  lastUpdatedAt: number
  inventory: Inventory
  friends: Friend[]
  chronicle: ChronicleEntry[]
  lineage: LineageEntry[]
  actionPlan: ActionPlan | null
  pendingEncounter: PendingEncounter | null
  activeAction: ActiveAction | null
}

export interface CharacterDraft {
  name: string
  gender: Gender
  personality: Personality
}
