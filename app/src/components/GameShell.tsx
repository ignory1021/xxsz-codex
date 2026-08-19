import { useState } from 'react'
import { DIFFICULTIES, REALMS } from '../data/gameData'
import { breakthroughChance, qiRequirement } from '../core/game'
import { formatAge, formatDuration } from '../core/time'
import type { ActionKind, Difficulty } from '../core/types'
import { useGameStore } from '../store/gameStore'

type Tab = 'cultivate' | 'adventure' | 'alchemy' | 'friends'

const TAB_LABELS: Array<{ id: Tab; label: string; mark: string }> = [
  { id: 'cultivate', label: '修行', mark: '息' },
  { id: 'adventure', label: '游历', mark: '山' },
  { id: 'alchemy', label: '丹炉', mark: '丹' },
  { id: 'friends', label: '因缘', mark: '缘' },
]

function DifficultyPicker({ kind, selected, onSelect }: { kind: ActionKind; selected: Difficulty; onSelect: (difficulty: Difficulty) => void }) {
  const game = useGameStore((state) => state.game)!
  const beginAction = useGameStore((state) => state.beginAction)

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
              onClick={() => onSelect(difficulty.id)}
            >
              <span>{difficulty.name}</span>
              <small>{locked ? `${REALMS[difficulty.unlockRealm].name}解锁` : `耗 ${formatAge(difficulty.months)}`}</small>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="primary-action"
        disabled={!game.running || Boolean(game.activeAction) || game.phase !== 'playing' || (kind === 'alchemy' && game.inventory.herbs < 2)}
        onClick={() => beginAction(kind, selected)}
      >
        {!game.running ? '岁序暂停中' : game.activeAction ? '此行尚未归来' : kind === 'cultivate' ? '运转周天' : kind === 'adventure' ? '踏入山中' : game.inventory.herbs < 2 ? '灵草不足' : '引火开炉'}
      </button>
    </div>
  )
}

function CultivationPage() {
  const game = useGameStore((state) => state.game)!
  const breakthrough = useGameStore((state) => state.breakthrough)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const requirement = qiRequirement(game.realmIndex, game.layer, game.perfect)
  const progress = game.perfect ? 100 : Math.min((game.qi / requirement) * 100, 100)

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
            尝试突破 · 成功率 {Math.round(breakthroughChance(game) * 100)}%
          </button>
        )}
      </div>
      <DifficultyPicker kind="cultivate" selected={difficulty} onSelect={setDifficulty} />
    </section>
  )
}

function AdventurePage() {
  const game = useGameStore((state) => state.game)!
  const [difficulty, setDifficulty] = useState<Difficulty>('light')
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
      <DifficultyPicker kind="adventure" selected={difficulty} onSelect={setDifficulty} />
    </section>
  )
}

function AlchemyPage() {
  const game = useGameStore((state) => state.game)!
  const [difficulty, setDifficulty] = useState<Difficulty>('light')

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
      <DifficultyPicker kind="alchemy" selected={difficulty} onSelect={setDifficulty} />
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
        <div className="section-heading"><span>近来大事</span><small>第 {game.life} 世</small></div>
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

function ResultSheet() {
  const result = useGameStore((state) => state.result)
  const dismiss = useGameStore((state) => state.dismissResult)
  if (!result) return null
  return (
    <div className="modal-backdrop" role="presentation" onClick={dismiss}>
      <section className="result-sheet" role="dialog" aria-modal="true" aria-labelledby="result-title" onClick={(event) => event.stopPropagation()}>
        <div className="result-mark">{result.kind === 'cultivate' ? '息' : result.kind === 'adventure' ? '遇' : '丹'}</div>
        <p className="eyebrow">此行已结</p>
        <h2 id="result-title">{result.title}</h2>
        <p>{result.narrative}</p>
        <div className="reward-list">
          {result.rewards.map((reward) => <span key={reward}>{reward}</span>)}
        </div>
        <button className="primary-action" type="button" onClick={dismiss}>收入手札</button>
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
  const realm = REALMS[game.realmIndex]

  return (
    <main className="game-app">
      <header className="status-header">
        <div>
          <p>第 {game.life} 世 · {game.character.personality}</p>
          <h1>{game.character.name}</h1>
        </div>
        <button className="mini-seal" type="button" aria-label="开新游戏" onClick={() => {
          if (window.confirm('此举会清空全部世系记录，确定开新游戏吗？')) void reset()
        }}>新</button>
      </header>

      <section className="identity-card reveal">
        <div className="realm-disc"><span>{realm.name.slice(0, 1)}</span></div>
        <div className="identity-main">
          <p>{game.character.spiritRoot.name} · {game.character.spiritRoot.elements.join('、')}属</p>
          <h2>{realm.name}{game.perfect ? '大圆满' : `${game.layer}层`}</h2>
          <div className="age-line">
            <span>寿元</span>
            <strong>{formatAge(game.ageMonths)}</strong>
            <i>/ {realm.lifespanYears}年</i>
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
      <ResultSheet />
      <OfflineSheet />
      <EndingSheet />
    </main>
  )
}
