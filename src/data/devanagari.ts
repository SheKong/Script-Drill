import type { Course, CourseBranch, Knowledge, Unit } from '../types';
import { sources } from './sources';
import india from './india-map.json' with { type: 'json' };
import nepal from './nepal-map.json' with { type: 'json' };

type Language = 'hi' | 'ne' | 'mr';
const labels = { hi: '印地语', ne: '尼泊尔语', mr: '马拉地语' };
const standards = { hi: 'hi-ungegn', ne: 'ne-ungegn', mr: 'mr-loc' };
const prefix = (language: Language) => language === 'hi' ? 'dv' : `dv-${language}`;
const key = (language: Language, id: string) => `${prefix(language)}-${id}`;
const refs = (language: Language) => [standards[language], 'deva-unicode',
  language === 'ne' ? 'ne-phonetics' : 'hi-orthography'];
function base(language: Language, id: string, kind: Knowledge['kind'], glyph: string): Knowledge {
  return {
    id: key(language, id), courseId: 'devanagari', kind, glyph, roman: '', ipa: '',
    title: `${glyph} · ${labels[language]}`, explanation: '', group: `${labels[language]} · 字音`,
    sources: refs(language), requires: [],
    languageIds: [language], ...(language === 'hi' ? {} : { branchId: language }),
  };
}
function rule(language: Language, id: string, glyph: string, title: string, explanation: string,
  prompt: string, answer: string, choices: string[], requires: string[] = []): Knowledge {
  return { ...base(language, id, 'rule', glyph), title, explanation, group: `${labels[language]} · 书写规则`,
    requires, rulePrompt: prompt, ruleAnswer: answer, ruleChoices: choices };
}
const rules: Knowledge[] = [
  rule('hi', 'overview', 'देवनागरी · हिन्दी', '天城文不是一种语言',
    '天城文从左向右书写，顶线是明显线索，但不是国界线。本课主线是现代标准印地语，另有尼泊尔语、马拉地语平行分支；同一种文字可写多种语言，不能看到天城文就断定在印度。梵语古典语法、吠陀重音与完整口语会话不在本课范围。',
    '看到天城文，能否只凭文字断定国家与语言？', '不能，同一文字可用于不同语言和地区',
    ['一定是印度的印地语', '一定是尼泊尔语', '文字顶线就是地图国界']),
  rule('hi', 'inherent', 'क · का · क्', '辅音成分与完整字块分开',
    '辅音卡的 k /k/ 只表示 क 的辅音成分；完整的无附标字块在印地语里通常有固有元音 /ə/，不是看到 क 就一律读纯 /k/。ा 等附标替换固有元音，्（halant/virama）显式取消它。词中还会发生未写 halant 的元音脱落，后面用整词练习。',
    '本课辅音卡 क 的 /k/ 是什么意思？', '辅音成分；完整字块还需判断元音',
    ['所有 क 在词里都没有元音', 'क 是拉丁字母 k', '每个辅音之后一定读长 ā'], ['dv-overview']),
  rule('hi', 'aspiration', 'क ख · ग घ · त ट', '送气、气声与舌位是不同维度',
    'k/kh、g/gh 等区别不是另加一个独立 h 音节。清辅音的 ʰ 表示送气，浊辅音的 ʱ 宽记气声；t/d 的齿音与 ṭ/ḍ 的卷舌音另成对比。转写中的 h 与 IPA 中的附标不要混淆。本课用宽式 IPA，不练完整声学分析。',
    'ख 的 kh 应怎样理解？', '送气辅音，不是 k 后另读一个 h 音节',
    ['英语字母 k 的名称', '两个完整音节', '元音变成鼻音'], ['dv-inherent']),
  rule('hi', 'matra', 'इ · कि · की', '独立元音与元音附标',
    '元音在音节开头可用独立字母；辅音后的元音通常用附标。ि 看起来在左侧，但 कि 仍先读辅音再读 /ɪ/，不是 /ɪk/。◌ 只是课程展示附标的载体，不是实际词的一部分；文本须按完整字块成形，不能拆成逐字符图标。',
    'कि 中左侧的 ि 应按什么顺序读？', '先辅音 k，后元音 /ɪ/',
    ['先 /ɪ/ 再 /k/', '从右向左读整词', '把 ◌ 当作另一个辅音'], ['dv-i']),
  rule('hi', 'halant', 'क् + ष → क्ष', '半形与合字不一定像原字',
    '् 取消前一个辅音的固有元音，并可与后面的辅音形成半形、上下叠写或合字。क्ष、ज्ञ 等要认整个字块，不能按外形猜成新的单字母。半形与合字取决于字体，未显示出一条完整顶线不表示字母消失。',
    '合字中前一个辅音的固有元音通常怎样处理？', '被 virama 取消，不在两辅音间添 a',
    ['必定变成长 ā', '两个辅音都删除', '每个笔画都另读一个音节'], ['dv-matra']),
  rule('hi', 'ra-forms', 'र्क · क्र · र्य', 'r 在合字里的位置变化',
    'र् 在前常形成上方 reph，例如 र्क 的 r 先于 k 读；后置的 r 可形成 rakar，例如 क्र。附标在画面上方并不等于晚读。马拉地语还会出现睫毛形 r，放在分支单独说明；不把所有上方笔画当作鼻音点。',
    'र्क 上方的 reph 在读序里位于哪里？', '在 k 前，是先出现的 r',
    ['在 k 后，永远最后读', '只表示元音鼻化', '是数字 1'], ['dv-halant', 'dv-r', 'dv-k']),
  rule('hi', 'nasal', 'ं · ँ · अं · अँ', '点与月点不能一律读 ng',
    'candrabindu ँ 常标元音鼻化；anusvara ं 可依语境标鼻辅音，也可在部分拼写中承担鼻化功能。UNGEGN 用 ṁ 与 m̐ 区分书写，实际值看完整词；गाँव 的 m̐ 不表示另加一个 /m/。带上方元音笔画时也可能用点代替月点。',
    'गाँव 的 ँ 可以直接当成另一个 /ŋ/ 吗？', '不可以，这里表示元音鼻化',
    ['可以，所有点都读 /ŋ/', '它一定是数字零', '它会把整词改为从右向左读'], ['dv-matra']),
  rule('hi', 'schwa', 'कमल · सड़क · कानपुर', '规范拼写与固有元音脱落',
    '现代印地语中，词尾和部分词中的固有元音会脱落，不能把每个未带 halant 的辅音都读成 Ca。UNGEGN 地名约定保留词中的 a、通常省略词尾 a，例如 kānapur 与实际 /kaːnpʊɾ/ 不逐字相等。本课不配置任意拼词生成器，真实词的 IPA 单独核对。',
    'कानपुर 转写 kānapur，能否据此强制读出中间每个 a？', '不能，规范字母转写不等于实际语音',
    ['可以，转写与 IPA 永远相同', '删去所有元音才正确', '每个词尾都必须加长 ā'], ['dv-halant']),
  rule('hi', 'nukta', 'ड ड़ · ढ ढ़ · फ फ़', '下点可改变字母身份',
    'nukta ़ 是字母下点，不是鼻化号。ड़/ढ़ 对应闪音拼写，क़/ख़/ग़/ज़/फ़ 常见于借词。现实牌面可能省点，不能因此断定实际读音必然改变。课程用带点形式明确考核目标，保留无点常见词形作为词条别名而非另造转写标准。',
    'फ़ 下方的点是什么？', 'nukta，标明区别于 फ 的字母读法',
    ['元音鼻化号', '词尾 r 的 reph', '公路编号的数字零'], ['dv-inherent']),
  rule('hi', 'maps', 'दिल्ली · dillī · Delhi', '转写、IPA、地图惯用名三栏',
    '主线采用联合国推荐 UNGEGN 印地语方案，ch/chh、sh/ṣh、ṙ 等保留规范；它不是全部现实路牌统一采用的拼法。地图名 Delhi、Jaipur 等单列并可输入；IPA 只记现代宽式读音，省略可预测重音，不含完整口音差异。学习语言不能只靠一两个高频词判断位置。',
    '地图名 Delhi 和规范 dillī 不同，应如何处理？', '分别保留，地图名也可用于输入和检索',
    ['把 Delhi 当 IPA', '宣称所有地图都拼错了', '把两个拼法当成不同城市'], ['dv-schwa']),
];

type LetterRow = [string, string, string, string, string];
const consonantRows: LetterRow[] = [
  ['k', 'क', 'k', 'k', '清不送气软腭塞音；与 ख 区分。'],
  ['kh', 'ख', 'kh', 'kʰ', '清送气软腭塞音；不是借词 ख़ 的擦音。'],
  ['g', 'ग', 'g', 'ɡ', '浊软腭塞音；与 घ 区分气声。'],
  ['gh', 'घ', 'gh', 'ɡʱ', '气声浊软腭塞音，h 不构成额外音节。'],
  ['ng', 'ङ', 'ṅ', 'ŋ', '软腭鼻音，多见于合字与梵语来源拼写。'],
  ['ch', 'च', 'ch', 'tʃ', '印地语清塞擦音；同一字形在其他语言未必同音或同转写。'],
  ['chh', 'छ', 'chh', 'tʃʰ', '印地语送气塞擦音，UNGEGN 写 chh。'],
  ['j', 'ज', 'j', 'dʒ', '印地语浊塞擦音；不要当成 य 的 /j/。'],
  ['jh', 'झ', 'jh', 'dʒʱ', '印地语气声浊塞擦音。'],
  ['ny', 'ञ', 'ñ', 'ɲ', '腭鼻音的传统辅音成分，常见于合字；现代词内值须核查。'],
  ['tt', 'ट', 'ṭ', 'ʈ', '清不送气卷舌塞音，与齿音 त 分开。'],
  ['tth', 'ठ', 'ṭh', 'ʈʰ', '清送气卷舌塞音。'],
  ['dd', 'ड', 'ḍ', 'ɖ', '浊卷舌塞音，带 nukta 的 ड़ 单独学。'],
  ['ddh', 'ढ', 'ḍh', 'ɖʱ', '气声浊卷舌塞音，ढ़ 不是本卡字形。'],
  ['nn', 'ण', 'ṇ', 'ɳ', '卷舌鼻音，常见于梵语借词；不同语言可有合流。'],
  ['t', 'त', 't', 't̪', '清齿塞音；IPA 下方附标指舌位，不是送气。'],
  ['th', 'थ', 'th', 't̪ʰ', '清送气齿塞音，不是英语 thin 的 /θ/。'],
  ['d', 'द', 'd', 'd̪', '浊齿塞音，与 ड 区分。'],
  ['dh', 'ध', 'dh', 'd̪ʱ', '气声浊齿塞音，与 ढ 区分。'],
  ['n', 'न', 'n', 'n', '普通 n；具体词内可受相邻辅音影响。'],
  ['p', 'प', 'p', 'p', '清不送气双唇塞音。'],
  ['ph', 'फ', 'ph', 'pʰ', '传统送气双唇塞音；部分现代说话人或借词中有 /f/，本卡不把它与明确的 फ़ 混合。'],
  ['b', 'ब', 'b', 'b', '浊双唇塞音。'],
  ['bh', 'भ', 'bh', 'bʱ', '气声浊双唇塞音。'],
  ['m', 'म', 'm', 'm', '双唇鼻音，不是 anusvara 鼻音点。'],
  ['y', 'य', 'y', 'j', '腭近音；转写 y，IPA /j/。'],
  ['r', 'र', 'r', 'ɾ', '本课选择闪音宽式值，也有颤音变体；reph/rakar 是其合字形态。'],
  ['l', 'ल', 'l', 'l', '普通边音；马拉地语的 ळ 是另一个字母。'],
  ['v', 'व', 'v', 'ʋ', '唇齿近音宽式值，实际有 /w~v/ 变体；不要按英语 v 机械套用。'],
  ['sh', 'श', 'sh', 'ʃ', 'UNGEGN sh；与 ष 保留拼写区别，现代印地语常同音。'],
  ['ss', 'ष', 'ṣh', 'ʃ', '本课取现代印地语常见 /ʃ/，不强制梵语式 /ʂ/；规范 ṣh 保留字母区别。'],
  ['s', 'स', 's', 's', '清咝音，与 श/ष 的常见 /ʃ/ 区分。'],
  ['h', 'ह', 'h', 'ɦ', '宽式记浊喉擦音，具体语境与说话人可清化。'],
];
const sharedConsonants = new Set(['k', 'kh', 'g', 'gh', 'ng', 'tt', 'tth', 'dd', 'ddh', 't', 'th', 'd', 'dh', 'n', 'p', 'ph', 'b', 'bh', 'm', 'y', 'r', 'l', 's', 'h']);
const consonants: Knowledge[] = consonantRows.map(([id, glyph, roman, ipa, explanation]) => ({
  ...base('hi', id, 'consonant', glyph), roman, ipa, title: `${glyph} · 辅音成分`,
  explanation: `${explanation}本卡只记辅音成分；无附标完整字块的固有元音须按具体语言和词判断。`,
  requires: ['dv-aspiration'], group: '辅音成分',
  ...(sharedConsonants.has(id) ? { languageIds: ['hi', 'ne', 'mr'], sources: ['hi-ungegn', 'ne-ungegn', 'mr-loc', 'deva-unicode'] } : {}),
  ...(['v', 'nn', 'ny'].includes(id) ? { languageIds: ['hi', 'mr'], sources: ['hi-ungegn', 'mr-loc', 'deva-unicode'] } : {}),
}));
type VowelRow = [string, string, string, string, string, string];
const vowelRows: VowelRow[] = [
  ['a', 'अ', '', 'a', 'ə', '固有元音的独立写法，不是长 ā。'],
  ['aa', 'आ', 'ा', 'ā', 'aː', '低元音，ā 的长横线与本课 IPA 长度分别显示。'],
  ['i', 'इ', 'ि', 'i', 'ɪ', '短 i；附标虽在左侧，仍在辅音后读。'],
  ['ii', 'ई', 'ी', 'ī', 'iː', '长 ī，与 इ/ि 区分。'],
  ['u', 'उ', 'ु', 'u', 'ʊ', '短 u；附标位于字块下部。'],
  ['uu', 'ऊ', 'ू', 'ū', 'uː', '长 ū，与 उ/ु 区分。'],
  ['e', 'ए', 'े', 'e', 'eː', '印地语常见长中前元音，不要读成英语字母 e。'],
  ['ai', 'ऐ', 'ै', 'ai', 'ɛː', '现代标准印地语常为单元音；ai 是规范转写，不强制分成 a+i。'],
  ['o', 'ओ', 'ो', 'o', 'oː', '印地语常见长中后元音。'],
  ['au', 'औ', 'ौ', 'au', 'ɔː', '现代标准印地语常为单元音；au 不强制双元音。'],
  ['ri', 'ऋ', 'ृ', 'ṛ', 'ɾɪ', '梵语来源的元音字母；现代印地语常读 ri，并非英语 r 或必定音节性 r。'],
];
const sharedVowels = new Set(['a']);
const vowels: Knowledge[] = vowelRows.flatMap(([id, glyph, sign, roman, ipa, explanation]) => {
  const membership = sharedVowels.has(id) ? ['hi', 'mr'] : ['hi'];
  const independent: Knowledge = {
    ...base('hi', id, 'vowel', glyph), roman, ipa, explanation, title: `${glyph} · 独立元音`,
    group: '独立元音', requires: ['dv-inherent'], languageIds: membership,
  };
  return [independent, ...sign ? [{
    ...independent, id: `dv-${id}-sign`, glyph: `◌${sign}`, title: `${sign} · 元音附标`,
    group: '元音附标', requires: ['dv-matra', `dv-${id}`],
    explanation: `${explanation}这是辅音后的附标；◌ 仅作展示载体，附标替换而不是追加在固有元音之后。`,
  }] : []];
});
const symbols: Knowledge[] = [
  { ...base('hi', 'anusvara', 'symbol', '◌ं'), roman: 'ṁ', title: 'anusvara · 鼻音点',
    explanation: 'UNGEGN 写 ṁ；可对应依后接辅音改变的鼻辅音，也可参与元音鼻化。不提供无条件独立 IPA。',
    requires: ['dv-nasal'] },
  { ...base('hi', 'candrabindu', 'symbol', '◌ँ'), roman: 'm̐', title: 'candrabindu · 月点',
    explanation: '常标元音鼻化，不是另读 /m/；本课在 गाँव 等完整词里给出鼻化 IPA。',
    requires: ['dv-nasal'] },
  { ...base('hi', 'visarga', 'symbol', '◌ः'), roman: 'ḥ', title: 'visarga · 两点',
    explanation: '梵语来源词中常见的 visarga，不是冒号或 anusvara；现代读法依词和语体变化，不编造统一独立音值。',
    requires: ['dv-nasal'] },
];
const loanRows: LetterRow[] = [
  ['q', 'क़', 'q', 'q', '借词的清小舌塞音；也有与 क 合流的说话人变体。'],
  ['x', 'ख़', 'ḳh', 'x', '借词软腭擦音；规范 ḳh 与 ख kh 不是同一字母。'],
  ['gh-fricative', 'ग़', 'g̣', 'ɣ', '借词浊软腭擦音；现实中可与 ग 合流。'],
  ['z', 'ज़', 'z', 'z', '借词的 /z/，与 ज 的 /dʒ/ 分开。'],
  ['f', 'फ़', 'f', 'f', '明确带点的 /f/；实际牌面可能省点，整词另核对。'],
  ['flap', 'ड़', 'ṙ', 'ɽ', '卷舌闪音；与 ड 的塞音区别，不是增加一个元音。'],
  ['flap-h', 'ढ़', 'ṙh', 'ɽʱ', '气声卷舌闪音拼写；不能把整字误认成 ढ。'],
];
const loans = loanRows.map<Knowledge>(([id, glyph, roman, ipa, explanation]) => ({
  ...base('hi', id, 'consonant', glyph), roman, ipa, explanation, requires: ['dv-nukta'], group: 'nukta 字母',
}));
const clusterRows: [string, string, string, string, string, string[]][] = [
  ['ksh', 'क्ष', 'kṣh', 'kʃ', 'क् + ष；本卡取现代印地语常见读法，梵语式 /kʂ/ 另有语体差异。', ['k', 'ss']],
  ['gy', 'ज्ञ', 'jñ', 'ɡj', 'ज् + ञ 的特殊合字，现代印地语常读 /ɡj/；转写 jñ 不等于机械拼读 /dʒɲ/。', ['j', 'ny']],
  ['tr', 'त्र', 'tr', 't̪ɾ', 'त् + र；不能在两辅音间加固有元音。', ['t', 'r']],
  ['pr', 'प्र', 'pr', 'pɾ', 'प् + र，后置 r 的组合形。', ['p', 'r']],
  ['kr', 'क्र', 'kr', 'kɾ', 'क् + र，与 र्क 读序不同。', ['k', 'r']],
  ['rk', 'र्क', 'rk', 'ɾk', 'र् + क；上方 reph 的 r 在 k 前读。', ['r', 'k']],
  ['ry', 'र्य', 'ry', 'ɾj', 'र् + य；注意不同语言的 reph 与半形偏好。', ['r', 'y']],
  ['shr', 'श्र', 'shr', 'ʃɾ', 'श् + र；श 和其后 r 的字块变化。', ['sh', 'r']],
  ['st', 'स्त', 'st', 'st̪', 'स् + त；地名和设施词里的常见辅音群。', ['s', 't']],
  ['nt', 'न्त', 'nt', 'nt̪', 'न् + त；前一个辅音后没有固有元音。', ['n', 't']],
];
const clusters = clusterRows.map<Knowledge>(([id, glyph, roman, ipa, explanation, requires]) => ({
  ...base('hi', id, 'consonant', glyph), roman, ipa, explanation, group: '常见合字的辅音成分',
  requires: ['dv-halant', ...requires.map(id => `dv-${id}`), ...['rk', 'ry', 'shr', 'st', 'nt'].includes(id) ? ['dv-ra-forms'] : []],
}));
const digits: Knowledge[] = Array.from('०१२३४५६७८९', (glyph, index) => ({
  ...base('hi', `num-${index}`, 'number', glyph), roman: String(index), title: `数字 ${index}`,
  explanation: `天城文十进制数字 ${index}；三种语言共用数值而不是共用数字词的读音。路牌也会使用 0–9，不能把字形本身读成某语言的数字词。`,
  group: '十进制数字', requires: ['dv-overview'], languageIds: ['hi', 'ne', 'mr'],
}));

const neRules = [
  rule('ne', 'overview', 'नेपाली · नेपाल', '尼泊尔语：同文不同音',
    '尼泊尔语是天城文语言之一，也用于尼泊尔以外地区。本分支默认已懂主线字块、附标与合字，但不把印地语发音搬过来。采用 UNGEGN 尼泊尔语表，保留书写固有 a；实际读音另列。Nepal Survey Department 与地图惯用拼法不是同一套表。',
    '看到 नेपाली，应直接套用印地语的全部读法吗？', '不应，应按尼泊尔语单独核对',
    ['应该，同一文字就是同一语言', '应该，所有元音长度都相同', '应该，所有地图拼名都等于 IPA']),
  rule('ne', 'spelling', 'इ ई · उ ऊ · श ष स', '拼写区别不等于语音对立',
    '本分支按 Khatiwada 的现代标准语研究采用 /ʌ a i u e o/ 口元音；i/ī、u/ū 的拼写差别不要求常规长度对立。श、ष 通常并入 /s/，传统 ञ/ण 的普通读法也可并入 /n/；梵语借词的拼写式读法另有变体。',
    '尼泊尔语中 इ 和 ई 是否必定构成长短音对立？', '不必定，保留拼写但现代常无长度对立',
    ['必定，任何位置都长短对立', 'ई 必定是鼻音', '二者都是数字'], [key('ne', 'overview')]),
  rule('ne', 'context', 'ड · ढ · ज्ञ · ँ', '保留词内条件，不机械删元音',
    '尼泊尔语的固有元音保留与脱落不完全遵循印地语模式，尤其不可照抄印地语的词尾规则。ड/ढ 在元音间可出现闪音，ज/झ 属齿龈塞擦音系列；鼻化和合字也要回到具体词。本分支 IPA 省略非区别性的重音，词条宽式值仍待独立母语审读。',
    '可以用印地语的元音删除规则自动读全部尼泊尔语地名吗？', '不可以，须核对语言和完整词',
    ['可以，只需删除每个 a', '可以，地名没有例外', '可以，先把数字反转'], [key('ne', 'spelling')]),
];
const neLetters: Knowledge[] = ([
  ['ch', 'च', 'ch', 'ts', '标准语研究中的清齿龈塞擦音，不能直接复用印地语 /tʃ/。'],
  ['chh', 'छ', 'chh', 'tsʰ', '送气齿龈塞擦音，保留 UNGEGN chh。'],
  ['j', 'ज', 'j', 'dz', '浊齿龈塞擦音，不能按英语 j 猜其精确舌位。'],
  ['jh', 'झ', 'jh', 'dzʱ', '气声浊齿龈塞擦音，词内可有弱化。'],
  ['sh', 'श', 'sh', 's', '常与 ष、स 合流；sh 是字母转写而非强制 /ʃ/。'],
  ['ss', 'ष', 'ṣh', 's', '普通读法常为 /s/，拼写保留 ṣh；不要求梵语式 /ʂ/。'],
  ['v', 'व', 'v', 'w', '本卡取滑音 /w/ 的常见实现；词内可有 /b/ 等变体，完整词另核查。'],
  ['ny', 'ञ', 'ñ', 'n', '普通读法可并入 /n/，借词与特定辅音群有其他实现，不做无条件替换。'],
  ['nn', 'ण', 'ṇ', 'n', '普通读法常并入 /n/；保留梵语式卷舌鼻音的读法不是所有词的默认。'],
] satisfies LetterRow[]).map(([id, glyph, roman, ipa, explanation]) => ({
  ...base('ne', id, 'consonant', glyph), roman, ipa, explanation, requires: [key('ne', 'overview')],
}));
const neVowelIPA: Record<string, string> = { a: 'ʌ', aa: 'a', i: 'i', ii: 'i', u: 'u', uu: 'u', e: 'e', ai: 'ʌi', o: 'o', au: 'ʌu', ri: 'ɾi' };
const neVowels: Knowledge[] = vowelRows.flatMap(([id, glyph, sign, roman]) => {
  const independent: Knowledge = {
    ...base('ne', id, 'vowel', glyph), roman, ipa: neVowelIPA[id], requires: [key('ne', 'spelling')],
    title: `${glyph} · 尼泊尔语独立元音`, group: '尼泊尔语 · 元音',
    explanation: `尼泊尔语本卡宽式 /${neVowelIPA[id]}/；转写 ${roman} 保留字母拼写，不套用印地语音值。${['i', 'ii', 'u', 'uu'].includes(id) ? '长短字母的拼写区别不要求常规语音长度对立。' : ''}${id === 'ri' ? '梵语来源 ऋ 的现代 ri 读法，不是英语 r。' : ''}`,
  };
  return [independent, ...sign ? [{ ...independent, id: key('ne', `${id}-sign`), glyph: `◌${sign}`,
    title: `${sign} · 尼泊尔语元音附标`, requires: [key('ne', id), 'dv-matra'],
    explanation: `${independent.explanation}附标替换固有元音；◌ 只是载体，ि 仍在辅音后读。`,
  }] : []];
});
const neSymbols: Knowledge[] = symbols.map(item => ({
  ...item, id: key('ne', item.id.replace('dv-', '')), branchId: 'ne', languageIds: ['ne'],
  title: `${item.title} · 尼泊尔语`, group: '尼泊尔语 · 鼻化与附标', sources: refs('ne'),
  requires: [key('ne', 'context')],
}));

const mrRules = [
  rule('mr', 'overview', 'मराठी · महाराष्ट्र', '马拉地语：同一文字，另一套语言规则',
    '马拉地语使用天城文，本分支聚焦现代街景读写，不是梵语课。采用 ALA-LC Marathi 2011 书目转写：च c、छ ch、श ś、ष sh；按该表保留词尾固有 a。它与印地语 UNGEGN 和地图惯用名不相同，读音另以 IPA 表示。',
    '马拉地语分支中 c、ch 应按哪套规范理解？', 'ALA-LC 马拉地语表，不是印地语 UNGEGN',
    ['按英语字母名称读', '按泰语 RTGS', '它们是两个地图坐标']),
  rule('mr', 'affricates', 'च · ज · ळ · ज्ञ', '条件塞擦音与特有边音',
    '马拉地语的 च/ज 系列存在齿龈与后齿龈读法，不能把下卡选用的常见值当作所有语境唯一读法。ळ 的 /ɭ/ 与 ल 的 /l/ 要分开。ज्ञ 的现代读法也不能直接照抄印地语 /ɡj/；本课不配置通用自动组合器，完整词逐条核对。',
    '可否把马拉地语 च 在所有词里固定为一个印地语音值？', '不可，需按语言、词和语境核查',
    ['可以，Unicode 决定全部音值', '可以，所有塞擦音都消失', '可以，所有词都来自英语'], [key('mr', 'overview')]),
  rule('mr', 'eyelash', 'र्‍य · र्य · ऱ्ह', '睫毛形 r 与语言字形偏好',
    '马拉地语可用睫毛形 r，Unicode 支持 र् 后接 ZWJ 等成形方式；其外观与 reph 不同，不应一律当成鼻化符号。字母 झ、ल、श 和数字还可能有语言偏好字形。本站使用带 mr 语言标签的本地字体保留整块成形；字体差异不表示新字母。',
    '睫毛形 r 的不同外观，是否一定代表新字母或鼻音点？', '不是，应识别其 r 组合与语言字形',
    ['是，它是数字五', '是，所有上方笔画都读 ng', '是，文字方向随之反转'], [key('mr', 'affricates')]),
  rule('mr', 'nasal', 'सांगली · मुंबई · गाव', '鼻音转写与词尾不发出的 a',
    'ALA-LC 马拉地语表中，anusvara 在塞音前按部位写 ṅ/ñ/ṇ/n/m，其余语境以元音上的波浪号表示；不能复制印地语统一的 ṁ。拼写中保留的固有 a 不保证口语发音，gāva 实际词尾通常没有 /ə/。标准转写、实际 IPA 和地图名保持分栏。',
    'मुंबई 的鼻音为何可转写 m，而非照抄印地语 ṁ？', '分支规范按后接双唇音转写鼻音',
    ['因为所有点都是数字', '因为文字从右向左读', '因为地图名自动决定音值'], [key('mr', 'eyelash')]),
];
const mrLetterRows: LetterRow[] = [
  ['lla', 'ळ', 'ḷ', 'ɭ', '卷舌边音，与 ल /l/ 对立，是本分支的重点字母。'],
  ['ch', 'च', 'c', 'ts', '本卡取常见齿龈塞擦读法，另有后齿龈变体；ALA-LC 转写 c。'],
  ['chh', 'छ', 'ch', 'tʃʰ', '常见送气后齿龈读法；ALA-LC ch 不等于印地语 UNGEGN 的 च。'],
  ['j', 'ज', 'j', 'dz', '本卡取齿龈读法，另有 /dʒ/；须按整词核查。'],
  ['jh', 'झ', 'jh', 'dzʱ', '本卡取气声齿龈读法；地区和词中有后齿龈变体。'],
  ['sh', 'श', 'ś', 'ɕ', 'ALA-LC 写 ś；本分支选用词典的 /ɕ/ 宽式，另有 /ʃ/ 变体，不复用印地语卡片。'],
  ['ss', 'ष', 'sh', 'ʂ', '本卡保留卷舌式读法，现代有与 /ʃ/ 合流的变体；ALA-LC 写 sh。'],
];
const mrLetters = mrLetterRows.map<Knowledge>(([id, glyph, roman, ipa, explanation]) => ({
  ...base('mr', id, 'consonant', glyph), roman, ipa, explanation,
  requires: [key('mr', 'affricates')], sources: ['mr-loc', 'deva-unicode', 'deva-lexicon'],
}));
const mrVowelRows: [string, string, string, string, string][] = [
  ['aa', 'आ', 'ा', 'ā', 'a'], ['e', 'ए', 'े', 'e', 'e'], ['o', 'ओ', 'ो', 'o', 'o'],
  ['i', 'इ', 'ि', 'i', 'i'], ['ii', 'ई', 'ी', 'ī', 'i'],
  ['u', 'उ', 'ु', 'u', 'u'], ['uu', 'ऊ', 'ू', 'ū', 'u'],
  ['ri', 'ऋ', 'ृ', 'r̥', 'ɾu'], ['ai', 'ऐ', 'ै', 'ai', 'əi'], ['au', 'औ', 'ौ', 'au', 'əu'],
  ['ae', 'ॲ', 'ॅ', 'ê', 'æ'], ['aw', 'ऑ', 'ॉ', 'ô', 'ɔ'],
];
const mrVowels: Knowledge[] = mrVowelRows.flatMap(([id, glyph, sign, roman, ipa]) => {
  const independent: Knowledge = {
    ...base('mr', id, 'vowel', glyph), roman, ipa, title: `${glyph} · 马拉地语元音`,
    requires: [key('mr', 'overview')], sources: ['mr-loc', 'deva-unicode', 'deva-lexicon'],
    explanation: `本卡选现代马拉地语宽式 /${ipa}/；规范 ${roman} 与实际音值分开。${['i', 'ii', 'u', 'uu'].includes(id) ? 'i/ī、u/ū 保留拼写，长度受词位等条件影响，不把印地语的整套长短对立直接搬来。' : ''}${id === 'ae' ? 'ॲ 是马拉地语常用字形，表中也见 अॅ；ê 不要求读成法语元音。' : ''}${id === 'ri' ? 'ALA-LC 用下圈 r；现代常见 ru 实现，非强制音节性 r。' : ''}`,
  };
  return [independent, { ...independent, id: key('mr', `${id}-sign`), glyph: `◌${sign}`,
    title: `${sign} · 马拉地语元音附标`, requires: [key('mr', id), 'dv-matra'],
    explanation: `${independent.explanation}本条为相应附标，◌ 仅作载体。`,
  }];
});
const practical = [...consonants, ...vowels, ...symbols, ...loans, ...clusters, ...digits,
  ...neLetters, ...neVowels, ...neSymbols, ...mrLetters, ...mrVowels];
// This maps written characters to taught knowledge, not characters to guessed sounds.
function writtenPrerequisites(glyph: string, language: Language): string[] {
  const membership = (item: Knowledge) => item.languageIds?.includes(language);
  const candidates = practical.filter(item => !item.branchId && membership(item))
    .concat(practical.filter(item => item.branchId === language));
  const mapping = new Map<string, string>();
  for (const item of candidates) {
    const text = item.glyph.replace('◌', '').normalize('NFD');
    if (Array.from(text).length === 1) mapping.set(text, item.id);
  }
  // Nukta sequences must be recognized as a unit before the individual letters.
  const dotted = loans.map(item => item.glyph.normalize('NFD'));
  const ids = new Set<string>([language === 'hi' ? 'dv-schwa' : key(language, language === 'ne' ? 'context' : 'nasal')]);
  let remaining = glyph.normalize('NFD');
  for (const [index, sequence] of dotted.entries()) if (remaining.includes(sequence)) {
    ids.add(loans[index].id);
    remaining = remaining.replaceAll(sequence, '');
  }
  for (const character of remaining) {
    if (/\s/u.test(character)) continue;
    if (character === '\u094d') { ids.add('dv-halant'); continue; }
    if (character === '\u0902' && language === 'mr') { ids.add(key('mr', 'nasal')); continue; }
    const id = mapping.get(character);
    if (!id) throw new Error(`${language}/${glyph}: no taught written prerequisite for ${character}`);
    ids.add(id);
  }
  if (glyph.includes('्र') || glyph.includes('र्')) ids.add('dv-ra-forms');
  for (const item of clusters) if (glyph.includes(item.glyph)) ids.add(item.id);
  return [...ids];
}
type WordRow = [string, string, string, string, string, string?];
const supplementalSpellings: Record<string, string> = {
  'ne/lalitpur': 'ne-lalitpur-official',
  'mr/highway': 'mr-pwd-official',
  'mr/satara': 'mr-satara-official',
  'mr/sangli': 'mr-sangli-official',
  'mr/ratnagiri': 'mr-ratnagiri-official',
};
function words(language: Language, rows: WordRow[]): Knowledge[] {
  return rows.map(([id, glyph, roman, ipa, meaning, note]) => ({
    ...base(language, `word-${id}`, 'word', glyph), roman, ipa, title: meaning, meaning,
    requires: writtenPrerequisites(glyph, language), sources: [...refs(language), 'deva-lexicon',
      ...supplementalSpellings[`${language}/${id}`] ? [supplementalSpellings[`${language}/${id}`]] : []],
    group: `${labels[language]} · 街景词`,
    explanation: `${note || '牌面常见的完整词；规范转写保留拼写，不能逐字符拼出本条 IPA。'}本课 IPA 是人工选取的现代宽式值，变体与证据见逐词审校表，尚待母语者独立审读。`,
    context: `${labels[language]}完整词；不把相同字形当作三种语言共用词音。`,
    pronunciation: { speech: { text: glyph, label: `${labels[language]}整词：${glyph}`, lang: language } },
  }));
}
const mainWords = words('hi', [
  ['road', 'सड़क', 'saṙak', 'səɽək', '路；道路', 'ड़ 的卷舌闪音与词尾固有元音脱落一起练习。'],
  ['marg', 'मार्ग', 'mārg', 'maːɾɡ', '道路；大道', '上方 reph 的 r 在 g 之前读。'],
  ['nagar', 'नगर', 'nagar', 'nəɡəɾ', '城镇；城市成分'],
  ['village', 'गाँव', 'gām̐v', 'ɡãːʋ', '村庄', '月点标元音鼻化，不另加 /m/。'],
  ['market', 'बाज़ार', 'bāzār', 'baːzaːɾ', '市场', '带点 ज़ 明确 /z/；现实也常见 बाजार。'],
  ['shop', 'दुकान', 'dukān', 'd̪ʊkaːn', '商店'],
  ['hotel', 'होटल', 'hoṭal', 'ɦoːʈəl', '旅馆；饭店', '地点语境决定是住宿或餐饮招牌，不能仅靠这个词唯一定位。'],
  ['hospital', 'अस्पताल', 'aspatāl', 'əspət̪aːl', '医院'],
  ['school', 'विद्यालय', 'vidyālay', 'ʋɪd̪jaːləj', '学校', 'द्य 是 द् + य，不能在 d 与 y 之间添元音。'],
  ['bridge', 'पुल', 'pul', 'pʊl', '桥'],
  ['river', 'नदी', 'nadī', 'nəd̪iː', '河流'],
  ['rail', 'रेल', 'rel', 'ɾeːl', '铁路；火车'],
  ['station', 'स्टेशन', 'sṭeshan', 'sʈeːʃən', '车站', '借词开头 स् + ट，不把下方 halant 当成元音附标。'],
  ['airport', 'हवाई अड्डा', 'havāī aḍḍā', 'ɦəʋaːiː əɖːaː', '机场', 'अड्डा 的 ड्ड 是重叠辅音，IPA 用长度标记。'],
  ['entrance', 'प्रवेश', 'pravesh', 'pɾəʋeːʃ', '入口；进入'],
  ['exit', 'निकास', 'nikās', 'nɪkaːs', '出口；排出'],
  ['north', 'उत्तर', 'uttar', 'ʊt̪ːəɾ', '北'],
  ['south', 'दक्षिण', 'dakṣhiṇ', 'd̪əkʃɪɳ', '南', 'क्ष 是整体合字，本卡取现代印地语常见 /kʃ/。'],
  ['east', 'पूर्व', 'pūrv', 'puːɾʋ', '东'],
  ['west', 'पश्चिम', 'pashchim', 'pəʃtʃɪm', '西'],
  ['district', 'जिला', 'jilā', 'dʒɪlaː', '县；地区', '使用无点的常见 जिला；另有 ज़िला /zɪlaː/ 拼写与读法，不把两者机械视为一张字母卡。'],
  ['state', 'राज्य', 'rājy', 'ɾaːdʒj', '邦；国家政体', '印度地址中常用于邦级行政名；真实词有现代发音变体。'],
  ['india', 'भारत', 'bhārat', 'bʱaːɾət̪', '印度'],
  ['police', 'पुलिस', 'pulis', 'pʊlɪs', '警察'],
]);
const neWords = words('ne', [
  ['nepal', 'नेपाल', 'nepāla', 'nepal', '尼泊尔', '保留表中的词尾 a 是字母转写约定；地图名 Nepal 和实际词尾 /l/ 分列。'],
  ['road', 'सडक', 'saḍaka', 'sʌɽʌk', '道路', '无下点的 ड 在元音间读闪音；不是把印地语 ड़ 的拼写直接搬来。'],
  ['path', 'बाटो', 'bāṭo', 'baʈo', '路；道路'],
  ['river', 'खोला', 'kholā', 'kʰola', '河流'],
  ['village', 'गाउँ', 'gāum̐', 'ɡãũ', '村庄', '独立 उ 也参与元音序列；月点标鼻化，不添鼻辅音。本词与印地语 गाँव 的字形和读法不同。'],
  ['house', 'घर', 'ghara', 'ɡʱʌɾ', '房屋；家', '保留表中的词尾 a，实际词尾是 rhotic；本课选闪音变体，词典也用颤音记号。'],
  ['police', 'प्रहरी', 'praharī', 'prʌʔʌɾi', '警察', '选用词典所列声门间断变体；另有 h 弱化和气声长元音读法，不从字母卡机械拼读。'],
  ['bus', 'बस', 'basa', 'bʌs', '公共汽车'],
]);
const mrWords = words('mr', [
  ['road', 'रस्ता', 'rastā', 'ɾəst̪a', '道路'],
  ['village', 'गाव', 'gāva', 'ɡaʋ', '村庄', 'ALA-LC 保留词尾 a；实际语音不必读出该元音。'],
  ['police', 'पोलीस', 'polīsa', 'polis', '警察'],
  ['school', 'शाळा', 'śāḷā', 'ɕaɭa', '学校', 'ळ 的卷舌边音与普通 ल /l/ 不同；本课宽式略去词典的短促边音附标。'],
  ['water', 'पाणी', 'pāṇī', 'paɳi', '水'],
  ['highway', 'महामार्ग', 'mahāmārga', 'məɦamaɾɡ', '公路；干道'],
  ['shop', 'दुकान', 'dukāna', 'd̪ukan', '商店'],
  ['maharashtra', 'महाराष्ट्र', 'mahārāshṭra', 'məɦaɾaʂʈɾə', '马哈拉施特拉邦', 'ष्ट्र 含卷舌群与后置 r；这是邦名词，不用一个城市红点代表全邦。'],
]);

type CityRow = [string, string, string, string, string, string[], [number, number]];
const hiCityRows: CityRow[] = [
  ['delhi', 'दिल्ली', 'dillī', 'd̪ɪlːiː', '德里', ['Delhi', 'Dilli'], [77.209, 28.614]],
  ['jaipur', 'जयपुर', 'jayapur', 'dʒəjpʊɾ', '斋浦尔', ['Jaipur'], [75.787, 26.912]],
  ['agra', 'आगरा', 'āgarā', 'aːɡɾaː', '阿格拉', ['Agra'], [78.008, 27.177]],
  ['lucknow', 'लखनऊ', 'lakhanaū', 'ləkʰnəuː', '勒克瑙', ['Lucknow', 'Lakhnau'], [80.947, 26.847]],
  ['kanpur', 'कानपुर', 'kānapur', 'kaːnpʊɾ', '坎普尔', ['Kanpur', 'Cawnpore'], [80.331, 26.449]],
  ['varanasi', 'वाराणसी', 'vārāṇasī', 'ʋaːɾaːɳsiː', '瓦拉纳西', ['Varanasi', 'Banaras', 'Benares'], [82.973, 25.318]],
  ['patna', 'पटना', 'paṭanā', 'pəʈnaː', '巴特那', ['Patna'], [85.137, 25.594]],
  ['bhopal', 'भोपाल', 'bhopāl', 'bʱoːpaːl', '博帕尔', ['Bhopal'], [77.413, 23.26]],
  ['indore', 'इंदौर', 'iṁdaur', 'ɪnd̪ɔːɾ', '印多尔', ['Indore'], [75.858, 22.72]],
  ['prayagraj', 'प्रयागराज', 'prayāgarāj', 'pɾəjaːɡɾaːdʒ', '普拉亚格拉杰', ['Prayagraj', 'Allahabad'], [81.846, 25.436]],
];
const neCityRows: CityRow[] = [
  ['kathmandu', 'काठमाडौँ', 'kāṭhamāḍaum̐', 'kaʈʰmaɽʌ̃ũ', '加德满都', ['Kathmandu', 'Katmandu'], [85.324, 27.717]],
  ['pokhara', 'पोखरा', 'pokharā', 'pokʰʌɾa', '博卡拉', ['Pokhara'], [83.986, 28.209]],
  ['lalitpur', 'ललितपुर', 'lalitapura', 'lʌlit̪puɾ', '拉利特普尔', ['Lalitpur', 'Patan'], [85.325, 27.664]],
  ['bharatpur', 'भरतपुर', 'bharatapura', 'bʱʌɾʌt̪puɾ', '婆罗多布尔', ['Bharatpur'], [84.428, 27.683]],
  ['biratnagar', 'विराटनगर', 'virāṭanagara', 'biɾaʈnʌɡʌɾ', '比拉特纳加尔', ['Biratnagar'], [87.27, 26.452]],
  ['janakpur', 'जनकपुर', 'janakapura', 'dzʌnʌkpuɾ', '贾纳克布尔', ['Janakpur', 'Janakpurdham'], [85.925, 26.728]],
  ['dharan', 'धरान', 'dharāna', 'd̪ʱʌɾan', '达兰', ['Dharan'], [87.284, 26.813]],
  ['butwal', 'बुटवल', 'buṭavala', 'buʈʌwʌl', '布德沃尔', ['Butwal'], [83.448, 27.7]],
  ['nepalgunj', 'नेपालगञ्ज', 'nepālagañja', 'nepalɡʌndz', '尼泊尔根杰', ['Nepalgunj', 'Nepalganj'], [81.617, 28.05]],
  ['bhaktapur', 'भक्तपुर', 'bhaktapura', 'bʱʌkt̪ʌpuɾʌ', '巴克塔普尔', ['Bhaktapur', 'Bhadgaon'], [85.429, 27.672]],
];
const mrCityRows: CityRow[] = [
  ['mumbai', 'मुंबई', 'mumbaī', 'mumbəi', '孟买', ['Mumbai', 'Bombay'], [72.878, 19.076]],
  ['pune', 'पुणे', 'puṇe', 'puɳe', '浦那', ['Pune', 'Poona'], [73.857, 18.52]],
  ['nagpur', 'नागपूर', 'nāgapūra', 'naɡpuːɾ', '那格浦尔', ['Nagpur'], [79.088, 21.146]],
  ['nashik', 'नाशिक', 'nāśika', 'naɕik', '纳西克', ['Nashik', 'Nasik'], [73.79, 19.997]],
  ['thane', 'ठाणे', 'ṭhāṇe', 'ʈʰaɳe', '塔那', ['Thane'], [72.978, 19.218]],
  ['kolhapur', 'कोल्हापूर', 'kolhāpūra', 'kolʱapuɾ', '科尔哈布尔', ['Kolhapur'], [74.243, 16.705]],
  ['solapur', 'सोलापूर', 'solāpūra', 'solapuɾ', '索拉普尔', ['Solapur', 'Sholapur'], [75.906, 17.66]],
  ['satara', 'सातारा', 'sātārā', 'sat̪aɾa', '萨塔拉', ['Satara'], [73.994, 17.681]],
  ['sangli', 'सांगली', 'sāṅgalī', 'saŋɡli', '桑格利', ['Sangli'], [74.576, 16.852]],
  ['ratnagiri', 'रत्नागिरी', 'ratnāgirī', 'ɾət̪naɡiɾi', '勒德纳吉里', ['Ratnagiri'], [73.312, 16.994]],
];
function cities(language: Language, rows: CityRow[]): Knowledge[] {
  return words(language, rows.map(([id, glyph, roman, ipa, name]) =>
    [id, glyph, roman, ipa, name, `${labels[language]}城市名；保留拼写、宽式音值和新旧地图惯用名。红点仅为市区近似位置，不是城市边界。`]))
    .map((item, index) => ({
      ...item, extra: language === 'hi' || undefined, group: `${labels[language]} · 城市`,
      conventionalNames: rows[index][5],
      place: { type: 'city', coordinates: rows[index][6], mapId: language === 'ne' ? 'nepal' : 'india' },
    }));
}
const hiCities = cities('hi', hiCityRows), neCities = cities('ne', neCityRows), mrCities = cities('mr', mrCityRows);
const unit = (language: Language, id: number, title: string, subtitle: string, ids: string[], phase: string): Unit => ({
  id: `${prefix(language)}-u${id}`, title, subtitle, phase, items: ids.map(id => key(language, id)),
  note: `${labels[language]}：${subtitle}。以完整字块、规范转写和实际 IPA 分别练习；本单元结束后有综合复习。人工宽式词音仍待独立语言审读。`,
});
const units: Unit[] = [
  unit('hi', 1, '从顶线到字块', '文字不等于语言；固有元音与送气', ['overview', 'inherent', 'aspiration', 'k', 'g', 'm', 'n'], '01 · 字块与辅音'),
  unit('hi', 2, '软腭音与塞擦音', 'ख घ ङ 与 च छ ज झ ञ', ['kh', 'gh', 'ng', 'ch', 'chh', 'j', 'jh', 'ny'], '01 · 字块与辅音'),
  unit('hi', 3, '齿音与唇音', '不把 th 当英语 th', ['t', 'th', 'd', 'dh', 'p', 'ph', 'b', 'bh'], '01 · 字块与辅音'),
  unit('hi', 4, '卷舌、近音与咝音', 'ट ठ ड ढ ण 与其余常用辅音', ['tt', 'tth', 'dd', 'ddh', 'nn', 'y', 'r', 'l', 'v', 'sh', 'ss', 's', 'h'], '01 · 字块与辅音'),
  unit('hi', 5, '六个基础独立元音', 'अ आ इ ई उ ऊ', ['a', 'aa', 'i', 'ii', 'u', 'uu'], '02 · 元音与附标'),
  unit('hi', 6, 'e、o 与历史拼写', 'ए ऐ ओ औ ऋ 的现代读法', ['e', 'ai', 'o', 'au', 'ri'], '02 · 元音与附标'),
  unit('hi', 7, '先看位置，再认读序', '左侧 i 与上下元音附标', ['matra', 'aa-sign', 'i-sign', 'ii-sign', 'u-sign', 'uu-sign'], '02 · 元音与附标'),
  unit('hi', 8, '头顶与两侧的附标', 'े ै ो ौ ृ', ['e-sign', 'ai-sign', 'o-sign', 'au-sign', 'ri-sign'], '02 · 元音与附标'),
  unit('hi', 9, '认识常见合字', 'virama、क्ष、ज्ञ 与后置 r', ['halant', 'ksh', 'gy', 'tr', 'pr', 'kr'], '03 · 合字与变音'),
  unit('hi', 10, 'r 的位置与辅音群', 'reph、rakar 和半形', ['ra-forms', 'rk', 'ry', 'shr', 'st', 'nt'], '03 · 合字与变音'),
  unit('hi', 11, '鼻音点与月点', '鼻辅音、鼻化与 visarga', ['nasal', 'anusvara', 'candrabindu', 'visarga'], '03 · 合字与变音'),
  unit('hi', 12, '下点与借词字母', 'क़ ख़ ग़ ज़ फ़ ड़ ढ़', ['nukta', 'q', 'x', 'gh-fricative', 'z', 'f', 'flap', 'flap-h'], '03 · 合字与变音'),
  unit('hi', 13, '数字、实际读音与地图', '०–९、固有元音脱落和地图异拼', ['schwa', ...digits.map(item => item.id.replace('dv-', '')), 'maps'], '04 · 从字块到街景'),
  unit('hi', 14, '道路与沿街设施', '道路、市场、村镇、商店和医院', mainWords.slice(0, 8).map(item => item.id.replace('dv-', '')), '04 · 从字块到街景'),
  unit('hi', 15, '交通与出入口', '学校、桥、河流、铁路与机场', mainWords.slice(8, 16).map(item => item.id.replace('dv-', '')), '04 · 从字块到街景'),
  unit('hi', 16, '方位与地址层级', '四个方向、县、邦与常见招牌', mainWords.slice(16).map(item => item.id.replace('dv-', '')), '04 · 从字块到街景'),
];
const neBranch: CourseBranch = {
  id: 'ne', languageId: 'ne', title: '尼泊尔语',
  description: '同用天城文：单独学习尼泊尔语元音、齿龈塞擦音、元音保留与闪音，再读道路、村庄、河流和尼泊尔 10 城。不是印地语换地名。',
  units: [
    unit('ne', 1, '尼泊尔语的同形异音', '先辨语言、塞擦音和咝音合流', ['overview', 'spelling', ...neLetters.map(item => item.id.replace('dv-ne-', ''))], '分支 · 尼泊尔语'),
    unit('ne', 2, '尼泊尔语的独立元音', '不照搬印地语长短和 ai/au', neVowels.filter(item => !item.id.endsWith('-sign')).map(item => item.id.replace('dv-ne-', '')), '分支 · 尼泊尔语'),
    unit('ne', 3, '把元音放回字块', '十个附标与各自的尼泊尔语音值', neVowels.filter(item => item.id.endsWith('-sign')).map(item => item.id.replace('dv-ne-', '')), '分支 · 尼泊尔语'),
    unit('ne', 4, '尼泊尔语街景词', '元音保留、鼻化、道路、村庄与警察', ['context', ...neSymbols.map(item => item.id.replace('dv-ne-', '')), ...neWords.map(item => item.id.replace('dv-ne-', ''))], '分支 · 尼泊尔语'),
    { ...unit('ne', 5, '尼泊尔 · 10 个城市', '加德满都、博卡拉与主要城市', neCities.map(item => item.id.replace('dv-ne-', '')), '分支 · 尼泊尔语'), placeLesson: true, supplementary: true },
  ],
};
const mrBranch: CourseBranch = {
  id: 'mr', languageId: 'mr', title: '马拉地语',
  description: '同用天城文：补 ळ、语言特有音值、睫毛形 r、借词元音和 ALA-LC 转写，再练马哈拉施特拉邦招牌与 10 城。',
  units: [
    unit('mr', 1, '马拉地语与特有边音', 'ḷ、c/ch 与条件塞擦音', ['overview', 'affricates', ...mrLetters.map(item => item.id.replace('dv-mr-', ''))], '分支 · 马拉地语'),
    unit('mr', 2, '元音区别与借词元音', '拼写长短、ॲ、ऑ 与现代音值', mrVowels.filter(item => !item.id.endsWith('-sign')).map(item => item.id.replace('dv-mr-', '')), '分支 · 马拉地语'),
    unit('mr', 3, '附标与睫毛形 r', '字块成形与语言字形偏好', [...mrVowels.filter(item => item.id.endsWith('-sign')).map(item => item.id.replace('dv-mr-', '')), 'eyelash'], '分支 · 马拉地语'),
    unit('mr', 4, '马拉地语街景词', '鼻音、词尾与常见地方词', ['nasal', ...mrWords.map(item => item.id.replace('dv-mr-', ''))], '分支 · 马拉地语'),
    { ...unit('mr', 5, '马哈拉施特拉邦 · 10 城', '孟买、浦那与主要城市', mrCities.map(item => item.id.replace('dv-mr-', '')), '分支 · 马拉地语'), placeLesson: true, supplementary: true },
  ],
};
const language = (id: Language, romanizationName: string) => ({
  id, label: labels[id], locale: id, romanizationName, romanizationSource: standards[id],
  ipaNote: id === 'ne' ? '现代标准语宽式；i/ī、u/ū 不强制长度对立；省略非区别性重音，词音待独立审读。'
    : id === 'mr' ? '现代马拉地语宽式；条件塞擦音与元音长度需按完整词核对，词音待独立审读。'
      : '现代标准印地语宽式，省略可预测重音；转写不自动等于脱落元音后的语音。',
  onlineListening: { label: `在线听${labels[id]}`, language: id },
});
export const devanagariCourse: Course = {
  id: 'devanagari', type: 'script', title: '天城文', nativeTitle: 'देवनागरी', scriptName: '天城文',
  scriptClass: 'devanagari', direction: 'ltr', locale: 'hi', englishTitle: 'DEVANAGARI',
  iconGlyph: 'क', label: '天城文 · 印地语主线',
  description: '从字块、元音附标与合字，走向可读的道路、地址和城市名。印地语主线，另有同用天城文的尼泊尔语、马拉地语平行分支。',
  notationNote: '印地语/尼泊尔语用各自 UNGEGN 表，马拉地语用 ALA-LC 2011；规范转写、实际 IPA 与地图名分开。人工宽式词音尚待独立母语审读，无本站真人录音。',
  romanizationName: 'UNGEGN 1972/1977', romanizationSource: 'hi-ungegn',
  ipaNote: '现代标准印地语宽式；辅音卡只标辅音成分，不自动添加固有元音。省略可预测重音，不覆盖全部口音。',
  pronunciationReference: 'hi-teaching',
  onlineListening: { label: '在线听印地语', language: 'hi' },
  referenceNotes: [
    '天城文不是语言或国家。主线现代印地语，分支只收共用天城文的尼泊尔语与马拉地语；不含梵语吟诵课程。',
    'UNGEGN 推荐标准不等于印度或尼泊尔所有路牌的统一拼法。马拉地语书目转写保留词尾 a；输入接受去附加符号形式与列出的地图名。',
    '不启用自动拼词生成：元音脱落、合字特殊读法、语言差异和借词不能由通用字符替换器可靠推导。',
    '词条宽式 IPA、字形变体和来源状态在研究包中逐项记录，尚未取得独立母语者全量审读。',
    '仅显式完整词提供匹配语言的可选设备语音及在线收听。没有本站真人录音，也不以印地语声音替代另外两个分支。',
  ],
  mainLanguageId: 'hi', languages: [
    language('hi', 'UNGEGN 1972/1977'), language('ne', 'UNGEGN 1972'), language('mr', 'ALA-LC 2011'),
  ],
  geography: { ...india, projection: { ...india.projection, translate: india.projection.translate as [number, number] } },
  geographies: {
    india: { ...india, projection: { ...india.projection, translate: india.projection.translate as [number, number] } },
    nepal: { ...nepal, projection: { ...nepal.projection, translate: nepal.projection.translate as [number, number] } },
  },
  units, extraUnits: [{
    id: 'dv-extra-1', title: '印地语地区 · 10 个城市', subtitle: '德里、斋浦尔、瓦拉纳西等',
    phase: '额外 · 地名', items: hiCities.map(item => item.id), supplementary: true, placeLesson: true,
    note: '城市红点只表示近似市区位置。规范转写、宽式 IPA 与地图新旧惯用名并列，需先学完主线或确认提前解锁。',
  }],
  branches: [neBranch, mrBranch],
  items: [...rules, ...consonants, ...vowels, ...symbols, ...loans, ...clusters, ...digits,
    ...mainWords, ...hiCities, ...neRules, ...neLetters, ...neVowels, ...neSymbols, ...neWords, ...neCities,
    ...mrRules, ...mrLetters, ...mrVowels, ...mrWords, ...mrCities],
  sources: sources.filter(source => ['hi-ungegn', 'ne-ungegn', 'mr-loc', 'deva-unicode', 'hi-orthography',
    'ne-phonetics', 'deva-lexicon', 'hi-teaching', 'bn-india-boundaries', 'deva-nepal-boundaries',
    ...Object.values(supplementalSpellings)].includes(source.id)),
};
