import './App.css'

import { maximumHealth } from './core/game'
import { mapById } from './data/maps'
import { useGameStore } from './store/game-store'

const qinglan = mapById.get('qinglan')

function App() {
  const { player, logs, notice, explore, dismissNotice, restart } = useGameStore()
  const maxHealth = maximumHealth(player)

  return (
    <main className="game-shell">
      <header className="game-header">
        <div>
          <p className="eyebrow">修仙手札 · MVP</p>
          <h1>{player.name}</h1>
          <p>{player.realm}一层 · {player.ageDays} 日</p>
        </div>
        <button className="subtle-button" type="button" onClick={restart}>重新开局</button>
      </header>

      <section className="stats" aria-label="角色状态">
        <div><span>灵石</span><strong>{player.resources.spiritStones}</strong></div>
        <div><span>体力</span><strong>{player.resources.stamina}</strong></div>
        <div><span>神识</span><strong>{player.resources.focus}</strong></div>
        <div><span>生命</span><strong>{player.resources.health} / {maxHealth}</strong></div>
      </section>

      <section className="panel">
        <p className="eyebrow">当前行动</p>
        <h2>{qinglan?.name ?? '青岚山'}</h2>
        <p>练气期的基础探索地图，产出三种基础炼丹材料。</p>
        <p className="cost">消耗：12 灵石 · 15 体力 · 20–40 日</p>
        <button className="primary-button" type="button" onClick={() => explore('qinglan')}>前往探索</button>
      </section>

      <section className="panel">
        <p className="eyebrow">背包</p>
        <h2>基础材料</h2>
        <dl className="materials">
          {Object.entries(player.resources.materials).map(([element, amount]) => (
            <div key={element}><dt>{element}</dt><dd>{amount}</dd></div>
          ))}
        </dl>
      </section>

      <section className="panel journal">
        <p className="eyebrow">行记</p>
        <h2>最近行动</h2>
        {logs.length === 0 ? <p>尚未落笔。前往青岚山，开始这一世的修行。</p> : (
          <ol>
            {logs.map((log) => <li key={log.id}><strong>{log.title}</strong><span>{log.detail}</span></li>)}
          </ol>
        )}
      </section>

      {notice && <div className="notice" role="alert"><span>{notice}</span><button type="button" onClick={dismissNotice}>知道了</button></div>}
    </main>
  )
}

export default App
