import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { CharacterCreation } from './components/CharacterCreation'
import { GameShell } from './components/GameShell'
import { useGameStore } from './store/gameStore'

function PwaUpdateNotice() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <aside className="update-notice" role="status">
      <span>新卷已备妥</span>
      <button type="button" onClick={() => void updateServiceWorker(true)}>重新启卷</button>
      <button type="button" className="text-button" onClick={() => setNeedRefresh(false)}>稍后</button>
    </aside>
  )
}

export function App() {
  const game = useGameStore((state) => state.game)
  const hasGame = Boolean(game)
  const hydrated = useGameStore((state) => state.hydrated)
  const hydrate = useGameStore((state) => state.hydrate)
  const tick = useGameStore((state) => state.tick)
  const persistNow = useGameStore((state) => state.persistNow)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hasGame) return
    const timer = window.setInterval(() => tick(), 200)
    const saveOnHide = () => {
      if (document.visibilityState === 'hidden') void persistNow()
    }
    document.addEventListener('visibilitychange', saveOnHide)
    window.addEventListener('pagehide', persistNow)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', saveOnHide)
      window.removeEventListener('pagehide', persistNow)
    }
  }, [hasGame, persistNow, tick])

  if (!hydrated) {
    return (
      <main className="loading-screen">
        <div className="loading-seal">札</div>
        <p>展卷中</p>
      </main>
    )
  }

  return (
    <>
      {game ? <GameShell /> : <CharacterCreation />}
      <PwaUpdateNotice />
    </>
  )
}
