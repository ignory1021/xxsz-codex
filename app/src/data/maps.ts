import type { MapDefinition } from '../core/types'

export const maps: readonly MapDefinition[] = [
  { id: 'qinglan', name: '青岚山谷', realm: '练气', actionTier: '基础', travelCost: 12, staminaCost: 15, enemy: { name: '裂风山猿', attack: 14, defense: 8, health: 45 }, materials: ['青灵草', '赤参须', '碎灵砂'] },
  { id: 'wuyin', name: '雾隐药圃', realm: '筑基', actionTier: '基础', travelCost: 12, staminaCost: 15, enemy: { name: '毒瘴灵蟾', attack: 29, defense: 17, health: 100 }, materials: ['灵露花', '白玉菌', '百年藤芯'] },
  { id: 'chiyan', name: '赤岩矿脉', realm: '金丹', actionTier: '中阶', travelCost: 35, staminaCost: 20, enemy: { name: '赤甲岩蜥', attack: 45, defense: 35, health: 210 }, materials: ['火纹石', '金髓矿', '冰泉露'] },
  { id: 'xuanshui', name: '玄水遗府', realm: '元婴', actionTier: '中阶', travelCost: 35, staminaCost: 20, enemy: { name: '玄水鳄妖', attack: 74, defense: 65, health: 400 }, materials: ['紫霞芝', '玄龟甲片', '月华草'] },
  { id: 'yunmeng', name: '云梦泽', realm: '化神', actionTier: '中阶', travelCost: 35, staminaCost: 20, enemy: { name: '沼泽龙蟒', attack: 115, defense: 110, health: 720 }, materials: ['青冥果', '龙鳞木', '地心髓'] },
  { id: 'duankong', name: '断空古道', realm: '炼虚', actionTier: '高阶', travelCost: 80, staminaCost: 25, enemy: { name: '裂空妖隼', attack: 180, defense: 180, health: 1200 }, materials: ['空灵花', '星砂', '玄阴泉'] },
  { id: 'hetian', name: '合天墟', realm: '合体', actionTier: '高阶', travelCost: 80, staminaCost: 25, enemy: { name: '天墟战傀', attack: 250, defense: 280, health: 1900 }, materials: ['合道莲', '天罡晶', '万年药藤'] },
  { id: 'jiuxiao', name: '九霄药境', realm: '大乘', actionTier: '高阶', travelCost: 80, staminaCost: 25, enemy: { name: '九霄玄鹿', attack: 360, defense: 420, health: 2800 }, materials: ['九霄露', '太初石', '轮回木'] },
  { id: 'jieyun', name: '劫云天渊', realm: '渡劫', actionTier: '高阶', travelCost: 80, staminaCost: 25, enemy: { name: '劫雷蛟', attack: 590, defense: 600, health: 3000 }, materials: ['劫雷砂', '混沌莲子', '仙髓'] },
]

export const mapById = new Map(maps.map((map) => [map.id, map]))
