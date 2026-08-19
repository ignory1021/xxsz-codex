import { ADVENTURE_FINDINGS, DIFFICULTIES, EMPTY_PILL_STOCK, OPPORTUNITY_EVENTS, PILL_RECIPES, REALMS } from '../data/gameData'
import { generateFriend, generateFriendName, generateSpiritRoot, improveSpiritRootAptitude, pick, purifySpiritRoot, randomInt } from './random'
import type {
  ActionKind,
  ActionResult,
  CharacterDraft,
  ChronicleEntry,
  Difficulty,
  EncounterChoice,
  Friend,
  GameData,
  PendingEncounter,
  PillId,
  PillRecipe,
} from './types'

export function aptitudeMultiplier(aptitude: number): number {
  if (aptitude <= 3) return 0.5
  if (aptitude <= 6) return 1
  if (aptitude <= 8) return 1.5
  return 2
}

export function realmQiMultiplier(realmIndex: number): number {
  return Math.max(1, Math.floor(REALMS[realmIndex].qiStart / 1_000))
}

function actionQiBase(game: GameData, baseQi: number): number {
  const root = game.character.spiritRoot
  return Math.round(baseQi * root.structureMultiplier * aptitudeMultiplier(root.aptitude) * realmQiMultiplier(game.realmIndex))
}

const ADVENTURE_YIELDS: Record<Difficulty, { herbs: number; oreChance: number }> = {
  light: { herbs: 1, oreChance: 0.15 },
  medium: { herbs: 2, oreChance: 0.45 },
  heavy: { herbs: 3, oreChance: 0.75 },
}

export function qiRequirement(realmIndex: number, layer: number, perfect: boolean): number {
  const realm = REALMS[realmIndex]
  if (perfect) return 0
  if (layer >= 10) return realm.qiPerfect
  const progress = (layer - 1) / 8
  return Math.round(realm.qiStart + (realm.qiEnd - realm.qiStart) * progress)
}

export function lifespanYears(game: Pick<GameData, 'realmIndex' | 'layer'> & Partial<Pick<GameData, 'lifespanBonusYears'>>): number {
  const realm = REALMS[game.realmIndex]
  return realm.lifespanYears + (game.layer - 1) * realm.lifespanLayerGainYears + (game.lifespanBonusYears ?? 0)
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
    inventory: { herbs: 2, ore: 0, pills: { ...EMPTY_PILL_STOCK } },
    alchemyRecipeId: 'peiyuan',
    breakthroughBonus: 0,
    lifespanBonusYears: 0,
    companionSoulId: null,
    friends: [],
    chronicle: [birth],
    lineage: [],
    actionPlan: null,
    pendingEncounter: null,
    activeAction: null,
    recentEncounterIds: [],
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

  return {
    ...game,
    qi,
    layer,
    perfect,
    chronicle,
    // At great perfection, pause the automatic plan so the breakthrough is never obscured by a new action.
    running: perfect ? false : game.running,
    idleMode: perfect ? false : game.idleMode,
    activeAction: perfect ? null : game.activeAction,
  }
}

export function applyAge(game: GameData, months: number): GameData {
  if (months < 0 || game.phase !== 'playing') return game
  const lifespanMonths = lifespanYears(game) * 12
  const ageMonths = game.ageMonths >= lifespanMonths
    ? game.ageMonths
    : Math.min(game.ageMonths + months, lifespanMonths)
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

export function pillRecipeById(id: PillId): PillRecipe {
  return PILL_RECIPES.find((recipe) => recipe.id === id) ?? PILL_RECIPES[0]
}

export function pillEffectText(recipe: PillRecipe): string {
  switch (recipe.effect) {
    case 'qi': return `灵气 +${recipe.effectValue.toLocaleString()}`
    case 'breakthrough': return `下次突破 +${Math.round(recipe.effectValue * 100)}%`
    case 'purify': return '灵根数 -1'
    case 'insight': return `悟性 +${recipe.effectValue}`
    case 'lifespan': return `寿元上限 +${recipe.effectValue} 年`
    case 'aptitude': return `资质 +${recipe.effectValue}`
  }
}

function hasRecipeMaterials(game: GameData, recipe: PillRecipe): boolean {
  return game.inventory.herbs >= recipe.herbsCost && game.inventory.ore >= recipe.oreCost
}

export function takePill(game: GameData, recipeId = game.alchemyRecipeId): { game: GameData; result: ActionResult } {
  const recipe = pillRecipeById(recipeId)
  const pillCount = game.inventory.pills[recipe.id] ?? 0
  if (pillCount < 1) {
    return {
      game,
      result: { kind: 'alchemy', title: '丹瓶已空', narrative: `囊中已无${recipe.name}可服。`, rewards: [] },
    }
  }

  if (recipe.effect === 'purify' && game.character.spiritRoot.elements.length <= 1) {
    return { game, result: { kind: 'alchemy', title: '灵根已纯', narrative: '此身已是单灵根，净灵丹暂不能再精炼根骨。', rewards: [] } }
  }
  if (recipe.effect === 'aptitude' && game.character.spiritRoot.aptitude >= 10) {
    return { game, result: { kind: 'alchemy', title: '资质已极', narrative: '灵根资质已至极境，洗髓丹暂不能再提升。', rewards: [] } }
  }

  const consumed = { ...game, inventory: { ...game.inventory, pills: { ...game.inventory.pills, [recipe.id]: pillCount - 1 } } }
  let next: GameData
  switch (recipe.effect) {
    case 'qi':
      next = normalizeProgress({ ...consumed, qi: consumed.qi + recipe.effectValue })
      break
    case 'breakthrough':
      next = { ...consumed, breakthroughBonus: Math.min(0.5, consumed.breakthroughBonus + recipe.effectValue) }
      break
    case 'purify':
      next = { ...consumed, character: { ...consumed.character, spiritRoot: purifySpiritRoot(consumed.character.spiritRoot) } }
      break
    case 'insight':
      next = { ...consumed, character: { ...consumed.character, insight: consumed.character.insight + recipe.effectValue } }
      break
    case 'lifespan':
      next = { ...consumed, lifespanBonusYears: consumed.lifespanBonusYears + recipe.effectValue }
      break
    case 'aptitude':
      next = { ...consumed, character: { ...consumed.character, spiritRoot: improveSpiritRootAptitude(consumed.character.spiritRoot) } }
      break
  }
  const result: ActionResult = {
    kind: 'alchemy',
    title: `服用${recipe.name}`,
    narrative: '丹药入腹，药力沿经脉徐徐化开。',
    rewards: [pillEffectText(recipe)],
  }
  return { game: recordActionResult(next, result), result }
}

function recordActionResult(game: GameData, result: ActionResult): GameData {
  const rewards = result.rewards.length > 0 ? `所得：${result.rewards.join('、')}。` : ''
  return {
    ...game,
    chronicle: addChronicle(game, 'action', result.title, `${result.narrative}${rewards}`),
  }
}

interface EncounterCreation {
  game: GameData
  encounter: PendingEncounter
}

function createOpportunityEncounter(game: GameData): EncounterCreation {
  const recentEncounterIds = game.recentEncounterIds ?? []
  const candidates = OPPORTUNITY_EVENTS.filter((event) => !recentEncounterIds.includes(event.id))
  const opportunity = pick(candidates.length > 0 ? candidates : OPPORTUNITY_EVENTS)

  return {
    game: { ...game, recentEncounterIds: [...recentEncounterIds, opportunity.id].slice(-3) },
    encounter: {
      id: `opportunity-${opportunity.id}-${game.life}-${game.ageMonths}-${Date.now()}`,
      kind: 'opportunity',
      title: opportunity.title,
      narrative: opportunity.narrative,
      opportunity,
    },
  }
}

function companionFor(game: GameData, soulId = game.companionSoulId): Friend | undefined {
  return soulId ? game.friends.find((friend) => friend.soulId === soulId) : undefined
}

function applyCompanionQi(game: GameData, companionSoulId: string | null | undefined, qi: number): { qi: number; rewards: string[] } {
  if (!companionFor(game, companionSoulId)) return { qi, rewards: [`灵气 +${qi}`] }
  const bonus = Math.max(1, Math.round(qi * 0.4))
  return { qi: qi + bonus, rewards: [`灵气 +${qi}`, `道友同行 +${bonus}`] }
}

function settleCompanionAffinity(game: GameData, companionSoulId: string | null | undefined): GameData {
  const companion = companionFor(game, companionSoulId)
  if (!companion) return game

  const roll = Math.random()
  const change = roll < 0.35 ? randomInt(1, 3) : roll < 0.5 ? -randomInt(1, 2) : 0
  if (change === 0) return game

  const affection = Math.max(-100, Math.min(100, companion.affection + change))
  const text = change > 0
    ? `此程默契渐生，${companion.name}对你的好感 +${change}。`
    : `此程心意未合，${companion.name}对你的好感 ${change}。`
  return {
    ...game,
    friends: game.friends.map((friend) => friend.soulId === companion.soulId ? { ...friend, affection, memory: text } : friend),
    chronicle: addChronicle(game, 'friend', `同行·${companion.name}`, text),
  }
}

function createEncounter(game: GameData, kind: ActionKind, companionSoulId?: string | null): EncounterCreation | null {
  if ((kind === 'cultivate' || kind === 'alchemy') && Math.random() < 0.08) {
    return createOpportunityEncounter(game)
  }

  if (kind === 'adventure') {
    const roll = Math.random()
    const friendChance = companionFor(game, companionSoulId) ? 0.048 : 0.12
    if (roll < friendChance && game.friends.length < 8) {
      const friend = generateFriend(game.life, game.friends.map((item) => item.name))
      return {
        game,
        encounter: {
          id: `friend-${friend.soulId}`,
          kind: 'friend',
          title: '山水相逢',
          narrative: `你在${REALMS[game.realmIndex].map}遇见${friend.name}，对方自称${friend.title}，眉目间尽是${friend.personality}之意。`,
          friend,
        },
      }
    }
    if (roll < friendChance + 0.12) {
      return createOpportunityEncounter(game)
    }
  }

  return null
}

function completeAction(game: GameData, result: ActionResult, companionSoulId?: string | null): GameData {
  const recorded = recordActionResult(game, result)
  const withAffinity = settleCompanionAffinity(recorded, companionSoulId)
  const created = createEncounter(withAffinity, result.kind, companionSoulId)
  return created ? { ...created.game, pendingEncounter: created.encounter, running: false } : withAffinity
}

export function settleAction(game: GameData, kind: ActionKind, difficulty: Difficulty, recipeId = game.alchemyRecipeId, companionSoulId = game.companionSoulId): { game: GameData; result: ActionResult } {
  const difficultyConfig = DIFFICULTIES.find((item) => item.id === difficulty) ?? DIFFICULTIES[0]
  const baseQi = actionQiBase(game, difficultyConfig.baseQi)

  if (kind === 'cultivate') {
    const qiResult = applyCompanionQi(game, companionSoulId, baseQi)
    const next = normalizeProgress({ ...game, qi: game.qi + qiResult.qi, activeAction: null })
    const result: ActionResult = {
      kind,
      title: '吐纳归元',
      narrative: '灵气沿经脉徐徐流转，最终归于丹田。',
      rewards: qiResult.rewards,
    }
    return {
      game: completeAction(next, result, companionSoulId),
      result,
    }
  }

  if (kind === 'adventure') {
    const companionAssists = Boolean(companionFor(game, companionSoulId) && Math.random() < 0.3)
    const yieldConfig = ADVENTURE_YIELDS[difficultyConfig.id]
    const herbs = yieldConfig.herbs + (companionAssists ? 1 : 0)
    const ore = Math.random() < yieldConfig.oreChance ? 1 : 0
    const qiResult = applyCompanionQi(game, companionSoulId, Math.max(2, Math.round(baseQi * 0.9)))
    const rewards = [...qiResult.rewards, `灵草 +${herbs}`]
    if (companionAssists) rewards.push('道友寻得额外材料')
    if (ore) rewards.push('灵矿 +1')
    const next = normalizeProgress({
      ...game,
      qi: game.qi + qiResult.qi,
      inventory: { ...game.inventory, herbs: game.inventory.herbs + herbs, ore: game.inventory.ore + ore },
      activeAction: null,
    })
    const result: ActionResult = { kind, title: REALMS[game.realmIndex].map, narrative: pick(ADVENTURE_FINDINGS), rewards }
    return { game: completeAction(next, result, companionSoulId), result }
  }

  const recipe = pillRecipeById(recipeId)
  if (game.realmIndex < recipe.unlockRealm || !hasRecipeMaterials(game, recipe)) {
    const requirements = [`灵草 ${game.inventory.herbs}/${recipe.herbsCost}`]
    if (recipe.oreCost > 0) requirements.push(`灵矿 ${game.inventory.ore}/${recipe.oreCost}`)
    const result: ActionResult = { kind, title: '炉火未生', narrative: `${recipe.name}所需材料尚未备齐。`, rewards: requirements }
    return {
      game: recordActionResult({ ...game, activeAction: null }, result),
      result,
    }
  }

  const companionAssists = Boolean(companionFor(game, companionSoulId) && Math.random() < 0.2)
  const successRate = Math.min(0.95, 0.8 - DIFFICULTIES.indexOf(difficultyConfig) * 0.1 + game.layer * 0.01 + (companionAssists ? 0.15 : 0))
  const success = Math.random() <= successRate
  const qiResult = applyCompanionQi(game, companionSoulId, Math.max(2, Math.round(baseQi * (success ? 0.75 : 0.25))))
  const inventory = {
    ...game.inventory,
    herbs: game.inventory.herbs - (success ? recipe.herbsCost : Math.max(1, Math.ceil(recipe.herbsCost / 2))),
    ore: game.inventory.ore - (success ? recipe.oreCost : Math.floor(recipe.oreCost / 2)),
    pills: {
      ...game.inventory.pills,
      [recipe.id]: (game.inventory.pills[recipe.id] ?? 0) + (success ? 1 : 0),
    },
  }
  const next = normalizeProgress({ ...game, qi: game.qi + qiResult.qi, inventory, activeAction: null })
  const completed = success && (game.inventory.pills[recipe.id] ?? 0) === 0
    ? { ...next, chronicle: addChronicle(next, 'alchemy', `初成${recipe.name}`, `第一枚${recipe.name}温润如玉，静卧炉中。`) }
    : next
  const result: ActionResult = {
    kind,
    title: success ? `${recipe.name}成丹` : '炉中余烬',
    narrative: success ? '丹炉轻鸣，药香自炉隙间漫出。' : '火候稍纵即逝，只余一缕焦苦药气。',
    rewards: success
      ? [`${recipe.name} +1`, ...qiResult.rewards, ...(companionAssists ? ['道友炉火相助'] : [])]
      : ['材料受损', ...qiResult.rewards, ...(companionAssists ? ['道友炉火相助'] : [])],
  }
  return { game: completeAction(completed, result, companionSoulId), result }
}

export function resolveEncounter(game: GameData, choice: EncounterChoice): GameData {
  const encounter = game.pendingEncounter
  if (!encounter) return game

  let next: GameData = { ...game, pendingEncounter: null }
  if (encounter.kind === 'opportunity') {
    const title = encounter.opportunity?.title ?? encounter.title
    const rootMultiplier = game.character.spiritRoot.structureMultiplier * aptitudeMultiplier(game.character.spiritRoot.aptitude)
    if (choice === 'observe') {
      const qi = Math.round(60 * rootMultiplier)
      next = normalizeProgress({
        ...next,
        qi: next.qi + qi,
        character: { ...next.character, insight: next.character.insight + 1 },
      })
      next = { ...next, chronicle: addChronicle(next, 'event', `${title}·静观`, `你静守心神，从中悟得一线真意，灵气 +${qi}，悟性 +1。`) }
    } else if (choice === 'risk') {
      if (Math.random() < 0.55) {
        const qi = Math.round(140 * rootMultiplier)
        next = normalizeProgress({ ...next, qi: next.qi + qi })
        next = { ...next, chronicle: addChronicle(next, 'event', `${title}·险中得益`, `迷障散去，灵气 +${qi}。`) }
      } else {
        next = applyAge(next, 6)
        next = { ...next, chronicle: addChronicle(next, 'event', `${title}·受挫`, '机缘中暗藏凶险，额外耗去 6 个月寿元。') }
      }
    } else {
      next = { ...next, chronicle: addChronicle(next, 'event', `${title}·离去`, '你收回神识，任这一线机缘消散于山雾之间。') }
    }
  } else if (encounter.friend) {
    let affection: number
    let title: string
    let text: string
    if (choice === 'invite') {
      affection = randomInt(20, 50)
      title = `结识·${encounter.friend.name}`
      text = `你执礼相邀，${encounter.friend.name}欣然应下这一声道友。初始好感 ${affection}。`
    } else if (choice === 'challenge') {
      affection = randomInt(-50, -15)
      title = `锋芒相试·${encounter.friend.name}`
      text = `言语交锋后，${encounter.friend.name}记住了你的气息。初始好感 ${affection}。`
    } else {
      affection = randomInt(-10, 20)
      title = `结识·${encounter.friend.name}`
      text = `你们闲谈数语，${encounter.friend.name}留下了日后再会的约定。初始好感 ${affection}。`
    }
    const friend = { ...encounter.friend, affection, memory: text }
    next = {
      ...next,
      friends: [...next.friends, friend],
      chronicle: addChronicle(next, 'friend', title, text),
    }
  }

  return {
    ...next,
    running: next.phase === 'playing' && !next.perfect && Boolean(next.actionPlan),
    lastUpdatedAt: Date.now(),
  }
}

export function breakthroughChance(game: GameData): number {
  const rates = [0.9, 0.75, 0.6, 0.45, 0.3, 0.2, 0.15, 0.1, 0.05]
  return Math.min(0.95, rates[game.realmIndex] + game.character.insight * 0.01 + game.breakthroughBonus)
}

export function attemptBreakthrough(game: GameData): { game: GameData; result: ActionResult } {
  if (!game.perfect) {
    const result: ActionResult = { kind: 'cultivate', title: '道行未满', narrative: '周天尚未圆融，此时叩关仍嫌太早。', rewards: [] }
    return { game: recordActionResult(game, result), result }
  }

  const chance = breakthroughChance(game)
  const prepared = { ...game, activeAction: null, idleMode: false, breakthroughBonus: 0 }
  const resumePlan = Boolean(prepared.actionPlan)
  const success = Math.random() <= chance

  if (success && prepared.realmIndex === REALMS.length - 1) {
    const ascended = {
      ...prepared,
      phase: 'ascended' as const,
      running: false,
      chronicle: addChronicle(prepared, 'realm', '破界飞升', '雷海尽头天门洞开，此世仙途终得圆满。'),
    }
    const result: ActionResult = { kind: 'cultivate', title: '破界飞升', narrative: '九霄雷散，天门为你而开。', rewards: ['解锁结局：完美飞升'] }
    return { game: recordActionResult(ascended, result), result }
  }

  if (success) {
    const realmIndex = prepared.realmIndex + 1
    const next = {
      ...prepared,
      realmIndex,
      layer: 1,
      perfect: false,
      qi: 0,
      running: resumePlan,
      chronicle: addChronicle(prepared, 'realm', `突破·${REALMS[realmIndex].name}`, `灵台震荡之后，新境豁然开朗。`),
    }
    const result: ActionResult = { kind: 'cultivate', title: `踏入${REALMS[realmIndex].name}`, narrative: '旧境如壳碎去，天地灵机从未如此清晰。', rewards: [`寿元上限提升至 ${REALMS[realmIndex].lifespanYears} 年`] }
    return { game: recordActionResult(next, result), result }
  }

  const lost = randomInt(1, 3)
  const next = applyAge({ ...prepared, layer: Math.max(7, 10 - lost + 1), perfect: false, qi: 0, running: resumePlan }, 0)
  const result: ActionResult = { kind: 'cultivate', title: '叩关未成', narrative: '心神一乱，灵气自周天溃散。所幸道基未毁，尚可重修。', rewards: [`境界跌落 ${lost} 层`] }
  return { game: recordActionResult(next, result), result }
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
  const returningNames = new Set<string>()
  const returningFriends = game.friends
    .filter((friend) => friend.affection >= 30 && Math.random() <= (friend.affection >= 70 ? 1 : friend.affection >= 50 ? 0.5 : 0.2))
    .map((friend) => {
      const name = generateFriendName(returningNames)
      returningNames.add(name)
      return { ...friend, name, affection: Math.floor(friend.affection / 2), metInLife: game.life + 1 }
    })

  const spiritRoot = generateSpiritRoot(game.character.spiritRoot)
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
    inventory: { herbs: 0, ore: 0, pills: { ...EMPTY_PILL_STOCK } },
    alchemyRecipeId: 'peiyuan',
    breakthroughBonus: 0,
    lifespanBonusYears: 0,
    companionSoulId: null,
    friends: returningFriends,
    lineage,
    actionPlan: null,
    pendingEncounter: null,
    activeAction: null,
  }
  return {
    ...reborn,
    chronicle: addChronicle(reborn, 'reincarnation', `第${reborn.life}世`, `旧梦散去，${game.character.name}携一线因缘再入尘世。`),
  }
}
