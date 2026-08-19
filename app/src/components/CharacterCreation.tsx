import { useState } from 'react'
import { PERSONALITIES } from '../data/gameData'
import type { Gender, Personality } from '../core/types'
import { useGameStore } from '../store/gameStore'

const SUGGESTED_NAMES = ['李青云', '沈照微', '顾长风', '闻人雪', '宁知白', '叶藏秋']
const GENDERS: Gender[] = ['男', '女', '无定']

export function CharacterCreation() {
  const createCharacter = useGameStore((state) => state.createCharacter)
  const [name, setName] = useState('李青云')
  const [gender, setGender] = useState<Gender>('无定')
  const [personality, setPersonality] = useState<Personality>('豁达')

  const randomName = () => setName(SUGGESTED_NAMES[Math.floor(Math.random() * SUGGESTED_NAMES.length)])
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const normalized = name.trim()
    if (!normalized) return
    createCharacter({ name: normalized, gender, personality })
  }

  return (
    <main className="creation-screen">
      <div className="mountain mountain-back" />
      <div className="mountain mountain-front" />
      <section className="creation-card reveal">
        <div className="vertical-mark">太初有道</div>
        <p className="eyebrow">一卷未题之札</p>
        <h1>修仙手札</h1>
        <p className="creation-intro">此去山长水远，姓名、根骨与因缘，皆从这一笔开始。</p>

        <form onSubmit={submit}>
          <label className="field-label" htmlFor="character-name">姓名称谓</label>
          <div className="name-field">
            <input
              id="character-name"
              value={name}
              maxLength={8}
              onChange={(event) => setName(event.target.value)}
              placeholder="题下姓名"
            />
            <button type="button" className="ink-button quiet" onClick={randomName}>随缘</button>
          </div>

          <fieldset>
            <legend>此身性别</legend>
            <div className="choice-row">
              {GENDERS.map((item) => (
                <button
                  key={item}
                  className={gender === item ? 'choice active' : 'choice'}
                  type="button"
                  onClick={() => setGender(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>心性</legend>
            <div className="personality-grid">
              {PERSONALITIES.map((item) => (
                <button
                  key={item}
                  className={personality === item ? 'choice active' : 'choice'}
                  type="button"
                  onClick={() => setPersonality(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="fate-note">
            <span>灵根</span>
            <p>入世时由天机随机生成，每一世皆不相同。</p>
          </div>

          <button className="seal-button" type="submit" disabled={!name.trim()}>
            <span>入</span>
            开此一世
          </button>
        </form>
      </section>
      <p className="creation-footnote">三息一月，岁序不待人</p>
    </main>
  )
}
