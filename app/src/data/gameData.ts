import type { DifficultyConfig, Personality, RealmConfig } from '../core/types'

export const REALMS: RealmConfig[] = [
  { name: '练气', lifespanYears: 70, lifespanLayerGainYears: 8, offlineCapYears: 30, qiStart: 100, qiEnd: 300, qiPerfect: 500, map: '青岚山谷' },
  { name: '筑基', lifespanYears: 150, lifespanLayerGainYears: 16, offlineCapYears: 50, qiStart: 500, qiEnd: 1_500, qiPerfect: 2_500, map: '迷雾古洞' },
  { name: '金丹', lifespanYears: 300, lifespanLayerGainYears: 22, offlineCapYears: 100, qiStart: 2_500, qiEnd: 6_500, qiPerfect: 12_500, map: '赤焰雪岭' },
  { name: '元婴', lifespanYears: 500, lifespanLayerGainYears: 55, offlineCapYears: 300, qiStart: 12_500, qiEnd: 32_500, qiPerfect: 62_500, map: '星辰秘境' },
  { name: '化神', lifespanYears: 1_000, lifespanLayerGainYears: 110, offlineCapYears: 500, qiStart: 60_000, qiEnd: 150_000, qiPerfect: 300_000, map: '仙府遗址' },
  { name: '炼虚', lifespanYears: 2_000, lifespanLayerGainYears: 160, offlineCapYears: 1_000, qiStart: 300_000, qiEnd: 900_000, qiPerfect: 1_500_000, map: '天外天' },
  { name: '合体', lifespanYears: 3_500, lifespanLayerGainYears: 220, offlineCapYears: 2_000, qiStart: 1_500_000, qiEnd: 3_500_000, qiPerfect: 7_500_000, map: '无垠虚空' },
  { name: '大乘', lifespanYears: 5_500, lifespanLayerGainYears: 250, offlineCapYears: 3_000, qiStart: 7_500_000, qiEnd: 22_500_000, qiPerfect: 40_000_000, map: '神域边缘' },
  { name: '渡劫', lifespanYears: 8_000, lifespanLayerGainYears: 200, offlineCapYears: 5_000, qiStart: 40_000_000, qiEnd: 100_000_000, qiPerfect: 200_000_000, map: '九霄雷海' },
]

export const DIFFICULTIES: DifficultyConfig[] = [
  { id: 'light', name: '小周天', months: 1, baseQi: 10, durationMs: 2_400, unlockRealm: 0 },
  { id: 'medium', name: '入定', months: 3, baseQi: 40, durationMs: 3_200, unlockRealm: 0 },
  { id: 'heavy', name: '闭关', months: 12, baseQi: 200, durationMs: 5_600, unlockRealm: 1 },
  { id: 'extreme', name: '忘岁', months: 60, baseQi: 1_200, durationMs: 8_000, unlockRealm: 2 },
]

export const PERSONALITIES: Personality[] = ['豪迈', '谨慎', '豁达', '温和', '孤僻', '清冷']

export const ROOT_ELEMENTS = ['金', '木', '水', '火', '土']

export const FRIEND_NAMES = ['谢无咎', '闻人雪', '陆观澜', '沈照微', '裴玄度', '晏青萝']

export const ADVENTURE_FINDINGS = [
  '石隙间生着一株叶脉泛青的灵草。',
  '溪声忽近，你在水底摸得一块温润灵玉。',
  '古树下埋着半截残简，字迹已不可辨。',
  '远处剑光一闪，有人与你遥遥见礼。',
]
