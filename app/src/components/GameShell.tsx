import { useState } from 'react'
import { DIFFICULTIES, REALMS } from '../data/gameData'
import { breakthroughChance, lifespanYears, qiRequirement } from '../core/game'
import { formatAge, formatDuration } from '../core/time'
import type { ActionKind } from '../core/types'
import { useGameStore } from '../store/gameStore'

type Tab = 'cultivate' | 'adventure' | 'alchemy' | 'friends'

const TAB_LABELS: Array<{ id: Tab; label: string; mark: string }> = [
  { id: 'cultivate', label: '修行', mark: '息' },
  { id: 'adventure', label: '游历', mark: '山' },
  { id: 'alchemy', label: '丹炉', mark: '丹' },
  { id: 'friends', label: '因缘', mark: '缘' },
]

const ACTION_LABELS: Record<ActionKind, string> = { cultivate: '修行', adventure: '游历', alchemy: '炼丹' }

function DifficultyPicker({ kind }: { kind: ActionKind }) {
  const game = useGameStore((state) => state.game)!
  const setActionPlan = useGameStore((state) => state.setActionPlan)
  const selected = game.actionPlan?.kind === kind ? game.actionPlan.difficulty : null
  const active = game.activeAction
  const activeConfig = active ? DIFFICULTIES.find((item) => item.id === active.difficulty) : null
  const planConfig = game.actionPlan ? DIFFICULTIES.find((item) => item.id === game.actionPlan?.difficulty) : null
  const blocked = game.actionPlan?.kind === 'alchemy' && game.inventory.herbs < 2
  const queued = Boolean(active && game.actionPlan && (active.kind !== game.actionPlan.kind || active.difficulty !== game.actionPlan.difficulty))

  let planText = '选定方向与难度后，岁序运行时会自动启程。'
  if (blocked) {
    planText = '灵草不足，炼丹计划暂缓；可改选游历补充材料。'
  } else if (active && queued && planConfig) {
    planText = `此程结束后，将自动转为${ACTION_LABELS[game.actionPlan!.kind]}·${planConfig.name}。`
  } else if (active && activeConfig) {
    planText = `正在${ACTION_LABELS[active.kind]}·${activeConfig.name}，结束后会自动续行。`
  } else if (game.actionPlan && planConfig && !game.running) {
    planText = `${ACTION_LABELS[game.actionPlan.kind]}·${planConfig.name}已定，点击“开始”后自动启程。`
  } else if (game.actionPlan && planConfig) {
    planText = `${ACTION_LABELS[game.actionPlan.kind]}·${planConfig.name}已定，正在准备下一程。`
  }

  return (
    <div className="difficulty-section">
      <div className="section-heading">
        <span>择一程</span>
        <small>难度越高，岁月与收获皆重</small>
      </div>
      <div className="difficulty-grid">
        {DIFFICULTIES.map((difficulty) => {
          const locked = game.realmIndex < difficulty.unlockRealm
          return (
            <button
              type="button"
              key={difficulty.id}
              disabled={locked}
              className={selected === difficulty.id ? 'difficulty active' : 'difficulty'}
              onClick={() => setActionPlan(kind, difficulty.id)}
            >
              <span>{difficulty.name}</span>
              <small>{locked ? `${REALMS[difficulty.unlockRealm].name}解锁` : `耗 ${formatAge(difficulty.months)}`}</small>
            </button>
          )
        })}
      </div>
      <p className={blocked ? 'plan-status blocked' : 'plan-status'}>{planText}</p>
    </div>
  )
}

function CultivationPage() {
  const game = useGameStore((state) => state.game)!
  const breakthrough = useGameStore((state) => state.breakthrough)
  const requirement = qiRequirement(game.realmIndex, game.layer, game.perfect)
  const progress = game.perfect ? 100 : Math.min((game.qi / requirement) * 100, 100)
  const nextRealm = REALMS[game.realmIndex + 1]

  return (
    <section className="page-panel reveal" aria-labelledby="cultivation-title">
      <div className="scene-copy">
        <p className="eyebrow">洞府静室</p>
        <h2 id="cultivation-title">吐纳天地一息</h2>
        <p>窗外松声如潮，灵气自四野聚来。每一次周天，都是向天命借来的一步。</p>
      </div>
      <div className="progress-card">
        <div className="progress-meta">
          <span>{game.perfect ? '周天圆满' : `距${game.layer === 10 ? '大圆满' : `${game.layer + 1}层`}`}</span>
          <strong>{game.perfect ? '可叩天关' : `${game.qi.toLocaleString()} / ${requirement.toLocaleString()}`}</strong>
        </div>
        <div className="qi-track"><i style={{ width: `${progress}%` }} /></div>
        {game.perfect && (
          <button className="breakthrough-button" type="button" disabled={Boolean(game.activeAction)} onClick={breakthrough}>
            {nextRealm ? `尝试突破至${nextRealm.name}` : '尝试破界飞升'} · 成功率 {Math.round(breakthroughChance(game) * 100)}%
          </button>
        )}
      </div>
      <DifficultyPicker kind="cultivate" />
    </section>
  )
}

function AdventurePage() {
  const game = useGameStore((state) => state.game)!
  const realm = REALMS[game.realmIndex]

  return (
    <section className="page-panel reveal" aria-labelledby="adventure-title">
      <div className="map-card">
        <span className="map-level">{realm.name}可入</span>
        <div className="map-brush" aria-hidden="true" />
        <p className="eyebrow">当前地界</p>
        <h2 id="adventure-title">{realm.map}</h2>
        <p>山径无人，云深处偶有灵光。所得是机缘还是劫数，只有入山才知。</p>
      </div>
      <div className="satchel-row">
        <span><b>{game.inventory.herbs}</b> 灵草</span>
        <span><b>{game.inventory.ore}</b> 灵矿</span>
        <span><b>{game.friends.length}</b> 故交</span>
      </div>
      <DifficultyPicker kind="adventure" />
    </section>
  )
}

function AlchemyPage() {
  const game = useGameStore((state) => state.game)!
  const takePill = useGameStore((state) => state.takePill)

  return (
    <section className="page-panel reveal" aria-labelledby="alchemy-title">
      <div className="scene-copy alchemy-copy">
        <p className="eyebrow">已得丹方之一</p>
        <h2 id="alchemy-title">培元丹</h2>
        <p>青灵草二株，以文火徐炼。丹成可固本培元，亦可在突破时护住一线道基。</p>
      </div>
      <div className="recipe-card">
        <div>
          <span className="material-symbol">艹</span>
          <p>灵草</p>
          <strong>{game.inventory.herbs} / 2</strong>
        </div>
        <i>入炉</i>
        <div>
          <span className="material-symbol pill-symbol">丹</span>
          <p>培元丹</p>
          <strong>已有 {game.inventory.pills}</strong>
        </div>
      </div>
      <button className="pill-use-button" type="button" disabled={game.inventory.pills < 1} onClick={takePill}>
        <span>服用培元丹</span>
        <small>灵气 +50</small>
      </button>
      <DifficultyPicker kind="alchemy" />
    </section>
  )
}

function FriendsPage() {
  const game = useGameStore((state) => state.game)!

  return (
    <section className="page-panel reveal" aria-labelledby="friends-title">
      <div className="scene-copy">
        <p className="eyebrow">因缘簿</p>
        <h2 id="friends-title">山水有相逢</h2>
        <p>有些人只同行一程，有些魂识却会越过生死，在来世与你再次照面。</p>
      </div>
      {game.friends.length === 0 ? (
        <div className="empty-state">
          <span>缘</span>
          <p>因缘簿尚空。游历山川，或会遇见同道之人。</p>
        </div>
      ) : (
        <div className="friend-list">
          {game.friends.map((friend) => (
            <article key={friend.soulId} className="friend-card">
              <div className="friend-avatar">{friend.name.slice(-1)}</div>
              <div>
                <h3>{friend.name}</h3>
                <p>{friend.title} · {friend.personality}</p>
                <div className="affection-track"><i style={{ width: `${Math.max(friend.affection, 4)}%` }} /></div>
              </div>
              <strong>{friend.affection}</strong>
            </article>
          ))}
        </div>
      )}
      <div className="chronicle-preview">
        <div className="section-heading"><span>近来手札</span><small>点“历”查看全部</small></div>
        {game.chronicle.slice(0, 4).map((entry) => (
          <div className="chronicle-item" key={entry.id}>
            <time>{formatAge(entry.atMonths)}</time>
            <div><strong>{entry.title}</strong><p>{entry.text}</p></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TimeControls() {
  const game = useGameStore((state) => state.game)!
  const setRunning = useGameStore((state) => state.setRunning)
  const setSpeed = useGameStore((state) => state.setSpeed)
  const setIdleMode = useGameStore((state) => state.setIdleMode)

  return (
    <div className="time-controls">
      <button
        type="button"
        className={game.running && !game.idleMode ? 'time-main running' : 'time-main'}
        onClick={() => setRunning(!game.running || game.idleMode)}
      >
        <span>{game.running && !game.idleMode ? 'Ⅱ' : '▷'}</span>
        {game.running && !game.idleMode ? '暂停' : '开始'}
      </button>
      <div className="speed-group" aria-label="岁月倍率">
        {([1, 3, 5] as const).map((speed) => (
          <button key={speed} type="button" className={game.speed === speed && !game.idleMode ? 'active' : ''} onClick={() => setSpeed(speed)}>
            ×{speed}
          </button>
        ))}
      </div>
      <button type="button" className={game.idleMode ? 'idle-button active' : 'idle-button'} onClick={() => setIdleMode(!game.idleMode)}>
        挂机
      </button>
    </div>
  )
}

function ActionOverlay() {
  const game = useGameStore((state) => state.game)!
  if (!game.activeAction) return null
  const total = game.activeAction.endsAt - game.activeAction.startedAt
  const progress = Math.min(Math.max(((Date.now() - game.activeAction.startedAt) / total) * 100, 0), 100)
  const labels: Record<ActionKind, string> = { cultivate: '灵气入脉', adventure: '行于山水', alchemy: '炉火正盛' }

  return (
    <div className="action-overlay" role="status">
      <div className="action-orbit"><i style={{ '--action-progress': `${progress * 3.6}deg` } as React.CSSProperties} /></div>
      <div><strong>{labels[game.activeAction.kind]}</strong><span>{Math.round(progress)}%</span></div>
    </div>
  )
}

function ChronicleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGameStore((state) => state.game)!
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="chronicle-sheet" role="dialog" aria-modal="true" aria-labelledby="chronicle-title" onClick={(event) => event.stopPropagation()}>
        <div className="chronicle-sheet-head">
          <div><p className="eyebrow">第 {game.life} 世</p><h2 id="chronicle-title">修炼历程</h2></div>
          <button type="button" className="mini-seal" aria-label="收起修炼历程" onClick={onClose}>收</button>
        </div>
        <div className="chronicle-list">
          {game.chronicle.map((entry) => (
            <article className="chronicle-item" key={entry.id}>
              <time>第 {entry.life} 世 · {formatAge(entry.atMonths)}</time>
              <div><strong>{entry.title}</strong><p>{entry.text}</p></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function EncounterSheet() {
  const game = useGameStore((state) => state.game)!
  const resolveEncounter = useGameStore((state) => state.resolveEncounter)
  const encounter = game.pendingEncounter
  if (!encounter) return null

  const opportunityChoices = [
    { id: 'observe' as const, label: '静观石刻' },
    { id: 'risk' as const, label: '破禁探幽' },
    { id: 'leave' as const, label: '收敛离去' },
  ]
  const friendChoices = [
    { id: 'invite' as const, label: '执礼相邀' },
    { id: 'greet' as const, label: '平常相问' },
    { id: 'challenge' as const, label: '锋芒相试' },
  ]
  const choices = encounter.kind === 'opportunity' ? opportunityChoices : friendChoices

  return (
    <div className="modal-backdrop encounter-backdrop">
      <section className="encounter-sheet" role="dialog" aria-modal="true" aria-labelledby="encounter-title">
        <div className="encounter-mark">{encounter.kind === 'opportunity' ? '遇' : '缘'}</div>
        <p className="eyebrow">{encounter.kind === 'opportunity' ? '一线机缘' : '山水相逢'}</p>
        <h2 id="encounter-title">{encounter.title}</h2>
        {encounter.friend && (
          <div className="encounter-friend">
            <span>{encounter.friend.name.slice(-1)}</span>
            <p><strong>{encounter.friend.name}</strong>{encounter.friend.title} · {encounter.friend.personality}</p>
          </div>
        )}
        <p className="encounter-copy">{encounter.narrative}</p>
        <div className="encounter-options">
          {choices.map((choice) => (
            <button key={choice.id} type="button" onClick={() => resolveEncounter(choice.id)}>
              <strong>{choice.label}</strong>
            </button>
          ))}
        </div>
        <p className="encounter-note">天机难测。作出选择后，原自动计划会继续推进。</p>
      </section>
    </div>
  )
}

function OfflineSheet() {
  const report = useGameStore((state) => state.offlineReport)
  const dismiss = useGameStore((state) => state.dismissOfflineReport)
  if (!report) return null
  return (
    <div className="modal-backdrop">
      <section className="result-sheet offline-sheet" role="dialog" aria-modal="true" aria-labelledby="offline-title">
        <p className="eyebrow">归来小记</p>
        <h2 id="offline-title">山中无甲子</h2>
        <p>你离开了{formatDuration(report.elapsedMs)}，洞中岁月仍悄然流过。</p>
        <div className="offline-stats">
          <span><b>{formatAge(report.advancedMonths)}</b>岁月</span>
          <span><b>{report.qiGained.toLocaleString()}</b>灵气</span>
        </div>
        {report.capped && <p className="warning-copy">离线推演已达当前境界上限。</p>}
        <button className="primary-action" type="button" onClick={dismiss}>展卷继续</button>
      </section>
    </div>
  )
}

function EndingSheet() {
  const game = useGameStore((state) => state.game)!
  const reincarnate = useGameStore((state) => state.reincarnate)
  const reset = useGameStore((state) => state.reset)
  if (game.phase === 'playing') return null
  const ascended = game.phase === 'ascended'
  return (
    <div className="modal-backdrop ending-backdrop">
      <section className="ending-sheet" role="dialog" aria-modal="true">
        <div className="ending-moon" />
        <p className="eyebrow">第 {game.life} 世</p>
        <h2>{ascended ? '天门已开' : '此世已尽'}</h2>
        <p>{ascended ? '雷海退散，你已行至此界尽头。' : `${game.character.name}合上了眼，山风替你翻过手札的最后一页。`}</p>
        <div className="ending-actions">
          <button className="primary-action" type="button" onClick={reincarnate}>转世重修</button>
          <button className="text-button" type="button" onClick={() => void reset()}>开新游戏</button>
        </div>
      </section>
    </div>
  )
}

export function GameShell() {
  const game = useGameStore((state) => state.game)!
  const reset = useGameStore((state) => state.reset)
  const [tab, setTab] = useState<Tab>('cultivate')
  const [chronicleOpen, setChronicleOpen] = useState(false)
  const realm = REALMS[game.realmIndex]

  return (
    <main className="game-app">
      <header className="status-header">
        <div>
          <p>第 {game.life} 世 · {game.character.personality}</p>
          <h1>{game.character.name}</h1>
        </div>
        <div className="header-actions">
          <button className="mini-seal" type="button" aria-label="查看修炼历程" onClick={() => setChronicleOpen(true)}>历</button>
          <button className="mini-seal" type="button" aria-label="开新游戏" onClick={() => {
            if (window.confirm('此举会清空全部世系记录，确定开新游戏吗？')) void reset()
          }}>新</button>
        </div>
      </header>

      <section className="identity-card reveal">
        <div className="realm-disc"><span>{realm.name.slice(0, 1)}</span></div>
        <div className="identity-main">
          <p>{game.character.spiritRoot.name} · {game.character.spiritRoot.elements.join('、')}属</p>
          <h2>{realm.name}{game.perfect ? '大圆满' : `${game.layer}层`}</h2>
          <div className="age-line">
            <span>寿元</span>
            <strong>{formatAge(game.ageMonths)}</strong>
            <i>/ {lifespanYears(game)}年</i>
          </div>
        </div>
        <div className="aptitude-stamp">
          <span>资质</span>
          <strong>{game.character.spiritRoot.aptitude}</strong>
        </div>
      </section>

      <div className="content-stage">
        {tab === 'cultivate' && <CultivationPage />}
        {tab === 'adventure' && <AdventurePage />}
        {tab === 'alchemy' && <AlchemyPage />}
        {tab === 'friends' && <FriendsPage />}
      </div>

      <nav className="bottom-nav" aria-label="主要玩法">
        {TAB_LABELS.map((item) => (
          <button type="button" key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            <span>{item.mark}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <TimeControls />
      <ActionOverlay />
      <ChronicleSheet open={chronicleOpen} onClose={() => setChronicleOpen(false)} />
      <EncounterSheet />
      <OfflineSheet />
      <EndingSheet />
    </main>
  )
}
