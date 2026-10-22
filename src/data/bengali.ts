import type { Course, Knowledge, Unit } from '../types';
import { sources } from './sources';
import geography from './bengali-map.json' with { type: 'json' };

const refs = ['bn-script', 'bn-orthography'];
const ids = (names: string[]) => names.map(name => `bn-${name}`);
const inputAliases = (roman: string) => roman.includes('ô') ? [roman.replaceAll('ô', 'aw')] : undefined;
const rule = (
  id: string, glyph: string, title: string, explanation: string, rulePrompt: string,
  ruleAnswer: string, ruleChoices: string[], requires: string[] = [],
): Knowledge => ({
  id: `bn-${id}`, courseId: 'bengali', kind: 'rule', glyph, title, roman: '', ipa: '',
  explanation, rulePrompt, ruleAnswer, ruleChoices, requires: ids(requires),
  group: '书写与拼读', sources: refs,
});

const rules = [
  rule('inherent', 'ক → কা', '辅音后面可能藏着元音',
    '孟加拉文从左往右写。单独的 ক 不等于一个永远只读 /k/ 的完整音节：辅音通常带固有元音 /ɔ/ 或 /o/，加 া 后成为 কা /ka/。辅音卡的 k /k/ 只标辅音部分，不是字母名称，也不是要求在所有词里删掉元音。本课 ô 表示 /ɔ/，o 表示 /o/；ô 可输入 aw。这是读音教学转写，不是 ALA-LC 或官方地图规范。',
    'কা 中的 া 对 ক 做了什么？', '把固有元音换成 /a/', ['在 /kɔ/ 后再加一个 /a/', '把 /k/ 变成 /ɡ/', '表示声调']),
  rule('signs', 'কি · কু · কো', '附标围着辅音，发音跟在后面',
    '◌ 是附标的示意位置，不是需要写出的字母。元音附标可以在左、右、下或两侧，但都跟在所属辅音或合字的辅音部分后发音。কি 是 /ki/，不是 /ik/；কো 的左右两部分构成一个 o 附标。独立元音 ই 与附标 ি 用途不同，不能随意互换。整块字形必须保留，不能按屏幕上各笔画的顺序读。',
    'কি 的 ি 虽显示在左侧，应如何读？', '/k/ 后读 /i/', ['/i/ 后读 /k/', '只读 /i/', '读成两个独立词'], ['inherent']),
  rule('final-vowel', 'নগর · রাস্তা', '没有附标，不保证有元音',
    '固有元音会受词形和邻近元音影响，/ɔ/ 与 /o/ 不能机械互换；词尾辅音又常常不带元音。নগর 的常见读法是 /nɔɡoɾ/，最后 র 不再加一个 ô；রাস্তা 的 স 后也不额外插入元音。没有 ্ 不等于必须读出固有元音，有些词尾却仍保留 /o/，如 পূর্ব /puɾbo/。要按实际词读，不能建立“所有词尾一律删元音”的替换器。',
    'নগর /nɔɡoɾ/ 最后的 র 应怎样处理？', '只读尾部 /ɾ/，不再加元音', ['一定读 /ɾɔ/', '一律不发音', '再加一个 /a/'], ['r', 'g']),
  rule('hasanta', 'ক্ + র → ক্র', 'হসন্ত 与合字',
    '্ 叫 hasanta，也称 virama，用来取消前一个辅音的固有元音；后接辅音时常形成合字。ক্ + র 写成 ক্র，字体可能让两部分连成难以认出的整体。不要在两个辅音中间随意加 ô。并非每个合字都保留各字母的独立读法，ক্ষ、জ্ঞ 等必须单独核对；本课只学常见结构，不穷举全部合字。',
    'ক্ + র 形成 ক্র 时，ক 后的固有元音怎样了？', '被 ্ 取消', ['变成长元音', '变成声调', '变成数字'], ['k', 'r', 'final-vowel']),
  rule('nasal-signs', 'বাংলা · চাঁদ · দুঃখ', '鼻音符号不是一回事',
    'ং 通常表示鼻音 /ŋ/，বাংলা /baŋla/ 就用到它；ঁ 是 candrabindu，标记元音鼻化，如 চাঁদ 的传统标准读法 /tʃãd̪/，不是另外加一个 n。孟加拉国标准语的鼻化对立往往弱化，不能要求所有地区都保持同样程度。ঃ 是 visarga，借词中可对应后续辅音重叠等，不能总读 h；本课只辨认这三种形状，具体词单独记音。',
    'বাংলা 里的 ং 在这个词中表示什么？', '鼻音 /ŋ/', ['元音 /a/ 鼻化而没有鼻辅音', '声调', '句号'], ['b', 'aa-sign', 'l']),
  rule('s-reading', 'সড়ক · রাস্তা', 'স 的读法要看实际词',
    'শ、ষ 的常见标准音值是 /ʃ/；স 在很多词中也读 /ʃ/，如 সড়ক /ʃɔɽok/，但在 রাস্তা /ɾast̪a/、স্কুল /skul/ 等词中读 /s/。现代孟加拉国标准语还存在 /s/ 与 /ʃ/ 的词汇对立。字母卡给出 স 的常见 /ʃ/，不是无条件替换规则；地名 সিলেট 在本课采用 /sileʈ/。',
    'রাস্তা /ɾast̪a/ 里的 স 读什么？', '/s/', ['/ʃ/，因为所有 স 都如此', '/z/', '不发音'], ['s', 'sh', 't']),
  rule('phala', 'ব্যা · ক্র · র্ব', '同一字母在合字里会变形',
    'র 在后位可形成 র-ফলা，如 ক্র /kɾ/；在前位的 র্ 可显示为上方 reph，如 র্ব /ɾb/。য-ফলা 写成 ্য，在词首辅音后可以参与 /æ/ 的拼写，如 ব্যা；词内却常使前一个辅音重叠，并不是一律读 y。ব-ফলা 也不能一律照独立 ব 读 /b/。本课将常见合字作为整体学，未列结构仍需逐词核对。',
    'পূর্ব 的 র্ব，辅音先后次序是什么？', '/ɾ/ 在 /b/ 前', ['/b/ 在 /ɾ/ 前', '只有 /b/，র 永远不读', '两个元音'], ['hasanta', 'rb', 'y']),
  rule('loan', 'হোটেল · বাস', '借词与地图名不按英语猜',
    '英语来源词进入孟加拉语后会适应本地发音。হোটেল /hoʈel/ 可表示旅馆，也常表示餐馆；বাস 作为“公共汽车”时采用 /bas/，不能用同形词“居住”的 /baʃ/ 代替。书面文字不直接决定本地口音，送气、卷舌和 r 的实现有地区差别。学习真实整词，不把英语原词发音直接当成孟加拉语答案。',
    '招牌上的 হোটেল 只能表示提供住宿的旅馆吗？', '不一定，也常指餐馆', ['一定只指旅馆', '只指医院', '只是城市名'], ['retro-t', 's-reading']),
  rule('maps', 'চট্টগ্রাম · Chattogram', '文字、读音和地图名分开看',
    'Chattogram / Chittagong、Cumilla / Comilla、Jashore / Jessore 是可能遇到的地图拼名，不是一套可逆的字母编码。地名课另列这些惯用名，并接受其输入；主栏仍是本课读音转写。孟加拉语文字也用于印度的西孟加拉邦、特里普拉邦等地，看到它不能单凭文字断定在孟加拉国。阿萨姆语使用近亲文字及 ৰ、ৱ 等字母，不要把它的读音套进本课程。',
    '在街景里看到孟加拉语文字，就一定在孟加拉国吗？', '不一定，印度部分地区也使用', ['一定在孟加拉国', '一定在泰国', '只在斯里兰卡使用']),
];
rules.find(item => item.id === 'bn-nasal-signs')!.sources = [...refs, 'bn-phonetics'];
rules.find(item => item.id === 'bn-s-reading')!.sources = [...refs, 'bn-phonetics'];
rules.find(item => item.id === 'bn-maps')!.sources = ['bn-unicode', 'bn-government', 'bn-loc'];

type LetterRow = [string, string, string, string, string, string[]?];
const consonantRows: LetterRow[] = [
  ['k', 'ক', 'k', 'k', '不送气清软腭塞音，近似汉语拼音 g 的辅音部分。不要在辅音卡的 /k/ 后自动添元音。'],
  ['n', 'ন', 'n', 'n', '常用鼻音；与 ম 的右侧弯钩形状比较。可作尾音，不一定另成音节。'],
  ['m', 'ম', 'm', 'm', '双唇鼻音；নাম /nam/ 的末尾就是这个辅音，不读成 nama。'],
  ['kh', 'খ', 'kh', 'kʰ', '送气的 k；kh 是一个送气辅音，不是 k 加独立的 h，也不是 /x/。'],
  ['g', 'গ', 'g', 'ɡ', '浊软腭塞音。与 ক /k/ 的差别是清浊，不是送气。'],
  ['gh', 'ঘ', 'gh', 'ɡʱ', '带气声的浊软腭塞音。ʱ 与清音送气的 ʰ 分开记。'],
  ['ng', 'ঙ', 'ng', 'ŋ', '软腭鼻音；现代语中通常不作词首声母，常见于词中和合字。不是 n 加 g。'],
  ['p', 'প', 'p', 'p', '不送气清双唇塞音，近似汉语拼音 b 的辅音部分。'],
  ['ph', 'ফ', 'ph', 'pʰ', '传统读音是送气 /pʰ/，现代尤其孟加拉国也常实现为 /f/。本卡记传统值；具体借词不机械替换。'],
  ['b', 'ব', 'b', 'b', '浊双唇塞音。独立字母读音与合字中的 ব-ফলা 行为需要分别学习。'],
  ['bh', 'ভ', 'bh', 'bʱ', '带气声的浊双唇塞音；部分说话人接近 /v/。不要把 bh 当作清音 /pʰ/。'],
  ['t', 'ত', 't', 't̪', '齿音，舌尖接近上齿。转写 t 与 ট 相同，IPA 的下齿标区分它们。'],
  ['th', 'থ', 'th', 't̪ʰ', '送气清齿塞音；不是英语 th 的 /θ/。在 থানা、পথ 中常见。'],
  ['d', 'দ', 'd', 'd̪', '浊齿塞音，舌尖接近上齿；与 ড 的后移舌位区分。'],
  ['dh', 'ধ', 'dh', 'd̪ʱ', '带气声的浊齿塞音，不是清音 থ，也不是英语 /ð/。'],
  ['l', 'ল', 'l', 'l', '舌侧近音。在 বাংলা、স্কুল 等词中常见，尾音不必加固有元音。'],
  ['r', 'র', 'r', 'ɾ', '本课用闪音 /ɾ/ 作传统宽式记音；孟加拉国标准语常接近近音 [ɹ]。合字中的 র 还会变形。'],
  ['ch', 'চ', 'ch', 'tʃ', '不送气清塞擦音；本课用 ch，不使用 ALA-LC 的 c。孟加拉国常更接近 [tɕ]。'],
  ['chh', 'ছ', 'chh', 'tʃʰ', '送气清塞擦音；与 চ 的主要区别是送气。字形相似，不是同一个字母。'],
  ['j', 'জ', 'j', 'dʒ', '浊塞擦音；孟加拉国常更接近 [dʑ]，不是英语 yes 开头的 /j/。'],
  ['jh', 'ঝ', 'jh', 'dʒʱ', '带气声的浊塞擦音。不要把它与送气清音 ছ 混淆。'],
  ['y', 'য', 'j', 'dʒ', '独立使用时常与 জ 同音，通常不是 /j/；在 যশোর 开头就读 j。য-ফলা 另有条件读法。'],
  ['ny', 'ঞ', 'n', 'n', '现代标准语中多见于合字，常并入鼻音；如 ঞ্জ 可读 /ndʒ/。传统名称反映历史腭鼻音，不能据此要求所有词都读 /ɲ/。'],
  ['retro-t', 'ট', 't', 'ʈ', '传统宽式称卷舌系列，与齿音 ত 区分。孟加拉国常偏齿龈后、未必强卷舌。地图英语 t 无法区分二者。'],
  ['retro-th', 'ঠ', 'th', 'ʈʰ', 'ট 系列的送气清音；舌位比 থ 靠后，送气仍是另一个维度。'],
  ['retro-d', 'ড', 'd', 'ɖ', 'ট 系列的浊音；不是齿音 দ。在借词与地名中也常见。'],
  ['retro-dh', 'ঢ', 'dh', 'ɖʱ', '带气声的后部浊塞音；ঢাকা 的开头是这个字母，不是 ধ。'],
  ['retro-n', 'ণ', 'n', 'n', '保留梵语来源拼写的鼻音字母；现代孟加拉语通常与 ন 合流，不要求另背一个卷舌 /ɳ/。'],
  ['flap', 'ড়', 'r', 'ɽ', 'ড 加下点形成的字母，传统宽式记 /ɽ/，如 পাড়া；孟加拉国常与 /ɹ/ 合流。下点不能漏认。', ['retro-d']],
  ['flap-h', 'ঢ়', 'rh', 'ɽʱ', 'ঢ 加下点形成的历史气声闪音字母，现代读法有合流与弱化。常见于书面词；不能把它看成普通 ঢ。', ['retro-dh']],
  ['glide', 'য়', 'y', 'j', '与 য 不同；常连接元音或参与滑音，实际可表现为 /j/、[e̯] 等，依词核对。不是自动插入完整的 jô 音节。', ['y']],
  ['s', 'স', 'sh', 'ʃ', '本卡记常见 /ʃ/，不是唯一读法；在 রাস্তা、স্কুল、部分地名与借词中还可读 /s/。'],
  ['sh', 'শ', 'sh', 'ʃ', '常见的清龈后擦音，近似英语 sh。与 স、ষ 的拼写不同，现代读音常合流。'],
  ['ss', 'ষ', 'sh', 'ʃ', '传统“卷舌 ṣ”的拼写在现代语中通常并入 /ʃ/；合字 ক্ষ、ষ্ট 等不能逐字相加。'],
  ['h', 'হ', 'h', 'h', '声门擦音，元音间常有气声实现。合字中行为可能不同，不能一律照孤立字母发音。'],
  ['khanda-t', 'ৎ', 't', 't̪', 'খণ্ড-ত 是没有固有元音的 t，常用于音节末。它有独立编码，不是随意缩写的普通 ত。', ['hasanta', 't']],
  ['anusvara', 'ং', 'ng', 'ŋ', 'anusvara 是鼻音符号，在 বাংলা 中读 /ŋ/。它不是独立的带固有元音字母，也不是元音鼻化符号 ঁ。', ['nasal-signs']],
];
const consonants: Knowledge[] = consonantRows.map(([id, glyph, roman, ipa, explanation, requires = []]) => ({
  id: `bn-${id}`, courseId: 'bengali', kind: 'consonant', glyph, roman, ipa,
  title: `${glyph} · ${id === 'anusvara' ? '鼻音符号' : id === 'khanda-t' ? '无元音尾辅音' : '辅音部分'}`,
  explanation, group: id === 'anusvara' ? '鼻音符号' : '辅音', requires: ids(['inherent', ...requires]), sources: refs,
}));

type VowelRow = [string, string, string, string, string, string[]?];
const vowelRows: VowelRow[] = [
  ['aa-sign', '◌া', 'a', 'a', '右侧的 আ-kar。না /na/ 中的 া 属于 ন；它替换固有元音，不是在 nô 后再加 a。', ['signs']],
  ['a', 'অ', 'ô', 'ɔ', '独立元音，常见音值 /ɔ/；受上下文影响也可接近 /o/。不是汉语拼音 a。'],
  ['aa', 'আ', 'a', 'a', '独立的 /a/。拼写传统区分 অ 与 আ，不等于现代语里同一元音的短音和长音。'],
  ['i', 'ই', 'i', 'i', '独立 i。与 ঈ 在现代语中通常同音，但拼写和词源不同。'],
  ['ii', 'ঈ', 'i', 'i', '传统长 i 字母。现代标准语通常不再与 ই 形成元音长短对立，不强制读 /iː/。'],
  ['u', 'উ', 'u', 'u', '独立 u。与 ঊ 的现代读音通常相同，字形仍要辨认。'],
  ['uu', 'ঊ', 'u', 'u', '传统长 u 字母。现代语一般与 উ 合流，不能仅因传统名称就加 IPA 长音号。'],
  ['i-sign', '◌ি', 'i', 'i', 'ি 显示在辅音左侧，发音仍在后面。কি → ki /ki/；不要写成独立 ই 加 ক。', ['signs']],
  ['ii-sign', '◌ী', 'i', 'i', 'ী 是 ঈ 对应附标，现代音值通常与 ি 相同。নদী 里的传统长 i 拼写不意味着必须读长元音。', ['signs']],
  ['u-sign', '◌ু', 'u', 'u', 'ু 附在辅音下方；কু → ku /ku/。复杂字形里附标可能与基字连接。', ['signs']],
  ['uu-sign', '◌ূ', 'u', 'u', 'ূ 是 ঊ 对应附标，现代通常同样读 /u/。与 ◌ু 比较下方笔画，不另背虚构的长短对立。', ['signs']],
  ['e', 'এ', 'e', 'e', '独立 e；一些词里可读 /ɛ~æ/。本卡记常见 /e/，实际词条给出所采用读法。'],
  ['o', 'ও', 'o', 'o', '独立 o，与 অ 的常见 /ɔ/ 区分；在元音之后也可参与滑音。'],
  ['e-sign', '◌ে', 'e', 'e', 'ে 显示在基字或整个合字左侧。কে → ke /ke/。也有条件性的 /ɛ~æ/，不由此自动生成所有词。', ['signs']],
  ['o-sign', '◌ো', 'o', 'o', 'ো 的字形分在左右两侧，但属于一个元音附标。কো → ko /ko/，不是 e 加 a 两个音节。', ['signs']],
  ['ai', 'ঐ', 'oi', 'oi̯', '传统罗马化常写 ai，现代常见读音为 /oi̯/。本课按读音写 oi，不把 ALA-LC 拼写当成 IPA。'],
  ['au', 'ঔ', 'ou', 'ou̯', '传统罗马化常写 au，现代常见读音为 /ou̯/。是一个音节中的滑动，不是两个完整音节。'],
  ['ai-sign', '◌ৈ', 'oi', 'oi̯', 'ৈ 是 ঐ 对应附标，显示在左上侧，读音仍在辅音后。本卡采用常见 /oi̯/。', ['signs']],
  ['au-sign', '◌ৌ', 'ou', 'ou̯', 'ৌ 是 ঔ 对应的两侧附标。区别于 ◌ো，右边的附加笔画是结构的一部分。', ['signs']],
  ['ri', 'ঋ', 'ri', 'ɾi', '梵语来源元音字母，在现代孟加拉语中通常读 /ɾi/，不是要求发梵语的音节性 /r̩/。'],
  ['ri-sign', '◌ৃ', 'ri', 'ɾi', 'ৃ 是 ঋ 对应附标，在现代语中一般读 ri。它不是另一个普通 u 附标。', ['signs']],
  ['ae-sign', '◌্যা', 'ae', 'æ', '在词首辅音后，য-ফলা 与 া 常参与 /æ/，如 ব্যা。这个模板只教这一条件值；词内的 য-ফলা 可能使前一个辅音重叠，不能直接套用。', ['phala']],
];
const vowels: Knowledge[] = vowelRows.map(([id, glyph, roman, ipa, explanation, requires = []]) => ({
  id: `bn-${id}`, courseId: 'bengali', kind: 'vowel', glyph, roman, ipa,
  title: `${glyph} · ${glyph.includes('◌') ? '元音附标' : '独立元音'}`, explanation,
  aliases: inputAliases(roman), group: glyph.includes('◌') ? '元音附标' : '独立元音',
  requires: ids(['inherent', ...requires]), sources: refs,
}));

type ClusterRow = [string, string, string, string, string[], string];
const clusterRows: ClusterRow[] = [
  ['kr', 'ক্র', 'kr', 'kɾ', ['k', 'r'], 'ক্ + র；র-ফলা 的形状不再像完整 র，辅音间不插元音。'],
  ['gr', 'গ্র', 'gr', 'ɡɾ', ['g', 'r'], 'গ্ + র；গ্রাম /ɡɾam/ 的开头。把完整合字认作一个结构。'],
  ['pr', 'প্র', 'pr', 'pɾ', ['p', 'r'], 'প্ + র；pr 是辅音群，不是两个各带元音的字母名。'],
  ['tr', 'ত্র', 'tr', 't̪ɾ', ['t', 'r'], 'ত্ + র；传统字体中整个形状变化明显，注意不是 ট 的系列。'],
  ['rb', 'র্ব', 'rb', 'ɾb', ['r', 'b'], 'র্ + ব；前位 র্ 形成上方 reph，先读 r 再读 b。পূর্ব 的辅音部分用到它。'],
  ['tt', 'ত্ত', 'tt', 't̪ː', ['t'], 'ত্ + ত；同一齿塞音延长，不在两个 t 中间加元音。উত্তর 中可实际练习。'],
  ['retro-tt', 'ট্ট', 'tt', 'ʈː', ['retro-t'], 'ট্ + ট；与 ত্ত 的齿音舌位不同，转写 tt 合并了区别，IPA 保留。চট্টগ্রাম 用这个结构。'],
  ['ll', 'ল্ল', 'll', 'lː', ['l'], 'ল্ + ল；辅音延长，不是给元音加长音。কুমিল্লা 中常见。'],
  ['nd', 'ন্দ', 'nd', 'nd̪', ['n', 'd'], 'ন্ + দ；不要把里面的 দ 当成后移舌位的 ড。মন্দির 中先鼻音后齿塞音。'],
  ['ngg', 'ঙ্গ', 'ngg', 'ŋɡ', ['ng', 'g'], 'ঙ্ + গ；鼻音之后还有浊塞音 /ɡ/，与只表示 /ŋ/ 的 ং 不同。'],
  ['nj', 'ঞ্জ', 'nj', 'ndʒ', ['ny', 'j'], 'ঞ্ + জ；常见现代标准音值 /ndʒ/。这个整体不按传统字母名逐个朗读。'],
  ['sk', 'স্ক', 'sk', 'sk', ['s', 'k', 's-reading'], 'স্ + ক；স্কুল 的开头读 /sk/。不是所有含 স 的合字都读 /ʃ/。'],
  ['st', 'স্ট', 'st', 'sʈ', ['s', 'retro-t', 's-reading'], 'স্ + ট；借词中常见。与 স্ত 的齿音 /st̪/ 不同，IPA 帮助分辨。'],
  ['st-dental', 'স্ত', 'st', 'st̪', ['s', 't', 's-reading'], 'স্ + ত；রাস্তা /ɾast̪a/ 的中间结构，不插入额外元音。'],
  ['shch', 'শ্চ', 'shch', 'ʃtʃ', ['sh', 'ch'], 'শ্ + চ；পশ্চিম 的常见读音 /pɔʃtʃim/ 使用此结构，另有地区性实现。'],
  ['ksh', 'ক্ষ', 'kkh', 'kʰː', ['k', 'ss'], 'ক্ + ষ，但许多词内读 /kʰː/，如 দক্ষিণ /d̪ɔkʰːin/，不是 /kʃ/。词首如 ক্ষমা 通常只读 /kʰ/；本卡限定词内重叠值。'],
  ['jny', 'জ্ঞ', 'gg', 'ɡː', ['j', 'ny'], 'জ্ + ঞ，词内如 বিজ্ঞান 的常见辅音部分为 /ɡː/，不能照写成 j+n。词首 জ্ঞান 又常见 /ɡ/；本卡只记词内值，不生成任意组合。'],
];
const clusters: Knowledge[] = clusterRows.map(([id, glyph, roman, ipa, requires, explanation]) => ({
  id: `bn-${id}`, courseId: 'bengali', kind: 'consonant', glyph, roman, ipa,
  title: `${glyph} · 常见合字`, explanation, group: '常见合字',
  requires: ids(['hasanta', ...requires]), sources: refs,
}));

const numbers: Knowledge[] = Array.from('০১২৩৪৫৬৭৮৯', (glyph, number) => ({
  id: `bn-num-${number}`, courseId: 'bengali', kind: 'number', glyph, roman: String(number), ipa: '',
  title: `${glyph} · 数值 ${number}`, explanation: `孟加拉文十进制数字 ${number}。本卡练字形与数值，不把阿拉伯数值伪装成孟加拉语读音；路牌的距离、门牌、电话和车号可以出现这种数字。`,
  group: '数字', requires: [], sources: ['bn-unicode', 'bn-orthography'],
}));

type WordRow = [string, string, string, string, string, string[], string, [string, string, string?][]];
const word = ([id, glyph, roman, ipa, meaning, requires, explanation, segments]: WordRow): Knowledge => ({
  id: `bn-word-${id}`, courseId: 'bengali', kind: 'word', glyph, roman, ipa,
  title: meaning, meaning, explanation, context: explanation, requires: ids(requires),
  aliases: inputAliases(roman), group: '街景词汇', sources: ['bn-lexicon', 'bn-script'],
  segments: segments.map(([text, reading, note]) => ({ text, reading, note })),
  pronunciation: { speech: { text: glyph, label: `整词：${glyph}` } },
});
const words: Knowledge[] = [
  ['naam', 'নাম', 'nam', 'nam', '名称', ['n', 'm', 'aa-sign', 'final-vowel'], '招牌、名称栏里的常见词。নাম 只有一个音节，末尾 ম 不带固有元音。', [['না', 'na'], ['ম', 'm', '词尾不加元音']]],
  ['nogor', 'নগর', 'nôgor', 'nɔɡoɾ', '城市；城镇', ['n', 'g', 'r', 'final-vowel'], '地名常见成分，对应地图上的 Nagar / Nogor。两个未写附标的元音并不相同：这里是 /ɔ/、/o/。', [['ন', 'nô'], ['গ', 'go'], ['র', 'r', '词尾无元音']]],
  ['gram', 'গ্রাম', 'gram', 'ɡɾam', '村庄；村落', ['gr', 'aa-sign', 'm', 'final-vowel'], '村名、地址和地名成分中常见 Gram。গ্র 是 /ɡɾ/，不是带两个固有元音的 gô-rô；末尾 ম 不再加元音。', [['গ্রা', 'gra'], ['ম', 'm']]],
  ['para', 'পাড়া', 'para', 'paɽa', '街区；居民区', ['p', 'flap', 'aa-sign'], '地名后缀常见 Para；这里取“居民区”义，不把同形动词的含义混入题目。ড় 的下点要辨认。', [['পা', 'pa'], ['ড়া', 'ra', '传统闪音；孟加拉国常与 r 合流']]],
  ['bajar', 'বাজার', 'bajar', 'badʒaɾ', '市场', ['b', 'j', 'r', 'aa-sign', 'final-vowel'], '店招和地名中极常见，地图常写 Bazar / Bazaar。这里采用塞擦音读法，部分说话人也读接近 /z/。', [['বা', 'ba'], ['জা', 'ja'], ['র', 'r']]],
  ['rasta', 'রাস্তা', 'rasta', 'ɾast̪a', '道路；街道', ['r', 'aa-sign', 'st-dental', 's-reading'], 'স্ত 是完整辅音群 /st̪/，স 在这里读 /s/。不是 ra-shô-ta 三个音节。', [['রা', 'ra'], ['স্তা', 'sta']]],
  ['sorok', 'সড়ক', 'shôrok', 'ʃɔɽok', '公路；道路', ['s', 'flap', 'k', 'final-vowel', 's-reading'], '道路名和公路标识常见。স 读 /ʃ/，ড় 后的固有元音在这里为 /o/，ক 是无元音词尾。', [['স', 'shô'], ['ড়', 'ro'], ['ক', 'k']]],
  ['path', 'পথ', 'pôth', 'pɔt̪ʰ', '路；路径', ['p', 'th', 'final-vowel'], '常见道路成分。থ 为齿音；宽式保留送气类别，实际词尾送气可弱化，不再加元音。', [['প', 'pô'], ['থ', 'th']]],
  ['setu', 'সেতু', 'shetu', 'ʃet̪u', '桥梁', ['s', 't', 'e-sign', 'u-sign', 's-reading'], '桥名常见 Setu。词条转写 śetu 支持此读法；本课使用 sh 标 /ʃ/，不是官方统一地图拼法。', [['সে', 'she'], ['তু', 'tu']]],
  ['nodi', 'নদী', 'nodi', 'nod̪i', '河流', ['n', 'd', 'ii-sign', 'inherent'], '河名和说明牌常见 Nadi / Nodi。采用 /nod̪i/，另有 /nɔd̪i/ 变体；末尾 ঈ-kar 不要求现代语必须拉长。', [['ন', 'no'], ['দী', 'di']]],
  ['school', 'স্কুল', 'skul', 'skul', '学校', ['sk', 'u-sign', 'l', 'final-vowel'], 'স্ক 是 /sk/，最后 ল 不加元音。口语还可有前加 i 的变体，本课不把所有读法混成一道唯一解。', [['স্কু', 'sku'], ['ল', 'l']]],
  ['college', 'কলেজ', 'kôlej', 'kɔledʒ', '学院；高等学校', ['k', 'l', 'j', 'e-sign', 'final-vowel'], '教育机构招牌常见；末尾 জ 保留辅音读音，不再读成 jô。', [['ক', 'kô'], ['লে', 'le'], ['জ', 'j']]],
  ['hospital', 'হাসপাতাল', 'hashpatal', 'haʃpat̪al', '医院', ['h', 's', 'p', 't', 'l', 'aa-sign', 'final-vowel', 's-reading'], '道路指示和机构招牌常见。স 后没有写 hasanta，但本词常见读音仍不额外插元音；不是按每个完整字母读成五个带元音音节。', [['হা', 'ha'], ['স', 'sh', '此处无元音'], ['পা', 'pa'], ['তা', 'ta'], ['ল', 'l']]],
  ['thana', 'থানা', 'thana', 't̪ʰana', '警署；警务区', ['th', 'n', 'aa-sign'], '警署招牌和地址成分。th 是送气齿塞音，不是英语的 th。', [['থা', 'tha'], ['না', 'na']]],
  ['jela', 'জেলা', 'jela', 'dʒela', '县级行政区；District', ['j', 'l', 'e-sign', 'aa-sign'], '孟加拉国行政区名称常带 জেলা；中文常译“县”，注意它与下一级 Upazila 不同。', [['জে', 'je'], ['লা', 'la']]],
  ['bibhag', 'বিভাগ', 'bibhag', 'bibʱaɡ', '专区；部门；Division', ['b', 'bh', 'g', 'i-sign', 'aa-sign', 'final-vowel'], '在行政地址中是 Division；在机构里也可指部门，不能见到它就断定是地名。ভ 采用传统气声读法，也有接近 /v/ 的实现。', [['বি', 'bi'], ['ভা', 'bha'], ['গ', 'g']]],
  ['uttor', 'উত্তর', 'uttôr', 'ut̪ːɔɾ', '北；北方', ['u', 'tt', 'r', 'final-vowel'], '方位词；还可表示“回答”，这里只练地址、地名中的北方义。ত্ত 是齿塞音延长，元音不因此加长。', [['উ', 'u'], ['ত্ত', 'ttô'], ['র', 'r']]],
  ['dokkhin', 'দক্ষিণ', 'dôkkhin', 'd̪ɔkʰːin', '南；南方', ['d', 'ksh', 'i-sign', 'retro-n', 'final-vowel'], '地图可能写 Dakshin / Dakkhin。本词的 ক্ষ 采用 /kʰː/，ণ 为 /n/；不能按 k+sh+卷舌鼻音拼出答案。', [['দ', 'dô'], ['ক্ষি', 'kkhi'], ['ণ', 'n']]],
  ['purbo', 'পূর্ব', 'purbo', 'puɾbo', '东；东方', ['p', 'uu-sign', 'rb', 'final-vowel'], '地图常写 Purba / Purbo。本词 র 先于 ব；词尾仍保留 /o/，所以“所有词尾删元音”在这里会出错。', [['পূ', 'pu'], ['র্ব', 'rbo', '末尾保留 /o/']]],
  ['poshchim', 'পশ্চিম', 'pôshchim', 'pɔʃtʃim', '西；西方', ['p', 'shch', 'i-sign', 'm', 'final-vowel'], 'Paschim / Pashchim 常见于地图名。শ্চ 作为整体读 /ʃtʃ/，不在合字中间插元音。', [['প', 'pô'], ['শ্চি', 'shchi'], ['ম', 'm']]],
  ['cha', 'চা', 'cha', 'tʃa', '茶', ['ch', 'aa-sign'], '茶摊、茶店招牌常见的一个音节词。চ 是不送气清塞擦音，不是英语 j。', [['চা', 'cha']]],
  ['dokan', 'দোকান', 'dokan', 'd̪okan', '商店', ['d', 'k', 'n', 'o-sign', 'aa-sign', 'final-vowel'], '店铺招牌常见；দো 的 o 附标围在 দ 两侧，是一个元音，不是两个。', [['দো', 'do'], ['কা', 'ka'], ['ন', 'n']]],
  ['hotel', 'হোটেল', 'hotel', 'hoʈel', '旅馆；餐馆', ['h', 'retro-t', 'l', 'o-sign', 'e-sign', 'final-vowel', 'loan'], '孟加拉语 হোটেল 既可指旅馆，也常指餐馆，不能只凭招牌判断有住宿。ট 的舌位与齿音 ত 不同。', [['হো', 'ho'], ['টে', 'te'], ['ল', 'l']]],
  ['bus', 'বাস', 'bas', 'bas', '公共汽车', ['b', 's', 'aa-sign', 's-reading', 'loan', 'final-vowel'], '交通语境中的英语借词“bus”，采用 /bas/。同形词“居住、气味”常读 /baʃ/，本条不混用该读音。', [['বা', 'ba'], ['স', 's', '借词的 /s/']]],
  ['rail', 'রেল', 'rel', 'ɾel', '铁路', ['r', 'l', 'e-sign', 'final-vowel'], '铁路相关标识常见的借词；র 的地区实现可以是闪音或近音，不是英语拼写的强制发音。', [['রে', 're'], ['ল', 'l']]],
  ['bangla', 'বাংলা', 'bangla', 'baŋla', '孟加拉语；孟加拉的', ['b', 'aa-sign', 'anusvara', 'l'], '招牌和语言标签中的常见词。ং 在这里是 /ŋ/，并非只让 /a/ 鼻化。文字本身也用于印度，不能当成唯一国家线索。', [['বাং', 'bang'], ['লা', 'la']]],
  ['bangladesh', 'বাংলাদেশ', 'bangladesh', 'baŋlad̪eʃ', '孟加拉国', ['word-bangla', 'd', 'e-sign', 'sh', 'final-vowel'], '国家名 Bangladesh；দেশ 是“国家、土地”成分。本词地图标整国，城市额外课另用红点，不把国家当作一个城市。', [['বাংলা', 'bangla'], ['দেশ', 'desh']]],
  ['mosque', 'মসজিদ', 'moshjid', 'moʃdʒid̪', '清真寺', ['m', 's', 'j', 'd', 'i-sign', 'final-vowel', 's-reading'], '宗教建筑招牌常见。此处采用 /moʃdʒid̪/，另有 /mosdʒid̪/ 变体；স 与 জ 之间不插入元音。', [['ম', 'mo'], ['স', 'sh'], ['জি', 'ji'], ['দ', 'd']]],
  ['temple', 'মন্দির', 'môndir', 'mɔnd̪iɾ', '寺庙', ['m', 'nd', 'i-sign', 'r', 'final-vowel'], '印度教寺庙和相关地址中的常见词。ন্দ 的 ন 与 দ 组成辅音群；最后 র 不带固有元音。', [['ম', 'mô'], ['ন্দি', 'ndi'], ['র', 'r']]],
].map(row => word(row as WordRow));
words.find(item => item.id === 'bn-word-bangladesh')!.place = { type: 'region', regionId: 'BD' };
words.find(item => item.id === 'bn-word-jela')!.sources.push('bn-government');
words.find(item => item.id === 'bn-word-bibhag')!.sources.push('bn-government');
for (const [id, names] of [
  ['nogor', ['Nagar', 'Nogor']], ['bajar', ['Bazar', 'Bazaar']], ['setu', ['Setu']],
  ['nodi', ['Nadi', 'Nodi']], ['dokkhin', ['Dakshin', 'Dakkhin']], ['purbo', ['Purba', 'Purbo']],
  ['poshchim', ['Paschim', 'Pashchim']],
] as [string, string[]][]) words.find(item => item.id === `bn-word-${id}`)!.conventionalNames = names;

type CityRow = [string, string, string, string, string, string[], [number, number], string[], [string, string, string?][], string];
const cities: CityRow[] = [
  ['dhaka', 'ঢাকা', 'dhaka', 'ɖʱaka', '达卡', ['Dhaka', 'Dacca'], [90.4125, 23.8103], ['retro-dh', 'k', 'aa-sign'], [['ঢা', 'dha'], ['কা', 'ka']], '首都；本卡红点表示城市。ঢ 的本地实现常比传统卷舌记音更靠前。'],
  ['chattogram', 'চট্টগ্রাম', 'chôttogram', 'tʃɔʈːoɡɾam', '吉大港', ['Chattogram', 'Chittagong'], [91.7832, 22.3569], ['ch', 'retro-tt', 'gr', 'aa-sign', 'm', 'final-vowel'], [['চ', 'chô'], ['ট্ট', 'tto'], ['গ্রা', 'gra'], ['ম', 'm']], '东南部港口城市；新旧英语名称可能同时出现。ট্ট 不是齿音 ত্ত。'],
  ['khulna', 'খুলনা', 'khulna', 'kʰulna', '库尔纳', ['Khulna'], [89.5403, 22.8456], ['kh', 'u-sign', 'l', 'n', 'aa-sign', 'final-vowel'], [['খু', 'khu'], ['ল', 'l'], ['না', 'na']], '西南部城市，与同名专区、县区分；这里的 ল 不再带元音。音值依据已核对的 khulna 转写与标准音值，仍待母语独立审读。'],
  ['rajshahi', 'রাজশাহী', 'rajshahi', 'ɾadʒʃahi', '拉杰沙希', ['Rajshahi'], [88.6042, 24.3745], ['r', 'aa-sign', 'j', 'sh', 'h', 'ii-sign', 'final-vowel'], [['রা', 'ra'], ['জ', 'j'], ['শা', 'sha'], ['হী', 'hi']], '西北部城市；জ 在 শ 前不另加元音。音值依据 rajśahi 转写和标准音值，未把字典无 IPA 的条目标成独立音标审校通过。'],
  ['barishal', 'বরিশাল', 'borishal', 'boɾiʃal', '巴里萨尔', ['Barishal', 'Barisal'], [90.3535, 22.7010], ['b', 'r', 'i-sign', 'sh', 'aa-sign', 'l', 'final-vowel'], [['ব', 'bo'], ['রি', 'ri'], ['শা', 'sha'], ['ল', 'l']], '南部河港城市；地图存在 Barisal / Barishal 拼法。音值依据 boriśal 词条转写与标准音值，待独立审读。'],
  ['sylhet', 'সিলেট', 'silet', 'sileʈ', '锡尔赫特', ['Sylhet', 'Silhet'], [91.8687, 24.8949], ['s', 'i-sign', 'l', 'e-sign', 'retro-t', 's-reading', 'final-vowel'], [['সি', 'si'], ['লে', 'le'], ['ট', 't']], '东北部城市；本课采用字典列出的 /s/ 变体，也有 /ʃ/。地图 Sylhet 的 y、h 不逐字对应原文。'],
  ['rangpur', 'রংপুর', 'rôngpur', 'ɾɔŋpuɾ', '朗布尔', ['Rangpur', 'Rongpur'], [89.2752, 25.7439], ['r', 'anusvara', 'p', 'u-sign', 'final-vowel'], [['রং', 'rông'], ['পু', 'pu'], ['র', 'r']], '北部城市；ং 是 /ŋ/，后面接 প，不应凭英语名的 ng 添一个 /ɡ/。'],
  ['mymensingh', 'ময়মনসিংহ', 'môymonshingho', 'mɔe̯monʃiŋho', '迈门辛', ['Mymensingh', 'Mymensing'], [90.4074, 24.7471], ['m', 'glide', 'n', 's', 'i-sign', 'anusvara', 'h', 's-reading', 'final-vowel'], [['ময়', 'môy', '/mɔe̯/'], ['ম', 'mo'], ['ন', 'n'], ['সিং', 'shing'], ['হ', 'ho', '有省去词末 ho 的变体']], '北中部城市；采用字典所列保留末尾 ho 的变体。য 与 য় 不要混淆，读音不能从 Mymensingh 逐字猜。'],
  ['cumilla', 'কুমিল্লা', 'kumilla', 'kumilːa', '库米拉', ['Cumilla', 'Comilla'], [91.1809, 23.4607], ['k', 'u-sign', 'm', 'i-sign', 'll', 'aa-sign'], [['কু', 'ku'], ['মি', 'mi'], ['ল্লা', 'lla']], '东部城市；ল্ল 是辅音延长。音值依据 kumilla 词条转写与标准音值，待独立审读。'],
  ['coxs-bazar', 'কক্সবাজার', 'kôksbajar', 'kɔksbadʒaɾ', '科克斯巴扎尔', ["Cox's Bazar", 'Coxs Bazar'], [91.9790, 21.4272], ['k', 's', 'b', 'j', 'r', 'aa-sign', 'hasanta', 's-reading', 'final-vowel'], [['ক', 'kô'], ['ক্স', 'ks'], ['বা', 'ba'], ['জা', 'ja'], ['র', 'r']], '东南海岸城市。ক্স 为 /ks/，不冒充 ক্ষ 的 /kʰː/；本课采用字典列出的 /kɔksbadʒaɾ/。'],
  ['jashore', 'যশোর', 'jôshor', 'dʒɔʃoɾ', '杰索尔', ['Jashore', 'Jessore'], [89.2167, 23.1667], ['y', 'sh', 'o-sign', 'r', 'final-vowel'], [['য', 'jô'], ['শো', 'sho'], ['র', 'r']], '西南部城市。词首 য 读 j，不按拉丁字母 y 发音；Jessore 是常见旧拼名。'],
  ['bogura', 'বগুড়া', 'bogura', 'boɡuɾa', '博格拉', ['Bogura', 'Bogra'], [89.3700, 24.8500], ['b', 'g', 'u-sign', 'flap', 'aa-sign', 'inherent'], [['ব', 'bo'], ['গু', 'gu'], ['ড়া', 'ra']], '西北内陆城市。采用词条中的 /ɾ/ 读法，体现孟加拉国常见的 rhotic 合流，不把 র 与 ড় 视为所有地区都严格对立。'],
];
const cityItems = cities.map(([id, glyph, roman, ipa, name, names, coordinates, requires, segments, explanation]) => ({
  ...word([id, glyph, roman, ipa, name, requires, explanation, segments]),
  extra: true, group: '孟加拉国城市', conventionalNames: names,
  sources: ['bn-lexicon', 'bn-government', 'bn-phonetics'],
  place: { type: 'city' as const, coordinates },
}));

const unit = (id: number, title: string, subtitle: string, names: string[], phase: string, note: string): Unit => ({
  id: `bengali-u${id}`, title, subtitle, items: ids(names), phase, note,
});
const units = [
  unit(1, '从 কা 到一个完整音节', '固有元音、附标与 ক · ন · ম', ['inherent', 'signs', 'k', 'n', 'm', 'aa-sign'], '01 · 字音起步', '先理解辅音卡只标辅音部分，实际文字可能带固有元音；不把字母名当成拼词读音。'),
  unit(2, '独立元音与历史拼写', 'অ · আ · ই · ঈ · উ · ঊ', ['a', 'aa', 'i', 'ii', 'u', 'uu'], '01 · 字音起步', '学习现代音值，不制造 ই/ঈ、উ/ঊ 的强制长短对立。ô /ɔ/ 可输入 aw，o 保持 /o/。'),
  unit(3, '舌根与上下附标', 'খ · গ · ঘ · ঙ · ি · ী', ['kh', 'g', 'gh', 'ng', 'i-sign', 'ii-sign'], '02 · 辅音与元音', '比较清浊和送气；前置 i 附标在声音中仍跟在辅音后。'),
  unit(4, '嘴唇与下方附标', 'প · ফ · ব · ভ · ু · ূ', ['p', 'ph', 'b', 'bh', 'u-sign', 'uu-sign'], '02 · 辅音与元音', '传统 ph、bh 与现代 f、v 实现有差别，单词中依实际读法说明。'),
  unit(5, '齿音与常用流音', 'ত · থ · দ · ধ · ল · র', ['t', 'th', 'd', 'dh', 'l', 'r'], '02 · 辅音与元音', 't、d 在本单元为齿音；后续与 ট、ড 对照，不能仅凭拉丁转写区分。'),
  unit(6, '塞擦音与相似拼写', 'চ · ছ · জ · ঝ · য · ঞ', ['ch', 'chh', 'j', 'jh', 'y', 'ny'], '02 · 辅音与元音', 'য 单独时常与 জ 合流。ঞ 多出现在合字里，后面按整体音值学习。'),
  unit(7, '后移舌位与下点', 'ট 系列 · ণ · ড় · ঢ় · য়', ['retro-t', 'retro-th', 'retro-d', 'retro-dh', 'retro-n', 'flap', 'flap-h', 'glide'], '02 · 辅音与元音', '保留传统宽式卷舌标记；孟加拉国标准音常更前，r 也有合流。字形区别仍然重要。'),
  unit(8, '两侧元音与擦音', 'এ · ও · ে · ো · স · শ · ষ · হ', ['e', 'o', 'e-sign', 'o-sign', 's', 'sh', 'ss', 'h'], '02 · 辅音与元音', 'কো 的两侧是一组元音附标。三种 s 类拼写常合流，也有依词变化。'),
  unit(9, '把规则放回词里', 'নগর 与 রাস্তা 的实际读法', ['final-vowel', 's-reading'], '03 · 读真实结构', '规则只核验一次；接下来由词汇反复检验固有元音、词尾和 s 的条件值，不刷同一道概念题。'),
  unit(10, '合字入口与鼻音符号', '্ · ৎ · ং · ঁ · ঃ', ['hasanta', 'khanda-t', 'nasal-signs', 'anusvara'], '03 · 读真实结构', '从 hasanta 理解合字。区分鼻辅音、元音鼻化与 visarga，不把它们当成同一个点。'),
  unit(11, '双元音与梵语来源结构', 'ঐ · ঔ · ঋ 及对应附标', ['ai', 'au', 'ai-sign', 'au-sign', 'ri', 'ri-sign'], '03 · 读真实结构', '现代 oi、ou 与文献 ai、au 区分；ঋ 通常读 ri，不要求模仿梵语音节性 r。'),
  unit(12, '在合字中找 র', 'ক্র · গ্র · প্র · ত্র · র্ব', ['kr', 'gr', 'pr', 'tr', 'rb'], '04 · 高频合字', '识别后位 র-ফলা 与前位 reph。整体字形和原始字母次序一起记。'),
  unit(13, '重叠辅音与鼻音群', 'ত্ত · ট্ট · ল্ল · ন্দ · ঙ্গ · ঞ্জ', ['tt', 'retro-tt', 'll', 'nd', 'ngg', 'nj'], '04 · 高频合字', '辅音延长不等于元音变长。区分 ং /ŋ/ 与 ঙ্গ /ŋɡ/。'),
  unit(14, '街景常见的复杂合字', 'স্ক · স্ট · স্ত · শ্চ · ক্ষ · জ্ঞ', ['sk', 'st', 'st-dental', 'shch', 'ksh', 'jny'], '04 · 高频合字', 'ক্ষ、জ্ঞ 的卡片限定常见词内值；词首值和例外单独解释。不会启用任意辅音替换组合器。'),
  unit(15, 'ফলা 与现代借词', 'ব্যা · হোটেল · বাস', ['phala', 'ae-sign', 'loan'], '04 · 高频合字', 'য-ফলা、ব-ফলা 有条件行为。明确旅馆/餐馆和公共汽车的真实语境。'),
  unit(16, '距离与门牌：零到四', '০ · ১ · ২ · ৩ · ৪', ['num-0', 'num-1', 'num-2', 'num-3', 'num-4'], '05 · 街景与地图', '只练数字字形与数值，适用于距离、门牌和招牌电话；不是数字词发音课。'),
  unit(17, '距离与门牌：五到九', '৫ · ৬ · ৭ · ৮ · ৯', ['num-5', 'num-6', 'num-7', 'num-8', 'num-9'], '05 · 街景与地图', '比较最易认错的数字，保持十进制位值。'),
  unit(18, '把读音对应到地图', '国家线索与地图惯用名', ['maps'], '05 · 街景与地图', '孟加拉文不是孟加拉国的独占线索；城市与同名行政区不能混为一个位置。补充词汇后即完成主线。'),
];
const extraGroups = [
  ['首都与东部港口', ['dhaka', 'chattogram', 'cumilla']],
  ['西南河港与海岸', ['khulna', 'barishal', 'coxs-bazar']],
  ['北部与西部城市', ['rajshahi', 'rangpur', 'bogura']],
  ['东北与内陆城市', ['sylhet', 'mymensingh', 'jashore']],
] as const;

export const bengaliCourse: Course = {
  id: 'bengali', type: 'script', title: '孟加拉语文字', nativeTitle: 'বাংলা',
  scriptName: '孟加拉文', scriptClass: 'bengali', direction: 'ltr', locale: 'bn',
  englishTitle: 'BANGLA SCRIPT', iconGlyph: 'ক', label: '孟加拉国与印度的文字线索',
  description: '从固有元音和元音附标，到常见合字、街景词与地图名称。认读孟加拉文，不把字母逐个替换成英语。',
  romanizationName: '读音转写',
  notationNote: '读音转写不是官方地图规范；ô /ɔ/ 可输入 aw。IPA 采用传统宽式，地区变体与条件读法逐条说明。',
  ipaNote: '传统宽式 IPA；不标常规重音，不虚构元音长短。孟加拉国的舌位、r 与鼻化可不同。',
  referenceNotes: [
    '本课针对通行书面孟加拉语的街景认读，覆盖现代常用辅音、独立元音及附标、17 个高频合字、十个数字、常用路牌词与孟加拉国城市。不是孟加拉国所有方言或印度所有地区的口语发音课，也不穷举梵语专用字母与全部合字。',
    '教学转写按实际读音组织：ô /ɔ/、o /o/、ch /tʃ/、chh /tʃʰ/、j /dʒ/、sh /ʃ/；t、d 等合并部分舌位区别，由 IPA 补足。ô 可输入 aw。它既不是 ALA-LC 逐字转写，也不冒充官方地名系统；Chattogram / Chittagong 等惯用名另列并接受输入。',
    'IPA 采用传统宽式 /ʈ ɖ tʃ dʒ ɾ ɽ/ 方便辨认书写系列。Khan 的孟加拉国标准语研究显示后部塞音更偏齿龈后、塞擦音可更靠前、r 常为 [ɹ]，鼻化对立也常弱化。词条有明确依据时单列变体，不能把一种地方读音当作所有地区唯一标准。',
    '辅音卡只标辅音部分，不朗读字母名称；固有元音 /ɔ~o/、元音脱落、合字和 ফলা 在实际词条中人工核对。不启用泰语式占位替换组合器。规则低频核验，主要通过单词练习。',
    '首版未提供本地孟加拉语真人录音。只对明确整词提供匹配 bn 的可选设备语音或在线收听，不朗读占位模板，不用英语声音替代。UT Austin 提供原站真人发音课程；词典没有独立 IPA 的四个城市与 সেতু，采用词条转写结合标准音值，审校状态在随项目研究表中明确记录。',
    '内容已做来源与程序结构核查，尚未获得母语者对全量 IPA 的独立审读，不宣称达到母语审定。地图只作位置示意；城市红点不表示整个同名行政区，国名则标整国。',
  ],
  pronunciationReference: 'bn-pronunciation',
  onlineListening: { label: '在线听孟加拉语', language: 'bn' },
  geography: { ...geography, projection: { ...geography.projection, translate: geography.projection.translate as [number, number] } },
  items: [...rules, ...consonants, ...vowels, ...clusters, ...numbers, ...words, ...cityItems],
  units,
  extraUnits: extraGroups.map(([title, names], index) => ({
    id: `bengali-extra-${index + 1}`, title, subtitle: '城市读音、地图惯用名与位置',
    phase: '额外 · 孟加拉国地名', items: names.map(name => `bn-word-${name}`),
    note: '主线完成后自动开放，也可确认风险后提前解锁。位置标城市，不标整个同名行政区；提前练习不会代替主线知识学习。',
  })),
  sources: sources.filter(source => source.id.startsWith('bn-') || ['fsrs', 'duo-writing'].includes(source.id)),
};
