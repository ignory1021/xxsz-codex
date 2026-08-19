import type { DifficultyConfig, OpportunityTemplate, Personality, PillRecipe, RealmConfig } from '../core/types'

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

export const PILL_RECIPES: PillRecipe[] = [
  { id: 'peiyuan', name: '培元丹', unlockRealm: 0, herbsCost: 2, oreCost: 0, effect: 'qi', effectValue: 50, description: '温养经脉，适合初入仙途时稳固根基。' },
  { id: 'ningyuan', name: '凝元丹', unlockRealm: 1, herbsCost: 3, oreCost: 1, effect: 'qi', effectValue: 200, description: '灵元凝练，可助筑基修士积蓄道基。' },
  { id: 'jinsui', name: '净灵丹', unlockRealm: 2, herbsCost: 4, oreCost: 2, effect: 'purify', effectValue: 1, description: '洗去一分驳杂灵性，使灵根更为纯粹。' },
  { id: 'yinghua', name: '悟道丹', unlockRealm: 3, herbsCost: 5, oreCost: 3, effect: 'insight', effectValue: 2, description: '一缕道韵归于识海，可助元婴参悟天地。' },
  { id: 'huashen', name: '延寿丹', unlockRealm: 4, herbsCost: 6, oreCost: 4, effect: 'lifespan', effectValue: 20, description: '药性绵长，能为此世再续一段寿元。' },
  { id: 'xuling', name: '虚灵丹', unlockRealm: 5, herbsCost: 7, oreCost: 5, effect: 'qi', effectValue: 20_000, description: '药性缥缈，能引天外清灵之气入体。' },
  { id: 'hedao', name: '破境丹', unlockRealm: 6, herbsCost: 8, oreCost: 6, effect: 'breakthrough', effectValue: 0.15, description: '将药力封入道基，为下一次叩关护住一线清明。' },
  { id: 'dacheng', name: '洗髓丹', unlockRealm: 7, herbsCost: 9, oreCost: 7, effect: 'aptitude', effectValue: 1, description: '重洗经脉根骨，缓慢提升灵根资质。' },
  { id: 'bijie', name: '避劫丹', unlockRealm: 8, herbsCost: 10, oreCost: 8, effect: 'breakthrough', effectValue: 0.3, description: '雷火淬成，蕴有抵御天威的一线药力。' },
]

export const EMPTY_PILL_STOCK = {
  peiyuan: 0,
  ningyuan: 0,
  jinsui: 0,
  yinghua: 0,
  huashen: 0,
  xuling: 0,
  hedao: 0,
  dacheng: 0,
  bijie: 0,
}

export const PERSONALITIES: Personality[] = ['豪迈', '谨慎', '豁达', '温和', '孤僻', '清冷']

export const ROOT_ELEMENTS = ['金', '木', '水', '火', '土']

export const FRIEND_SURNAMES = [
  '顾', '沈', '陆', '谢', '闻人', '裴', '晏', '苏', '宁', '叶', '萧', '温',
  '秦', '白', '柳', '宋', '霍', '程', '钟离', '姜', '商', '傅', '容', '燕',
]

export const FRIEND_GIVEN_NAMES = [
  '长风', '照微', '观澜', '无咎', '青萝', '玄度', '停云', '知白', '藏秋', '明夷', '令仪', '怀瑾',
  '云岫', '星河', '遥岑', '临川', '修远', '昭华', '清晏', '扶摇', '栖梧', '逐月', '寒山', '既明',
]

export const ADVENTURE_FINDINGS = [
  '石隙间生着一株叶脉泛青的灵草。',
  '溪声忽近，你在水底摸得一块温润灵玉。',
  '古树下埋着半截残简，字迹已不可辨。',
  '远处剑光一闪，有人与你遥遥见礼。',
]

export const OPPORTUNITY_EVENTS: OpportunityTemplate[] = [
  { id: 'spirit-tablet', title: '灵光乍现', narrative: '吐纳将歇时，识海忽现一方残碑。碑文若隐若现，似在等待你的回应。' },
  { id: 'misty-manor', title: '雾中遗府', narrative: '云雾深处，一扇半掩的石门浮现眼前。门内灵机流转，亦有难辨的凶险。' },
  { id: 'moon-well', title: '月井回声', narrative: '山坳古井映出一轮白月，井底传来与你呼吸相合的低吟。' },
  { id: 'sword-trace', title: '断崖剑痕', narrative: '绝壁上留有一道久不散去的剑痕，靠近时连风声都变得锋利。' },
  { id: 'jade-butterfly', title: '玉蝶引路', narrative: '一只玉色灵蝶绕袖三匝，随后向密林深处翩然飞去。' },
  { id: 'ancient-lamp', title: '荒祠孤灯', narrative: '废弃山祠中尚燃着一盏青灯，灯焰随你的心念忽明忽暗。' },
  { id: 'dragon-pool', title: '龙潭雾起', narrative: '潭水无风自皱，水雾凝成旧日修士的模糊背影。' },
  { id: 'star-sand', title: '星砂入梦', narrative: '夜行时有细碎星砂落在掌心，闭目便见一条陌生的登天路。' },
  { id: 'empty-boat', title: '空舟渡岸', narrative: '江雾中漂来一叶无人的小舟，船头放着一枚温热的玉简。' },
  { id: 'pine-guest', title: '松下棋局', narrative: '古松根旁残留半局黑白，棋子间隐有灵机牵引神识。' },
  { id: 'thunder-stone', title: '雷纹奇石', narrative: '雨后山石裂开一道雷纹，指尖靠近时经脉微微发麻。' },
  { id: 'snow-lotus', title: '雪谷幽莲', narrative: '寒谷尽头一株幽莲在雪中绽放，花心却藏着难以辨明的暗影。' },
  { id: 'mirror-lake', title: '镜湖前尘', narrative: '湖面平滑如镜，映出的却不是此刻的你，而是一段陌生往事。' },
  { id: 'wind-chime', title: '风铃古道', narrative: '荒道尽头悬着一串铜铃，铃声每响一次，四周灵气便浓上一分。' },
  { id: 'cloud-ladder', title: '云阶半现', narrative: '晨雾散开时，山巅显出几级通往云中的石阶，转眼又将隐没。' },
  { id: 'blood-maple', title: '赤枫传讯', narrative: '一片赤枫叶落入掌中，叶脉自行游走，拼出一段残缺的指引。' },
  { id: 'bone-flute', title: '古笛余韵', narrative: '枯藤下埋着一支旧笛，未曾吹奏，耳边却已响起清越余韵。' },
  { id: 'fire-rat', title: '火鼠献珠', narrative: '丹火将熄之际，一只赤毛小兽衔着黯淡珠子从炉后探出头来。' },
  { id: 'river-lantern', title: '冥河灯影', narrative: '夜渡时河面飘来一盏未点的莲灯，灯中封着一缕淡淡神识。' },
  { id: 'heavenly-script', title: '天书残页', narrative: '石缝中飞出半页金纸，其上符文流转，似乎只容一人参悟。' },
]
