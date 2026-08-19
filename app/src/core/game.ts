import { ADVENTURE_FINDINGS, DIFFICULTIES, REALMS } from '../data/gameData'
import { generateFriend, generateSpiritRoot, pick, randomInt } from './random'
import type {
  ActionKind,
  ActionResult,
  CharacterDraft,
  ChronicleEntry,
  Difficulty,
  GameData,
} from './types'

export function aptitudeMultiplier(aptitude: number): number {
  if (aptitude <= 3) return 0.5
  if (aptitude <= 6) return 1
  if (aptitude <= 8) return 1.5
  return 2
}

export function qiRequirement(realmIndex: number, layer: number, perfect: boolean): number {
  const realm = REALMS[realmIndex]
  if (perfect) return 0
  if (layer >= 10) return realm.qiPerfect
  const progress = (layer - 1) / 8
  return Math.round(realm.qiStart + (realm.qiEnd - realm.qiStart) * progress)
}

export function createNewGame(draft: CharacterDraft, now = Date.now()): GameData {
  const spiritRoot = generateSpiritRoot()
  const birth: ChronicleEntry = {
    id: `birth-${now}`,
    atMonths: 0,
    life: 1,
    type: 'birth',
    title: '此身初醒',
    text: `${draft.name}生有${spiritRoot.name}，仙路自此始。`,
  }

  return {
    schemaVersion: 1,
    character: { ...draft, spiritRoot, insight: 0 },
    life: 1,
    phase: 'playing',
    ageMonths: 0,
    monthProgress: 0,
    realmIndex: 0,
    layer: 1,
    perfect: false,
    qi: 0,
    running: false,
    speed: 1,
    idleMode: false,
    lastUpdatedAt: now,
    inventory: { herbs: 2, ore: 0, pills: 0 },
    friends: [],
    chronicle: [birth],
    lineage: [],
    activeAction: null,
  }
}

export function addChronicle(
  game: GameData,
  type: ChronicleEntry['type'],
  title: string,
  text: string,
): ChronicleEntry[] {
  return [
    {
      id: `${type}-${game.life}-${game.ageMonths}-${Date.now()}-${randomInt(10, 99)}`,
      atMonths: game.ageMonths,
      life: game.life,
      type,
      title,
      text,
    },
    ...game.chronicle,
  ].slice(0, 120)
}

export function normalizeProgress(game: GameData): GameData {
  let qi = game.qi
  let layer = game.layer
  let perfect = game.perfect
  let chronicle = game.chronicle

  while (!perfect) {
    const required = qiRequirement(game.realmIndex, layer, false)
    if (qi < required) break
    qi -= required
    if (layer >= 10) {
      perfect = true
      chronicle = addChronicle({ ...game, qi, layer, perfect, chronicle }, 'realm', `${REALMS[game.realmIndex].name}大圆满`, '周天圆融，只待叩问下一重天关。')
      break
    }
    layer += 1
    if (layer === 5 || layer === 10) {
      chronicle = addChronicle({ ...game, qi, layer, perfect, chronicle }, 'realm', `${REALMS[game.realmIndex].name}${layer}层`, '灵台清明，修为更进一层。')
    }
  }

  return { ...game, qi, layer, perfect, chronicle }
}

export function applyAge(game: GameData, months: number): GameData {
  if (months <= 0 || game.phase !== 'playing') return game
  const lifespanMonths = REALMS[game.realmIndex].lifespanYears * 12
  const ageMonths = Math.min(game.ageMonths + months, lifespanMonths)
  if (ageMonths < lifespanMonths) return { ...game, ageMonths }

  return {
    ...game,
    ageMonths,
    phase: 'dead',
    running: false,
    idleMode: false,
    activeAction: null,
    chronicle: addChronicle({ ...game, ageMonths }, 'death', '寿尽归寂', `${game.character.name}于${REALMS[game.realmIndex].name}境寿尽，静候来世。`),
  }
}

export function actionCostMonths(difficulty: Difficulty): number {
  return DIFFICULTIES.find((item) => item.id === difficulty)?.months ?? 1
}

export function settleAction(game: GameData, kind: ActionKind, difficulty: Difficulty): { game: GameData; result: ActionResult } {
  const difficultyConfig = DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[0]
  const root = game.character.spiritRoot
  const rootMultiplier = root.structureMultiplier * aptitudeMultiplier(root.aptitude)

  if (kind === 'cultivate') {
    const qi = Math.round(difficultyConfig.baseQi * rootMultiplier)
    const next = normalizeProgress({ ...game, qi: game.qi + qi, activeAction: null })
    return {
      game: next,
      result: {
        kind,
        title: '吐纳归元',
        narrative: '灵气沿经脉徐徐流转，最终归于丹田。',
        rewards: [`灵气 +${qi}`],
      },
    }
  }

  if (kind === 'adventure') {
    const herbs = randomInt(1, Math.max(1, Math.ceil(difficultyConfig.months / 12) + 1))
    const ore = Math.random() < 0.35 ? 1 : 0
    const qi = Math.max(2, Math.round(difficultyConfig.baseQi * rootMultiplier * 0.25))
    let friends = game.friends
    const rewards = [`灵气 +${qi}`, `灵草 +${herbs}`]
    let chronicle = game.chronicle
    if (ore) rewards.push('灵矿 +1')
    if (Math.random() < 0.12 && friends.length < 8) {
      const friend = generateFriend(game.life)
      friends = [...friends, friend]
      rewards.push(`结识 ${friend.name}`)
      chronicle = addChronicle(game, 'friend', '萍水相逢', `你在${REALMS[game.realmIndex].map}结识了${friend.name}。`)
    }
    const next = normalizeProgress({
      ...game,
      qi: game.qi + qi,
      inventory: { ...game.inventory, herbs: game.inventory.herbs + herbs, ore: game.inventory.ore + ore },
      friends,
      chronicle,
      activeAction: null,
    })
    return {
      game: next,
      result: { kind, title: REALMS[game.realmIndex].map, narrative: pick(ADVENTURE_FINDINGS), rewards },
    }
  }

  if (game.inventory.herbs < 2) {
    return {
      game: { ...game, activeAction: null },
      result: { kind, title: '炉火未生', narrative: '药篓空空，尚缺两株灵草。', rewards: ['材料不足'] },
    }
  }

  const successRate = Math.min(0.95, 0.8 - DIFFICULTIES.indexOf(difficultyConfig) * 0.1 + game.layer * 0.01)
  const success = Math.random() <= successRate
  const qi = success ? Math.max(3, Math.round(difficultyConfig.baseQi * 0.35)) : 2
  const inventory = {
    ...game.inventory,
    herbs: game.inventory.herbs - (success ? 2 : 1),
    pills: game.inventory.pills + (success ? 1 : 0),
  }
  const next = normalizeProgress({ ...game, qi: game.qi + qi, inventory, activeAction: null })
  return {
    game: success
      ? { ...next, chronicle: game.inventory.pills === 0 ? addChronicle(next, 'alchemy', '初识丹火', '第一枚培元丹温润如玉，静卧炉中。') : next.chronicle }
      : next,
    result: {
      kind,
      title: success ? '丹成一品' : '炉中余烬',
      narrative: success ? '丹炉轻鸣，药香自炉隙间漫出。' : '火候稍纵即逝，只余一缕焦苦药气。',
      rewards: success ? ['培元丹 +1', `灵气 +${qi}`] : ['损失灵草 ×1', `灵气 +${qi}`],
    },
  }
}

export function breakthroughChance(game: GameData): number {
  const rates = [0.9, 0.75, 0.6, 0.45, 0.3, 0.2, 0.15, 0.1, 0.05]
  return Math.min(0.95, rates[game.realmIndex] + game.character.insight * 0.01 + (game.inventory.pills > 0 ? 0.15 : 0))
}

export function attemptBreakthrough(game: GameData): { game: GameData; result: ActionResult } {
  if (!game.perfect) {
    return { game, result: { kind: 'cultivate', title: '道行未满', narrative: '周天尚未圆融，此时叩关仍嫌太早。', rewards: [] } }
  }

  const usedPill = game.inventory.pills > 0
  const inventory = usedPill ? { ...game.inventory, pills: game.inventory.pills - 1 } : game.inventory
  const success = Math.random() <= breakthroughChance(game)

  if (success && game.realmIndex === REALMS.length - 1) {
    const ascended = {
      ...game,
      phase: 'ascended' as const,
      running: false,
      inventory,
      chronicle: addChronicle(game, 'realm', '破界飞升', '雷海尽头天门洞开，此世仙途终得圆满。'),
    }
    return { game: ascended, result: { kind: 'cultivate', title: '破界飞升', narrative: '九霄雷散，天门为你而开。', rewards: ['解锁结局：完美飞升'] } }
  }

  if (success) {
    const realmIndex = game.realmIndex + 1
    const next = {
      ...game,
      realmIndex,
      layer: 1,
      perfect: false,
      qi: 0,
      inventory,
      chronicle: addChronicle(game, 'realm', `突破·${REALMS[realmIndex].name}`, `灵台震荡之后，新境豁然开朗。`),
    }
    return { game: next, result: { kind: 'cultivate', title: `踏入${REALMS[realmIndex].name}`, narrative: '旧境如壳碎去，天地灵机从未如此清晰。', rewards: [`寿元上限提升至 ${REALMS[realmIndex].lifespanYears} 年`] } }
  }

  const lost = randomInt(1, 3)
  const next = { ...game, layer: Math.max(7, 10 - lost + 1), perfect: false, qi: 0, inventory }
  return { game: next, result: { kind: 'cultivate', title: '叩关未成', narrative: '心神一乱，灵气自周天溃散。所幸道基未毁，尚可重修。', rewards: [`境界跌落 ${lost} 层`] } }
}

export function reincarnate(game: GameData, now = Date.now()): GameData {
  const realmName = `${REALMS[game.realmIndex].name}${game.perfect ? '大圆满' : `${game.layer}层`}`
  const lineage = [
    ...game.lineage,
    {
      life: game.life,
      name: game.character.name,
      spiritRoot: game.character.spiritRoot.name,
      highestRealm: realmName,
      livedMonths: game.ageMonths,
      ending: game.phase === 'ascended' ? '飞升' : '寿尽',
    },
  ]
  const returningFriends = game.friends
    .filter((friend) => friend.affection >= 30 && Math.random() <= (friend.affection >= 70 ? 1 : friend.affection >= 50 ? 0.5 : 0.2))
    .map((friend) => ({ ...friend, name: pick(['顾长风', '苏停云', '宁知白', '叶藏秋']), affection: Math.floor(friend.affection / 2), metInLife: game.life + 1 }))

  const spiritRoot = generateSpiritRoot()
  const reborn: GameData = {
    ...game,
    character: { ...game.character, spiritRoot, insight: 0 },
    life: game.life + 1,
    phase: 'playing',
    ageMonths: 0,
    monthProgress: 0,
    realmIndex: 0,
    layer: 1,
    perfect: false,
    qi: 0,
    running: false,
    speed: 1,
    idleMode: false,
    lastUpdatedAt: now,
    inventory: { herbs: 0, ore: 0, pills: 0 },
    friends: returningFriends,
    lineage,
    activeAction: null,
  }
  return {
    ...reborn,
    chronicle: addChronicle(reborn, 'reincarnation', `第${reborn.life}世`, `旧梦散去，${game.character.name}携一线因缘再入尘世。`),
  }
}
