import './App.css'

import { derivedStats, realmRank } from './core/game'
import type { ExploreChoice } from './core/types'
import { maps } from './data/maps'
import { useGameStore } from './store/game-store'

function App() {
  const { player, logs, pendingExplore, notice, explore, resolveExplore, rest, dismissNotice, restart } = useGameStore()
  const stats = derivedStats(player)
  const ageText = `${Math.floor(player.ageDays / 360)} 年 ${Math.floor(player.ageDays % 360 / 30)} 月 ${player.ageDays % 30} 日`

  const resolve = (choice: ExploreChoice) => resolveExplore(choice)
  const eventPanel = () => {
    if (!pendingExplore) return null
    const map = maps.find((entry) => entry.id === pendingExplore.mapId)!
    const actions = pendingExplore.event === 'battle'
      ? <><button className="primary-button" onClick={() => resolve('fight')}>迎战</button><button className="subtle-button" onClick={() => resolve('retreat')}>退避</button></>
      : pendingExplore.event === 'merchant'
        ? <><button className="primary-button" onClick={() => resolve(map.materials[0])}>换取{map.materials[0]}</button><button className="primary-button" onClick={() => resolve(map.materials[1])}>换取{map.materials[1]}</button><button className="primary-button" onClick={() => resolve(map.materials[2])}>换取{map.materials[2]}</button><button className="subtle-button" onClick={() => resolve('leave')}>离开</button></>
        : pendingExplore.event === 'ruin'
          ? <><button className="primary-button" onClick={() => resolve('enter')}>探入遗府</button><button className="subtle-button" onClick={() => resolve('leave')}>谨慎离开</button></>
          : <><button className="primary-button" onClick={() => resolve('invite')}>执礼相邀</button><button className="subtle-button" onClick={() => resolve('ask')}>平常相问</button><button className="subtle-button" onClick={() => resolve('test')}>锋芒相试</button></>
    const title = pendingExplore.event === 'battle' ? `遭遇 · ${map.enemy.name}` : pendingExplore.event === 'merchant' ? '山道游商' : pendingExplore.event === 'ruin' ? '遗府踪迹' : '陌路相逢'
    const copy = pendingExplore.event === 'battle' ? map.enemy.description : pendingExplore.event === 'merchant' ? map.eventText.merchant : pendingExplore.event === 'ruin' ? map.eventText.ruin : '一位陌生修士停下脚步，似乎也察觉到了你的气息。'
    return <div className="overlay" role="dialog" aria-modal="true"><section className="event-card"><p className="eyebrow">探索事件</p><h2>{title}</h2><p>{copy}</p><p className="cost">{pendingExplore.baseDetail}</p><div className="event-actions">{actions}</div></section></div>
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <div><p className="eyebrow">修仙手札 · 第一世</p><h1>{player.name}</h1><p>{player.realm}{player.perfected ? '大圆满' : `${player.level}层`} · {ageText}</p></div>
        <button className="subtle-button" type="button" onClick={restart}>新开一世</button>
      </header>

      <section className="stats" aria-label="角色状态">
        <div><span>灵石</span><strong>{player.resources.spiritStones}</strong></div><div><span>体力</span><strong>{player.resources.stamina}/100</strong></div>
        <div><span>精力</span><strong>{player.resources.focus}/100</strong></div><div><span>生命</span><strong>{player.resources.health}/{stats.maximumHealth}</strong></div>
        <div><span>攻击 / 防御</span><strong>{stats.attack} / {stats.defense}</strong></div><div><span>寿元</span><strong>{Math.floor(player.ageDays / 360)}/{Math.floor(player.lifespanDays / 360)} 年</strong></div>
      </section>

      {player.statuses.lightInjury && <p className="status-note">轻伤：探索体力与炼丹精力消耗 +5，调息或回春类丹药可解除。</p>}

      <section className="panel"><div className="section-heading"><div><p className="eyebrow">探索</p><h2>踏入山河</h2></div><button className="subtle-button" onClick={rest}>调息（7–13 日）</button></div><div className="map-list">
        {maps.map((map) => {
          const unlocked = realmRank(player.realm) >= realmRank(map.realm)
          return <article className="map-row" key={map.id}><div><strong>{map.name}</strong><span>{map.description}</span><small>{map.realm} · 路费 {map.travelCost} · 体力 {map.staminaCost} · {map.actionTier}行动</small></div><button className="primary-button" disabled={!unlocked || Boolean(pendingExplore)} onClick={() => explore(map.id)}>{unlocked ? '探索' : `需${map.realm}`}</button></article>
        })}
      </div></section>

      <section className="panel"><p className="eyebrow">背包</p><h2>材料</h2><dl className="materials">{Object.entries(player.resources.materials).length === 0 ? <p>尚无材料。</p> : Object.entries(player.resources.materials).map(([name, amount]) => <div key={name}><dt>{name}</dt><dd>{amount}</dd></div>)}</dl></section>

      <section className="panel journal"><p className="eyebrow">修行历程</p><h2>最近行动</h2>{logs.length === 0 ? <p>尚未落笔。选择一处已解锁地图，开始这一世的修行。</p> : <ol>{logs.map((entry) => <li key={entry.id}><strong>{entry.title}</strong><span>{entry.detail}</span></li>)}</ol>}</section>
      {eventPanel()}
      {notice && <div className="notice" role="alert"><span>{notice}</span><button type="button" onClick={dismissNotice}>知道了</button></div>}
    </main>
  )
}

export default App
