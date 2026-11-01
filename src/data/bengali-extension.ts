import type { Knowledge, Unit } from '../types';

const refs = ['bn-unicode', 'bn-script', 'bn-ungegn'];
const pre = (names: string[]) => names.map(name => `bn-${name}`);
const cluster = (id: string, glyph: string, roman: string, ipa: string, requires: string[], explanation: string): Knowledge => ({
  id: `bn-${id}`, courseId: 'bengali', kind: 'consonant', glyph, roman, ipa,
  title: `${glyph} · 地名常见合字`, group: '地名常见合字', sources: refs,
  requires: pre(['hasanta', ...requires]), explanation,
});

export const bengaliExtensionItems: Knowledge[] = [
  {
    id: 'bn-candrabindu', courseId: 'bengali', kind: 'symbol', glyph: '◌ঁ', roman: 'm̐', ipa: '',
    title: 'ঁ · 鼻化附标', group: '书写附标', sources: refs, requires: pre(['nasal-signs']),
    explanation: 'চন্দ্রবিন্দু（candrabindu）是上方的月牙加点，表示所属元音鼻化；它没有独立辅音音值。চাঁ 的元音可记 /ã/，চাঁদপুর 中能实际练习。不要把它与 ং /ŋ/、两点的 ঃ 或上方 রেফ 混淆；孟加拉国部分口音的鼻化较弱。转写 m̐ 是本方案的鼻化记号，不是在词里另读 /m/。',
  },
  {
    id: 'bn-reph', courseId: 'bengali', kind: 'rule', glyph: 'র্ক · র্ম · র্দ',
    roman: '', ipa: '', title: '上方的 রেফ 不是延音号', group: '书写与拼读', sources: refs,
    requires: pre(['hasanta', 'r']),
    explanation: '看到像上方弯钩、倒过来延音号的笔画时，可以先检查是否是 রেফ（reph）。它来自前置 র্：র্ + ক → র্ক，先读 r，再读后面的辅音，不是把元音拉长；后置 র 则形成 ক্র 那样的 র-ফলা。字体会改变弯钩形状；没有具体图片不能断言所有相似符号都是 reph，ঁ、ৈ、ৌ 的上方笔画也应分别识别。',
    rulePrompt: 'র্ক 顶部的 reph 来自哪个顺序？', ruleAnswer: 'র্ 在 ক 前面',
    ruleChoices: ['ক 后面加元音长音号', 'ক 后面再读 র', '只表示鼻化，不表示辅音'],
  },
  {
    id: 'bn-visarga', courseId: 'bengali', kind: 'rule', glyph: 'দুঃখ · ঃ',
    roman: '', ipa: '', title: 'ঃ 不是冒号，也不是固定的 h', group: '书写与拼读', sources: refs,
    requires: pre(['nasal-signs', 'h']),
    explanation: 'বিসর্গ（visarga）是上下两点的附标，不能当标点冒号，也不能与 ং、ঁ 混为一谈。在 দুঃখ 中参与后续送气辅音的重叠，不一定单独读 /h/。本课学习辨认和条件性行为，不给这个附标伪造一个到处适用的独立音值。ৌ 右侧的 ৗ 则属于元音附标结构，不是另一个声调或延音号。',
    rulePrompt: '看到 ঃ，应怎样判断读音？', ruleAnswer: '结合具体词，不能一律读 h',
    ruleChoices: ['永远是元音延长', '永远等于 ং 的 /ŋ/', '它只是标点冒号'],
  },
  cluster('rk', 'র্ক', 'rk', 'ɾk', ['reph', 'k'], 'র্ + ক；上方 reph 先读 r。与后置 র 的 ক্র 对照，不把弯钩当延音号。'),
  cluster('rm', 'র্ম', 'rm', 'ɾm', ['reph', 'm'], 'র্ + ম；r 在 m 前。看到 রেফ 时按完整音节块认读，不按笔画位置排序。'),
  cluster('rd', 'র্দ', 'rd', 'ɾd̪', ['reph', 'd'], 'র্ + দ；r 在齿音 d 前。字形在不同印刷体中可以变化。'),
  cluster('br', 'ব্র', 'br', 'bɾ', ['b', 'r'], 'ব্ + র；ব 后的 র-ফলা。在 ব্রাহ্মণবাড়িয়া 的开头实际练习。'),
  cluster('kshm', 'ক্ষ্ম', 'kṣhm', 'kʰː', ['ksh', 'm'], 'ক্ + ষ্ + ম；本卡只取 লক্ষ্মীপুর 中的 /kʰː/：ম 不独立读出，不能拼成 /kʃm/。其他词的读法需另查。'),
  cluster('hm', 'হ্ম', 'hm', 'mː', ['h', 'm'], 'হ্ + ম；本卡取 ব্রাহ্মণবাড়িয়া 中常见的 /mː/，另有保留气声的变体。拼写中的 h 不保证独立发 /h/。'),
  cluster('ndr', 'ন্দ্র', 'ndr', 'nd̪ɾ', ['nd', 'r'], 'ন্ + দ্ + র；চন্দননগর 没有这个合字，但 চন্দ্র 的结构有它。课程用 চন্দ্র 的整体示例比较鼻音、齿塞音与 র-ফলা。'),
  cluster('ndh', 'ন্ধ', 'ndh', 'nd̪ʱ', ['n', 'dh'], 'ন্ + ধ；送气/气声属于后面的 ধ，不是普通 ন্দ。'),
  cluster('ss-t', 'ষ্ট', 'ṣhṭ', 'ʃʈ', ['ss', 'retro-t'], 'ষ্ + ট；কুষ্টিয়া 中常见 /ʃʈ/。不要混同借词中的 স্ট /sʈ/ 或齿音 স্ত /st̪/。'),
  cluster('shr', 'শ্র', 'shr', 'ʃɾ', ['sh', 'r'], 'শ্ + র；শ্রীরামপুর 中的开头。শ্রী 是地名和尊称中的常见书写块。'),
  cluster('ks', 'ক্স', 'ks', 'ks', ['k', 's', 's-reading'], 'ক্ + স；কক্সবাজার 用它表示 /ks/。它与 ক্ষ 的拼写、常见读音都不同。'),
];

export const bengaliExtensionUnits: Unit[] = [
  {
    id: 'bengali-u19', title: '认清上方弯钩与附标', subtitle: 'রেফ · ঁ · ঃ · র্ক · র্ম · র্দ',
    phase: '04 · 高频合字', items: pre(['candrabindu', 'reph', 'visarga', 'rk', 'rm', 'rd']),
    note: '辨认 reph、鼻化和 visarga；它们不是通用延音号。未知实景符号仍需结合截图与完整词核对。',
  },
  {
    id: 'bengali-u20', title: '大地名里的复合结构', subtitle: 'ব্র · ক্ষ্ম · হ্ম · ন্দ্র · ন্ধ · ষ্ট · শ্র · ক্স',
    phase: '04 · 高频合字', items: pre(['br', 'kshm', 'hm', 'ndr', 'ndh', 'ss-t', 'shr', 'ks']),
    note: '以完整合字辨认，不逐字符猜发音。ক্ষ্ম、হ্ম 的音值有词汇条件，地名中继续练习。',
  },
];

type PlaceRow = [
  id: string, glyph: string, name: string, names: string[], ipa: string, coordinates: [number, number],
  requires: string[], segments: [string, string][], note: string,
];
// Romanization is authored segment by segment, never generated from code points.
const bangladesh: PlaceRow[] = [
  ['chandpur', 'চাঁদপুর', '坚德布尔', ['Chandpur'], 'tʃãd̪puɾ', [90.65, 23.23], ['ch', 'aa-sign', 'candrabindu', 'd', 'p', 'u-sign', 'r', 'final-vowel'], [['চাঁ', 'chām̐'], ['দ', 'da'], ['পু', 'pu'], ['র', 'ra']], '河港城市；ঁ 表示元音鼻化，不是 ং 的 /ŋ/。'],
  ['brahmanbaria', 'ব্রাহ্মণবাড়িয়া', '布拉曼巴里亚', ['Brahmanbaria'], 'bɾamːonbaɽi̯a', [91.111, 23.957], ['br', 'aa-sign', 'hm', 'retro-n', 'b', 'flap', 'i-sign', 'glide', 'final-vowel'], [['ব্রা', 'brā'], ['হ্ম', 'hma'], ['ণ', 'ṇa'], ['বা', 'bā'], ['ড়ি', 'ṙi'], ['য়া', 'yā']], 'ব্র、হ্ম 和 ড় 同时出现；采用保留闪音的宽式变体，হ্ম 此处不逐字读 hm。'],
  ['lakshmipur', 'লক্ষ্মীপুর', '拉克什米普尔', ['Lakshmipur', 'Laxmipur'], 'lokʰːipuɾ', [90.838, 22.943], ['l', 'kshm', 'ii-sign', 'p', 'u-sign', 'r', 'final-vowel'], [['ল', 'la'], ['ক্ষ্মী', 'kṣhmī'], ['পু', 'pu'], ['র', 'ra']], 'ক্ষ্মী 中的 ম 不独立读出；ī 保留拼写区别，不要求拉长元音。'],
  ['narsingdi', 'নরসিংদী', '诺尔辛迪', ['Narsingdi'], 'nɔɾʃiŋd̪i', [90.715, 23.922], ['n', 'r', 's', 'i-sign', 'anusvara', 'd', 'ii-sign', 's-reading', 'final-vowel'], [['ন', 'na'], ['র', 'ra'], ['সিং', 'siṁ'], ['দী', 'dī']], '首都东北方向城市；ং 读 /ŋ/，转写 ṁ 不表示额外的 m。'],
  ['faridpur', 'ফরিদপুর', '法里德布尔', ['Faridpur'], 'foɾid̪puɾ', [89.842, 23.607], ['ph', 'r', 'i-sign', 'd', 'p', 'u-sign', 'final-vowel'], [['ফ', 'pha'], ['রি', 'ri'], ['দ', 'da'], ['পু', 'pu'], ['র', 'ra']], '本词采用现代 ফ 的 /f/ 变体；地图 F 与转写 ph 分开记。'],
  ['kushtia', 'কুষ্টিয়া', '库什蒂亚', ['Kushtia', 'Kustia'], 'kuʃʈi̯a', [89.122, 23.902], ['k', 'u-sign', 'ss-t', 'i-sign', 'glide', 'aa-sign'], [['কু', 'ku'], ['ষ্টি', 'ṣhṭi'], ['য়া', 'yā']], '西部城市；重点是 ষ্ট，不能看成 স্ট 或 স্ত。'],
  ['tangail', 'টাঙ্গাইল', '坦盖尔', ['Tangail'], 'ʈaŋɡail', [89.917, 24.251], ['retro-t', 'aa-sign', 'ngg', 'i', 'l', 'final-vowel'], [['টা', 'ṭā'], ['ঙ্গা', 'ṅgā'], ['ই', 'i'], ['ল', 'la']], 'ঙ্গ 是鼻音加 /ɡ/；后面的 ই 是独立元音，不是前置 ি。'],
  ['narayanganj', 'নারায়ণগঞ্জ', '纳拉扬甘杰', ['Narayanganj'], 'naɾaionɡɔndʒ', [90.5, 23.623], ['n', 'aa-sign', 'r', 'glide', 'retro-n', 'g', 'nj', 'final-vowel'], [['না', 'nā'], ['রা', 'rā'], ['য়', 'ya'], ['ণ', 'ṇa'], ['গ', 'ga'], ['ঞ্জ', 'ñja']], '达卡附近河港城市；য় 与 য 不同，গঞ্জ 以 ঞ্জ 结束。'],
];
const india: PlaceRow[] = [
  ['kolkata', 'কলকাতা', '加尔各答', ['Kolkata', 'Calcutta'], 'kolkat̪a', [88.3639, 22.5726], ['k', 'l', 'aa-sign', 't', 'final-vowel'], [['ক', 'ka'], ['ল', 'la'], ['কা', 'kā'], ['তা', 'tā']], '西孟加拉邦首府；地图 Calcutta 是旧英语名。'],
  ['howrah', 'হাওড়া', '豪拉', ['Howrah', 'Haora'], 'haoɽa', [88.329, 22.595], ['h', 'aa-sign', 'o', 'flap'], [['হা', 'hā'], ['ও', 'o'], ['ড়া', 'ṙā']], '加尔各答对岸城市；ও 是独立元音，ড় 不是 ড。'],
  ['durgapur', 'দুর্গাপুর', '杜尔加布尔', ['Durgapur'], 'd̪uɾɡapuɾ', [87.311, 23.521], ['d', 'u-sign', 'r', 'g', 'reph', 'aa-sign', 'p', 'hasanta', 'final-vowel'], [['দু', 'du'], ['র্গা', 'rgā'], ['পু', 'pu'], ['র', 'ra']], '工业城市；র্গ 上方是前置 র্，不是延音号。'],
  ['asansol', 'আসানসোল', '阿散索尔', ['Asansol'], 'aʃanʃol', [86.966, 23.674], ['aa', 's', 'aa-sign', 'n', 'o-sign', 'l', 's-reading', 'final-vowel'], [['আ', 'ā'], ['সা', 'sā'], ['ন', 'na'], ['সো', 'so'], ['ল', 'la']], '西孟加拉邦西部工业城市；两个 স 的拼写相同，按整词读音学习。'],
  ['bardhaman', 'বর্ধমান', '巴尔达曼', ['Bardhaman', 'Burdwan'], 'bɔɾd̪ʱoman', [87.855, 23.232], ['b', 'r', 'dh', 'reph', 'm', 'aa-sign', 'n', 'hasanta', 'final-vowel'], [['ব', 'ba'], ['র্ধ', 'rdha'], ['মা', 'mā'], ['ন', 'na']], 'র্ধ 来自 র্ + ধ；Burdwan 是常见英语旧拼名。'],
  ['krishnanagar', 'কৃষ্ণনগর', '克里希纳讷格尔', ['Krishnanagar'], 'kɾiʃnonɔɡoɾ', [88.501, 23.401], ['k', 'ri-sign', 'ss', 'retro-n', 'n', 'g', 'r', 'hasanta', 'final-vowel'], [['কৃ', 'kṛ'], ['ষ্ণ', 'ṣhṇa'], ['ন', 'na'], ['গ', 'ga'], ['র', 'ra']], 'ৃ 是 ri 附标，不是 u；ষ্ণ 为 ষ্ + ণ，现代音值不要求卷舌鼻音。'],
  ['kharagpur', 'খড়গপুর', '克勒格布尔', ['Kharagpur'], 'kʰɔɽoɡpuɾ', [87.323, 22.346], ['kh', 'flap', 'g', 'p', 'u-sign', 'r', 'final-vowel'], [['খ', 'kha'], ['ড়', 'ṙa'], ['গ', 'ga'], ['পু', 'pu'], ['র', 'ra']], '铁路枢纽城市；地图 r 与原文 ড় 的对应不按英语猜。'],
  ['medinipur', 'মেদিনীপুর', '梅迪尼普尔', ['Medinipur', 'Midnapore'], 'med̪inipuɾ', [87.321, 22.425], ['m', 'e-sign', 'd', 'i-sign', 'n', 'ii-sign', 'p', 'u-sign', 'r', 'final-vowel'], [['মে', 'me'], ['দি', 'di'], ['নী', 'nī'], ['পু', 'pu'], ['র', 'ra']], '城市名；Midnapore 是常见旧拼名。ী 与 ি 在现代语中通常同音。'],
  ['chandannagar', 'চন্দননগর', '金德讷格尔', ['Chandannagar', 'Chandernagore'], 'tʃɔnd̪ɔnnɔɡoɾ', [88.367, 22.865], ['ch', 'nd', 'n', 'g', 'r', 'final-vowel'], [['চ', 'cha'], ['ন্দ', 'nda'], ['ন', 'na'], ['ন', 'na'], ['গ', 'ga'], ['র', 'ra']], '胡格利河畔城市；此词是 ন্দ，不是三辅音的 ন্দ্র，连续两个 ন 也要保留拼写。'],
  ['shrirampur', 'শ্রীরামপুর', '塞兰坡尔', ['Shrirampur', 'Serampore', 'Srirampur'], 'ʃɾiɾampuɾ', [88.342, 22.75], ['shr', 'ii-sign', 'r', 'aa-sign', 'm', 'p', 'u-sign', 'final-vowel'], [['শ্রী', 'shrī'], ['রা', 'rā'], ['ম', 'ma'], ['পু', 'pu'], ['র', 'ra']], '胡格利河畔城市；শ্র 与 ঈ 的附标结合；Serampore 是地图常见名。'],
  ['siliguri', 'শিলিগুড়ি', '西里古里', ['Siliguri', 'Shiliguri'], 'ʃiliɡuɽi', [88.427, 26.727], ['sh', 'i-sign', 'l', 'g', 'u-sign', 'flap'], [['শি', 'shi'], ['লি', 'li'], ['গু', 'gu'], ['ড়ি', 'ṙi']], '北孟加拉交通枢纽；地图 S 不改变原文 শ 的拼写。'],
  ['darjeeling', 'দার্জিলিং', '大吉岭', ['Darjeeling'], 'd̪aɾdʒiliŋ', [88.263, 27.041], ['d', 'aa-sign', 'r', 'j', 'reph', 'i-sign', 'l', 'anusvara', 'hasanta'], [['দা', 'dā'], ['র্জি', 'rji'], ['লিং', 'liṁ']], '这是孟加拉语书写名，不代表当地只使用孟加拉语。র্জি 同时包含 reph 和前置 i 附标。'],
  ['jalpaiguri', 'জলপাইগুড়ি', '杰尔拜古里', ['Jalpaiguri'], 'dʒɔlpaiɡuɽi', [88.727, 26.544], ['j', 'l', 'p', 'aa-sign', 'i', 'g', 'u-sign', 'flap', 'i-sign', 'final-vowel'], [['জ', 'ja'], ['ল', 'la'], ['পা', 'pā'], ['ই', 'i'], ['গু', 'gu'], ['ড়ি', 'ṙi']], '北孟加拉城市；পাই 由 া 和独立 ই 构成，不等于单个 ঐ 附标。'],
  ['cooch-behar', 'কোচবিহার', '科奇比哈尔', ['Cooch Behar', 'Koch Bihar'], 'kotʃbihaɾ', [89.449, 26.324], ['k', 'o-sign', 'ch', 'b', 'i-sign', 'h', 'aa-sign', 'r', 'final-vowel'], [['কো', 'ko'], ['চ', 'cha'], ['বি', 'bi'], ['হা', 'hā'], ['র', 'ra']], '西孟加拉邦东北部城市；Cooch Behar 与 Koch Bihar 是惯用名变体。'],
  ['malda', 'মালদা', '马尔达', ['Malda', 'Maldah'], 'mald̪a', [88.143, 25.01], ['m', 'aa-sign', 'l', 'd', 'final-vowel'], [['মা', 'mā'], ['ল', 'la'], ['দা', 'dā']], '本条标市区近似位置，不把同名县当作城市边界。'],
  ['balurghat', 'বালুরঘাট', '巴卢尔加特', ['Balurghat'], 'baluɾɡʱaʈ', [88.765, 25.22], ['b', 'aa-sign', 'l', 'u-sign', 'r', 'gh', 'retro-t', 'final-vowel'], [['বা', 'bā'], ['লু', 'lu'], ['র', 'ra'], ['ঘা', 'ghā'], ['ট', 'ṭa']], '北孟加拉城市；ঘ 是带气声的 g，ট 是后移舌位塞音。'],
  ['raiganj', 'রায়গঞ্জ', '赖根杰', ['Raiganj'], 'ɾai̯ɡɔndʒ', [88.125, 25.62], ['r', 'aa-sign', 'glide', 'g', 'nj', 'final-vowel'], [['রা', 'rā'], ['য়', 'ya'], ['গ', 'ga'], ['ঞ্জ', 'ñja']], 'গঞ্জ 是常见地名结尾；ঞ্জ 作一个合字辨认。'],
  ['berhampore', 'বহরমপুর', '贝尔哈姆普尔', ['Berhampore', 'Baharampur'], 'bɔhoɾɔmpuɾ', [88.275, 24.104], ['b', 'h', 'r', 'm', 'p', 'u-sign', 'final-vowel'], [['ব', 'ba'], ['হ', 'ha'], ['র', 'ra'], ['ম', 'ma'], ['পু', 'pu'], ['র', 'ra']], '穆尔希达巴德县的重要城市；地图惯用拼名与按字母转写分别展示。'],
  ['agartala', 'আগরতলা', '阿加尔塔拉', ['Agartala'], 'aɡɔɾt̪ɔla', [91.286, 23.831], ['aa', 'g', 'r', 't', 'l', 'aa-sign', 'final-vowel'], [['আ', 'ā'], ['গ', 'ga'], ['র', 'ra'], ['ত', 'ta'], ['লা', 'lā']], '特里普拉邦首府，孟加拉语街景的重要地区；不是孟加拉国城市。'],
  ['silchar', 'শিলচর', '锡尔杰尔', ['Silchar'], 'ʃilɔtʃɔɾ', [92.778, 24.833], ['sh', 'i-sign', 'l', 'ch', 'r', 'final-vowel'], [['শি', 'shi'], ['ল', 'la'], ['চ', 'cha'], ['র', 'ra']], '阿萨姆邦巴拉克河谷的孟加拉语城市名；在阿萨姆邦不意味着招牌一定是阿萨姆语。'],
];

export const bengaliNewPlaces: Knowledge[] = [...bangladesh, ...india].map(([id, glyph, name, names, ipa, coordinates, requires, segments, note]) => {
  const inIndia = india.some(row => row[0] === id);
  return {
    id: `bn-word-${id}`, courseId: 'bengali', kind: 'word', glyph, roman: segments.map(segment => segment[1]).join(''), ipa,
    title: name, meaning: name, conventionalNames: names, extra: true,
    group: inIndia ? '印度孟加拉语地区城市' : '孟加拉国城市',
    requires: pre(requires), sources: [...refs, inIndia ? 'bn-india-places' : 'bn-government'],
    explanation: `${note} 新增地名采用人工宽式记音，尚待母语者独立审读；不把地图惯用名当成 IPA 来源。`,
    context: note, segments: segments.map(([text, reading]) => ({ text, reading })),
    pronunciation: { speech: { text: glyph, label: `整词：${glyph}`, lang: 'bn' } },
    place: { type: 'city', coordinates, ...(inIndia ? { mapId: 'india' } : {}) },
  };
});

const groups: [string, string[], string][] = [
  ['孟加拉国 · 首都与东部', ['dhaka', 'chattogram', 'cumilla', 'coxs-bazar', 'sylhet', 'mymensingh', 'narayanganj', 'narsingdi', 'chandpur', 'brahmanbaria'], '额外 · 孟加拉国地名'],
  ['孟加拉国 · 北部与西南', ['khulna', 'rajshahi', 'barishal', 'rangpur', 'jashore', 'bogura', 'faridpur', 'kushtia', 'tangail', 'lakshmipur'], '额外 · 孟加拉国地名'],
  ['印度 · 加尔各答与南孟加拉', india.slice(0, 10).map(row => row[0]), '额外 · 印度孟加拉语地区'],
  ['印度 · 北孟加拉与东北', india.slice(10).map(row => row[0]), '额外 · 印度孟加拉语地区'],
];
export const bengaliExtraUnits: Unit[] = groups.map(([title, names, phase], index) => ({
  id: `bengali-extra-${index + 1}`, title, phase, subtitle: '10 个城市 · 完整字形、地图名与位置',
  items: names.map(name => `bn-word-${name}`), placeLesson: true,
  note: '每组 10 个地名；主线完成后自动开放，也可提前解锁。红点是城市近似位置，印度地名使用印度轮廓。重新分组保留知识 ID 和已有学习记录。',
}));

// Sharing requires the same taught value, not merely the same Unicode character.
export const sharedBengaliIds = new Set(pre([
  'k', 'kh', 'g', 'gh', 'ng', 'n', 'm', 'p', 'ph', 'b', 'bh', 'l', 'ny', 'retro-n', 'h',
  'a', 'aa', 'i', 'ii', 'u', 'uu', 'aa-sign', 'i-sign', 'ii-sign', 'u-sign', 'uu-sign',
  'ai', 'au', 'ai-sign', 'au-sign', 'anusvara', 'candrabindu', 'glide',
  ...Array.from({ length: 10 }, (_, index) => `num-${index}`),
]));
