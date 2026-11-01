import type { CourseBranch, Knowledge } from '../types';

const branchId = 'assamese';
const refs = ['as-ungegn', 'as-unicode', 'as-phonology'];
const knowledge = (id: string, glyph: string, roman: string, ipa: string, explanation: string, requires: string[] = []): Knowledge => ({
  id: `as-${id}`, courseId: 'bengali', branchId, languageIds: ['as'], kind: 'consonant',
  glyph, roman, ipa, title: `${glyph} · 阿萨姆语`, explanation,
  group: '阿萨姆语 · 字音差异', requires: ['as-overview', ...requires], sources: refs,
});
const letters: Knowledge[] = [
  knowledge('r', 'ৰ', 'r', 'ɹ', '阿萨姆语常用的 r 字母，有区别于孟加拉语 র 的形状；本分支宽式记 /ɹ/。在合字后位也会形成 ৰ-ফলা，如 প্ৰ、ব্ৰ。', ['bn-r']),
  knowledge('w', 'ৱ', 'v', 'w', '阿萨姆语的 /w/ 字母，不要当成孟加拉语 ব。UNGEGN 转写采用 v，IPA 为 /w/；元音之间在具体词里也可弱化。地图 Guwahati 的 w 是惯用名，不是另换一套主转写。', ['bn-b']),
  knowledge('s', 'স', 's', 'x', '本卡记阿萨姆语非合字环境的常见 /x/，而非孟加拉语卡片的 /ʃ/。合字、借词和地区口音仍有变体，不做无条件替换。', ['bn-s']),
  knowledge('sh', 'শ', 'sh', 'x', '与 ষ、স 在很多本族词中合流为 /x/；শিৱসাগৰ 是地名练习。不能把孟加拉语 /ʃ/ 自动套过来。', ['bn-sh']),
  knowledge('ss', 'ষ', 'ṣh', 'x', '保留 UNGEGN 的拼写区别，非合字的常见宽式值为 /x/。合字 ক্ষ 等不能据本卡逐字拼音。', ['bn-ss']),
  knowledge('ch', 'চ', 'ch', 's', '常见阿萨姆语宽式值 /s/，不是孟加拉语 /tʃ/。地图名中的 ch 或 s 与规范转写分别看。', ['bn-ch']),
  knowledge('chh', 'ছ', 'chh', 's', '现代阿萨姆语中常与 চ 合流为 /s/；转写 chh 保留拼写，不要求虚构送气塞擦音。', ['bn-chh']),
  knowledge('j', 'জ', 'j', 'z', '阿萨姆语常见宽式 /z/，与孟加拉语 /dʒ/ 不同；তেজপুৰ 中可练习。', ['bn-j']),
  knowledge('jh', 'ঝ', 'jh', 'z', '现代语中常与 জ 合流；UNGEGN jh 是字母转写，不等于另读 /h/。', ['bn-jh']),
  knowledge('y', 'য', 'j̱', 'z', '独立字母的常见值 /z/，如 যোৰহাট 开头。য-ফলা 与 য় 的条件值另外处理，不能据这个值替换所有合字。', ['bn-y']),
  ...([
    ['t', 'ত', 't', 't', '齿音系列拼写保留，但阿萨姆语常以齿龈位置实现；本分支不标孟加拉语的齿音附标。', 'bn-t'],
    ['th', 'থ', 'th', 'tʰ', '送气清齿龈塞音。与 ঠ 常合流，但两种拼写仍保留。', 'bn-th'],
    ['d', 'দ', 'd', 'd', '浊齿龈塞音；不自动套用孟加拉语的 /d̪/。', 'bn-d'],
    ['dh', 'ধ', 'dh', 'dʱ', '带气声的浊齿龈塞音；ধুবুৰী 的开头。', 'bn-dh'],
    ['retro-t', 'ট', 'ṭ', 't', '传统卷舌系列拼写在现代阿萨姆语通常与 ত 合流。ṭ 区分文字，不强制 /ʈ/。', 'bn-retro-t'],
    ['retro-th', 'ঠ', 'ṭh', 'tʰ', '通常与 থ 合流为送气齿龈塞音，拼写区别仍保留。', 'bn-retro-th'],
    ['retro-d', 'ড', 'ḍ', 'd', '通常与 দ 合流；ডিব্ৰুগড় 用这个起始字母。', 'bn-retro-d'],
    ['retro-dh', 'ঢ', 'ḍh', 'dʱ', '通常与 ধ 合流，不要求按孟加拉语的后移舌位读。', 'bn-retro-dh'],
    ['flap', 'ড়', 'ṙ', 'ɹ', '保留下点拼写，现代常与 r 合流；ডিব্ৰুগড় 的末尾要识别整个 ড়。', 'bn-flap'],
    ['flap-h', 'ঢ়', 'ṙh', 'ɹ', '历史带气声闪音拼写，现代常并入 r；不是把整个字母误认成 ঢ。', 'bn-flap-h'],
  ] as string[][]).map(([id, glyph, roman, ipa, explanation, prerequisite]) => knowledge(id, glyph, roman, ipa, explanation, [prerequisite])),
  { ...knowledge('ri', 'ঋ', 'ṛ', 'ɹi', '梵语来源元音字母，现代阿萨姆语通常读 /ɹi/，不要求音节性 r。', ['bn-ri']), kind: 'vowel' },
  { ...knowledge('ri-sign', '◌ৃ', 'ṛ', 'ɹi', 'ঋ 的附标；字体上与 u 附标不同，实际 r 的实现按阿萨姆语处理。', ['bn-ri-sign']), kind: 'vowel' },
  ...([
    ['e', 'এ', 'e', 'ɛ', 'এ 可对应 /ɛ/ 或受元音和谐影响的 /e/；本卡记 /ɛ/，不把孟加拉语卡片的常见 /e/ 当作唯一值。整词读法另核对。', 'bn-e'],
    ['e-sign', '◌ে', 'e', 'ɛ', 'এ 的元音附标，也有 /ɛ~e/ 的条件变化；তেজপুৰ 中采用 /ɛ/。显示在基字左侧，仍在辅音后读。', 'bn-e-sign'],
    ['o', 'ও', 'o', 'ʊ', 'UNGEGN o 保留拼写；阿萨姆语的常见单元音值为 /ʊ/，不是孟加拉语卡片的 /o/。元音相邻时可参与双元音，不能机械替换地名。', 'bn-o'],
    ['o-sign', '◌ো', 'o', 'ʊ', 'ও 的两侧附标，常见单元音为 /ʊ/；不与孟加拉语 /o/ 卡共用。词中音值与变体要单独核查。', 'bn-o-sign'],
  ] as string[][]).map(([id, glyph, roman, ipa, explanation, prerequisite]) => ({
    ...knowledge(id, glyph, roman, ipa, explanation, [prerequisite]),
    kind: 'vowel' as const, sources: [...refs, 'as-lsp'],
  })),
  knowledge('br', 'ব্ৰ', 'br', 'bɹ', 'ব্ + ৰ；ডিব্ৰুগড় 的 ব্ৰু 要作为完整字块认读。阿萨姆语用 ৰ，不要把形状强行换回孟加拉语 র。', ['bn-hasanta', 'bn-b', 'as-r']),
  knowledge('pr', 'প্ৰ', 'pr', 'pɹ', 'প্ + ৰ；অসমীয়া 的 ৰ-ফলা 与孟加拉语 প্র 对照。辅音之间不插固有元音。', ['bn-hasanta', 'bn-p', 'as-r']),
  knowledge('ndr', 'ন্দ্ৰ', 'ndr', 'ndɹ', 'ন্ + দ্ + ৰ；同一个组合在两种语言里字形与实际齿音位置可以不同，不能复用孟加拉语条目的整段 IPA。', ['bn-hasanta', 'bn-n', 'as-d', 'as-r']),
];
const rules: Knowledge[] = [
  {
    id: 'as-overview', courseId: 'bengali', branchId, languageIds: ['as'], kind: 'rule',
    glyph: 'অসমীয়া · ৰ · ৱ', roman: '', ipa: '', title: '同一文字体系，不同语言', group: '阿萨姆语 · 使用地区',
    sources: refs, requires: ['bn-maps'],
    explanation: '阿萨姆语（অসমীয়া）主要用于印度阿萨姆邦，使用与孟加拉语密切相关的东部婆罗米系文字；Unicode 将两者编码在 Bengali 区块，不表示它们是同一语言。先抓住 ৰ、ৱ，再学习常见字音差异。本分支默认你已掌握主线的固有元音、附标、合字和数字，允许提前学，但不会补写主线成绩。阿萨姆邦巴拉克河谷还广泛使用孟加拉语，不能只看邦名判断招牌语言。',
    rulePrompt: '在阿萨姆邦看到这种文字，是否可以一律按孟加拉语读？',
    ruleAnswer: '不可以，应识别语言与字音差异',
    ruleChoices: ['可以，所有字母的读音都一样', '可以，Unicode 区块名就等于语言名', '看到孟加拉语文字就一定不在印度'],
  },
  {
    id: 'as-nasal', courseId: 'bengali', branchId, languageIds: ['as'], kind: 'rule',
    glyph: 'নগাঁও · বঙাইগাঁও', roman: '', ipa: '', title: '把共用附标放回阿萨姆语词里', group: '阿萨姆语 · 拼读',
    sources: refs, requires: ['as-overview', 'as-r', 'bn-candrabindu', 'bn-signs'],
    explanation: '阿萨姆语也用 ঁ 标元音鼻化、用 ং 表示鼻辅音，用相同的十个数字。নগাঁও、বঙাইগাঁও 中的 গাঁও 是含鼻化的双元音结构，不要把 ঁ 读成额外 /ŋ/。音值取本分支的宽式变体；独立元音 ও 与附标 া 仍须按完整字块辨认。',
    rulePrompt: 'নগাঁও 中的 ঁ 应如何理解？', ruleAnswer: '标记元音鼻化，不另加 /ŋ/',
    ruleChoices: ['它一定是上方的 রেফ', '它让元音变成长音', '它就是独立辅音 ঙ'],
  },
];

type CityRow = [string, string, string, string, string[], [number, number], string[], [string, string][]];
const cities: CityRow[] = [
  ['guwahati', 'গুৱাহাটী', '古瓦哈提', 'ɡuɑɦɑti', ['Guwahati', 'Gauhati'], [91.736, 26.144], ['bn-g', 'bn-u-sign', 'as-w', 'bn-aa-sign', 'bn-h', 'as-retro-t', 'bn-ii-sign'], [['গু', 'gu'], ['ৱা', 'vā'], ['হা', 'hā'], ['টী', 'ṭī']]],
  ['dibrugarh', 'ডিব্ৰুগড়', '迪布鲁格尔', 'dibɹuɡɔɹ', ['Dibrugarh'], [94.912, 27.472], ['as-retro-d', 'bn-i-sign', 'as-br', 'bn-u-sign', 'bn-g', 'as-flap', 'bn-final-vowel'], [['ডি', 'ḍi'], ['ব্ৰু', 'bru'], ['গ', 'ga'], ['ড়', 'ṙa']]],
  ['jorhat', 'যোৰহাট', '焦尔哈特', 'zoɹhat', ['Jorhat'], [94.203, 26.75], ['as-y', 'bn-o-sign', 'as-r', 'bn-h', 'bn-aa-sign', 'as-retro-t', 'bn-final-vowel'], [['যো', 'j̱o'], ['ৰ', 'ra'], ['হা', 'hā'], ['ট', 'ṭa']]],
  ['tezpur', 'তেজপুৰ', '提斯普尔', 'tɛzpuɹ', ['Tezpur'], [92.784, 26.652], ['as-t', 'bn-e-sign', 'as-j', 'bn-p', 'bn-u-sign', 'as-r', 'bn-final-vowel'], [['তে', 'te'], ['জ', 'ja'], ['পু', 'pu'], ['ৰ', 'ra']]],
  ['nagaon', 'নগাঁও', '瑙冈', 'nɔɡãʊ̯', ['Nagaon', 'Nowgong'], [92.685, 26.35], ['bn-n', 'bn-g', 'bn-aa-sign', 'bn-candrabindu', 'bn-o', 'as-nasal'], [['ন', 'na'], ['গাঁ', 'gām̐'], ['ও', 'o']]],
  ['tinsukia', 'তিনিচুকীয়া', '廷苏基亚', 'tinisukia', ['Tinsukia'], [95.36, 27.49], ['as-t', 'bn-i-sign', 'bn-n', 'as-ch', 'bn-u-sign', 'bn-k', 'bn-ii-sign', 'bn-glide', 'bn-aa-sign'], [['তি', 'ti'], ['নি', 'ni'], ['চু', 'chu'], ['কী', 'kī'], ['য়া', 'yā']]],
  ['sivasagar', 'শিৱসাগৰ', '锡布萨格尔', 'xiwɔxaɡɔɹ', ['Sivasagar', 'Sibsagar'], [94.64, 26.985], ['as-sh', 'bn-i-sign', 'as-w', 'as-s', 'bn-aa-sign', 'bn-g', 'as-r', 'bn-final-vowel'], [['শি', 'shi'], ['ৱ', 'va'], ['সা', 'sā'], ['গ', 'ga'], ['ৰ', 'ra']]],
  ['nalbari', 'নলবাৰী', '纳尔巴里', 'nɔlbaɹi', ['Nalbari'], [91.441, 26.445], ['bn-n', 'bn-l', 'bn-b', 'bn-aa-sign', 'as-r', 'bn-ii-sign', 'bn-final-vowel'], [['ন', 'na'], ['ল', 'la'], ['বা', 'bā'], ['ৰী', 'rī']]],
  ['dhubri', 'ধুবুৰী', '杜布里', 'dʱubuɹi', ['Dhubri'], [89.985, 26.019], ['as-dh', 'bn-u-sign', 'bn-b', 'as-r', 'bn-ii-sign'], [['ধু', 'dhu'], ['বু', 'bu'], ['ৰী', 'rī']]],
  ['bongaigaon', 'বঙাইগাঁও', '邦盖冈', 'bɔŋai̯ɡãʊ̯', ['Bongaigaon'], [90.558, 26.477], ['bn-b', 'bn-ng', 'bn-aa-sign', 'bn-i', 'bn-g', 'bn-candrabindu', 'bn-o', 'as-nasal'], [['ব', 'ba'], ['ঙা', 'ṅā'], ['ই', 'i'], ['গাঁ', 'gām̐'], ['ও', 'o']]],
];
const places: Knowledge[] = cities.map(([id, glyph, name, ipa, names, coordinates, requires, segments]) => ({
  id: `as-word-${id}`, courseId: 'bengali', branchId, languageIds: ['as'], kind: 'word', glyph,
  roman: segments.map(segment => segment[1]).join(''), ipa, title: name, meaning: name,
  conventionalNames: names, requires: ['as-overview', ...requires.map(id =>
    ['bn-e-sign', 'bn-o', 'bn-o-sign'].includes(id) ? id.replace('bn-', 'as-') : id)], sources: [...refs, 'as-places'],
  group: '阿萨姆语 · 地名', place: { type: 'city', coordinates, mapId: 'india' },
  explanation: `${id === 'guwahati' ? '本词采用词典列出的 ৱ 弱化变体 /ɡuɑɦɑti/，不是按字母卡机械拼成 /w/。' : ''}印度阿萨姆邦城市的阿萨姆语书写名。规范转写保留字母拼写，地图惯用名另列；IPA 为宽式记音，口音可有差异，尚待母语者独立审读。红点仅表示市区近似位置。`,
  context: '印度 · 阿萨姆邦城市；阿萨姆语词条，不使用孟加拉语设备语音。',
  segments: segments.map(([text, reading]) => ({ text, reading })),
  pronunciation: { speech: { text: glyph, label: `阿萨姆语整词：${glyph}`, lang: 'as' } },
}));

export const assameseItems = [...rules, ...letters, ...places];
const unit = (id: number, title: string, names: string[]) => ({
  id: `assamese-u${id}`, title, subtitle: '阿萨姆语差异 · 含单元综合复习',
  phase: '分支 · 阿萨姆语', items: names.map(name => `as-${name}`),
  note: '主线先修视为已具备，但不修改主线进度。本分支内部按单元顺序学习；同形而字音不同的知识独立记录。',
});
export const assameseBranch: CourseBranch = {
  id: branchId, title: '阿萨姆语', languageId: 'as',
  description: '在孟加拉文基础上学习 অসমীয়া：特有字母、同形异音、合字和阿萨姆邦地名。',
  units: [
    unit(1, '先认出 ৰ、ৱ 与 /x/', ['overview', 'r', 'w', 's', 'sh', 'ss']),
    unit(2, 'চ、জ 系列的阿萨姆语读法', ['ch', 'chh', 'j', 'jh', 'y']),
    unit(3, '齿音、卷舌拼写与现代合流', ['t', 'th', 'd', 'dh', 'retro-t', 'retro-th', 'retro-d', 'retro-dh', 'flap', 'flap-h']),
    unit(4, '元音差异与阿萨姆语合字', ['ri', 'ri-sign', 'e', 'e-sign', 'o', 'o-sign', 'br', 'pr', 'ndr', 'nasal']),
    {
      ...unit(5, '阿萨姆邦 · 10 个重要城市', cities.map(row => `word-${row[0]}`)),
      subtitle: '古瓦哈提、迪布鲁格尔、焦尔哈特等', placeLesson: true, supplementary: true,
    },
  ],
};
