import type { Course, Knowledge, Unit } from '../types';
import { sources } from './sources';
import geography from './hebrew-map.json' with { type: 'json' };

const refs = ['he-ungegn', 'he-unicode', 'he-phonology'];
const pre = (...ids: string[]) => ids.map(id => `he-${id}`);
const rule = (id: string, glyph: string, title: string, explanation: string, prompt: string,
  answer: string, choices: string[], requires: string[] = []): Knowledge => ({
  id: `he-${id}`, courseId: 'hebrew', kind: 'rule', glyph, roman: '', ipa: '', title,
  explanation, group: '书写与读法', sources: refs, requires: pre(...requires),
  rulePrompt: prompt, ruleAnswer: answer, ruleChoices: choices,
});
const rules: Knowledge[] = [
  rule('rtl', 'עברית · 90', '文字从右向左，数字不倒读',
    '本课是现代以色列希伯来语，不是圣经希伯来语或意第绪语。希伯来字母从右向左排列，通常不连写；一串阿拉伯数字仍按原位值从左向右读，90 不变成 09。中文界面和拉丁转写不随文字一起翻转。',
    '路牌里的数字 90 应如何识别？', '仍是九十，不倒转数字', ['变成 09', '每个字母都要连写', '整页中文也从右向左读']),
  rule('unpointed', 'בּ · בֿ → ב', '没有元音点，不能唯一还原读音',
    '普通路牌、地址和招牌大多不写 niqqud 元音点。ב、כ、פ 在无点文本中分别可能对应 b/v、k/kh、p/f；ש 的 sh/s 区别也可能不标。ו、י 既可作辅音，也可参与元音拼写。字母课用带点或明确的教学标记区分，词汇课使用真实无点词形，并人工给出整词转写与 IPA。不能只靠一个字形机械解码未知词。',
    '无点路牌中单独看到 ב，能否断定一定读 v？', '不能，要结合完整词及语境', ['一定读 v', '一定读 b', '一定是元音 a'], ['rtl']),
  rule('rafe', 'בּ / בֿ · כּ / כֿ · פּ / פֿ', '区分塞音与擦音的教学标记',
    '字母中的 dagesh 圆点在 בּ、כּ、פּ 中对应 b、k、p。本课为了避免把普通无点字母误考成唯一读法，给擦音形式加罕用的 rafe 横线：בֿ v、כֿ kh、פֿ f。rafe 是真实的希伯来附标，但不是现代路牌的常规写法；在无点词里仍需认完整词。其他字母的 dagesh 还可保留历史重叠，本课现代 IPA 不虚构双辅音长度。',
    '本课 בֿ 上方横线表示什么？', '明确本卡练擦音 v，不是常规路牌必写符号', ['元音一定变长', '现代路牌所有 ב 都有横线', '数字 2'], ['unpointed']),
  rule('finals', 'כ ך · מ ם · נ ן · פ ף · צ ץ', '五个词尾字形',
    'כ、מ、נ、פ、צ 在词尾通常写 ך、ם、ן、ף、ץ。它们不是五个新增字母，也不因此添加元音。ך 与 ף 的卡片取现代常见 kh、f 读法；少见带 dagesh 的词尾塞音、外来词和缩略词须按整词核对，不把词尾形当作绝无例外的发音规则。',
    'ם 与 מ 是什么关系？', '同一个字母的词尾形与普通形', ['两个不同元音', 'ם 必定另加一个元音', 'ם 是数字零'], ['kh', 'm', 'n', 'f', 'ts']),
  rule('niqqud', 'בַ · בֶ · בִ · בֹ · בֻ', '五类现代元音，多种点法',
    '现代通用语的核心元音可宽记 /a e i o u/。不同元音点保留历史拼写区别，并不要求现代长短音对立；本课不教圣经吟诵。◌ 是附标载体，不是实际词里的字母。先在明确标点的结构里学音值，再回到无点整词，不能把缺少元音点解释为没有元音。',
    '现代语中两个不同的元音点，是否一定代表长短音对立？', '不一定，历史拼写区别不等于现代长短对立', ['一定，每个点都有长短对立', '没写元音点就没有元音', '所有点都表示重音'], ['unpointed', 'v', 'y']),
  rule('sheva', '◌ְ · שְׁ · בְּ', 'sheva 不总是一个 e',
    'ְ 是 sheva，现代词中可能不产生元音，也可能对应 /e/；历史的动静分类不等于现代每词实际读法。שְׁ 在 שְׁדֵרוֹת 中形成开头 /ʃd/；בְּאֵר 中则有 /e/。本课不为 sheva 编造单一独立音值，不用通用占位组合器推导整词。',
    '看到 sheva ְ，可以一律在后面加 e 吗？', '不可以，要核对具体词', ['可以，永远读 e', '它一定读 u', '它是辅音重叠号'], ['niqqud']),
  rule('furtive', 'רוּחַ → ruaẖ', '词尾 patah 有时先读',
    '某些词尾喉音下的 patah /a/ 在该辅音之前读，称 furtive patah，如 רוּחַ 的末尾是 /aχ/，不是 /χa/。这不表示希伯来语附标一律先读；其他结构仍按词核对。本课只教授识别与实际词，不扩展为任意字母生成。',
    'רוּחַ 的词尾 חַ 在这个结构里按什么顺序读？', '/a/ 在 /χ/ 前', ['/χ/ 在 /a/ 前', '只读 /u/', '没有辅音'], ['het', 'patah', 'shuruq']),
  rule('punctuation', 'ג׳ · רח׳ · ב״ש', 'geresh、缩写和双撇号',
    'geresh ׳ 与 gershayim ״ 是希伯来标点，不是元音点。ג׳、ז׳、צ׳ 可标外来辅音；词尾单撇号也可标缩写，如 רח׳ 常是 רחוב（街）的缩写。双撇号常出现在缩略词末字母之前，如 ב״ש 可指 באר שבע。缩写和字母数值需看语境，不能把每个撇号都读成喉塞音。',
    'רח׳ 在地址中通常是什么？', 'רחוב（街）的缩写', ['必定读一个新的外来辅音', '元音 u 的写法', '公路编号 90'], ['unpointed']),
  rule('numbers', 'כביש 90 · א׳ · ט״ו', '街景数字与字母数值分开',
    '现代距离、道路编号、门牌和电话常用 0–9，不存在另一套需要倒读的希伯来十进制数字字形。字母另可表示数值，如 א׳ 为 1、ט״ו 为 15，用于日期、序号等；这是按字母数值相加的另一种记法，不是十进制位值。本课只辨别场景，不要求掌握完整希伯来历或数值系统。',
    'כביש 90 中的 90 是什么？', '普通十进制公路编号', ['把字母数值相加得到的写法', '必须反读成 09', '希伯来语元音点'], ['punctuation']),
  rule('maps', 'חיפה · Haifa · ẖefa', '规范转写、实际读音、地图名分栏',
    '本课采用联合国 2007 年推荐的希伯来语 UNGEGN 转写，规范以色列地名来源；不是圣经研究常用的 SBL 或图书编目 ALA-LC。规范字母转写、现代语音与地图惯用名可能不同，如 חיפה 的规范 ẖefa 和地图 Haifa。额外地名保留地图拼法供检索，不把标准方案冒充所有路牌统一采用的拼名。看到希伯来文也不能推出同牌没有阿拉伯文或英文。',
    '地图 Haifa 与本课规范 ẖefa 不同，应该怎样处理？', '分别保留地图名与规范转写，不据英语猜读音', ['删掉地图名，只承认一种写法', '把英语拼法当 IPA', '认定它们是两个城市'], ['numbers']),
];

type LetterRow = [string, string, string, string, string, string[]?];
const letterRows: LetterRow[] = [
  ['m', 'מ', 'm', 'm', 'mem。普通形 מ，词尾另有 ם；辅音卡不自动添元音。'],
  ['n', 'נ', 'n', 'n', 'nun。与 ג 的短笔画比较；词尾形是 ן。'],
  ['l', 'ל', 'l', 'l', 'lamed。明显高出字身的上伸笔画；不是拉丁字母 l。'],
  ['r', 'ר', 'r', 'ʁ', 'resh。本课采用现代常见小舌 r 的宽式 /ʁ/；也有颤音、闪音等说话人变体，不把英语 r 当唯一值。'],
  ['b', 'בּ', 'b', 'b', 'bet，内部圆点明确本卡的塞音 /b/；普通无点 ב 不能独立决定 b 或 v。', ['rafe']],
  ['vet', 'בֿ', 'v', 'v', 'vet。rafe 横线只是本课明确擦音 /v/ 的教学用法；普通路牌通常写 ב，需认整词。', ['rafe']],
  ['k', 'כּ', 'k', 'k', '带 dagesh 的 kaf，塞音 /k/；同音的 ק 是另一个字母。', ['rafe']],
  ['kh', 'כֿ', 'kh', 'χ', '无 dagesh 的 kaf 常见擦音，本课加 rafe 明确此读法。UNGEGN kh 与 ח 的 ẖ 保留拼写区别，现代常同音。', ['rafe']],
  ['p', 'פּ', 'p', 'p', '带 dagesh 的 pe，塞音 /p/；无点 פ 也可能读 f。', ['rafe']],
  ['f', 'פֿ', 'f', 'f', 'fe 的擦音读法。本卡加 rafe 避免无点题的歧义，普通路牌中这个横线通常不写。', ['rafe']],
  ['alef', 'א', "'", 'ʔ', 'alef。表中用撇号保留喉塞音对应；现代语常弱化或不发音。UNGEGN 在词首、词尾省略 alef 的撇号，不代表所有位置都必读 /ʔ/。'],
  ['ayin', 'ע', "'", 'ʔ', 'ayin。本课取许多现代说话人与 א 合流的 /ʔ/；部分传统或地区读法保留 /ʕ/。不能把这些读法或意第绪语的字母值混为一谈。词首词尾转写省略撇号。'],
  ['h', 'ה', 'h', 'h', 'he，辅音值 /h/；词尾也可不发音、参与元音拼写。带 mappiq 的 הּ、词内弱化等需要结合实际词，不把 h 套入每个词尾 ה。'],
  ['het', 'ח', 'ẖ', 'χ', 'het。UNGEGN 用带下横线的 ẖ；普通键盘 h 可输入。现代常与 כ 的擦音合流为 /χ/，部分说话人保留 /ħ/。'],
  ['sh', 'שׁ', 'sh', 'ʃ', 'shin，右上点明确 /ʃ/。无点 ש 还可能对应 sin /s/。'],
  ['sin', 'שׂ', 's', 's', 'sin，左上点对应 /s/；与 ס 同音，但字形和词源拼写不同。'],
  ['s', 'ס', 's', 's', 'samekh，常见 /s/。与词尾形 ם 对照：ס 更圆，ם 往往更方。'],
  ['ts', 'צ', 'ts', 'ts', 'tsadi，一个塞擦音，宽式简记 /ts/。规范写 ts，不另造 tz 作为主转写；地图名可能用 tz。'],
  ['t', 'ט', 't', 't', 'tet。现代常与 ת 同音 /t/，不是英语 th；拼写仍须区分。'],
  ['tav', 'ת', 't', 't', 'tav。现代通用语 /t/，不把历史或其他语言的 /θ/ 当成本课默认读法。'],
  ['g', 'ג', 'g', 'ɡ', 'gimel，/ɡ/。与 נ 比较底部和伸出的短笔画；外来 ג׳ 是另外的组合。'],
  ['d', 'ד', 'd', 'd', 'dalet，/d/。与 ר 比较右上角：ד 常更有棱角，但具体字体仍会变化。'],
  ['z', 'ז', 'z', 'z', 'zayin，/z/。与 ו 对照顶部笔画，不能只凭竖线判断。'],
  ['v', 'ו', 'v', 'v', 'vav 的辅音值 /v/；与擦音 ב 同音。在 וֹ、וּ 或无点词中也可参与元音拼写，不是一律发 /v/。'],
  ['y', 'י', 'y', 'j', 'yod 的辅音值 /j/，如英语 yes 的起始音；也可参与元音拼写，不能一见 י 就插入辅音。'],
  ['qof', 'ק', 'k', 'k', 'qof。所选 UNGEGN 2007 用 k，不用其他方案的 q；现代与 כּ 常同音 /k/。'],
];
const letters = letterRows.map<Knowledge>(([id, glyph, roman, ipa, explanation, requires = []]) => ({
  id: `he-${id}`, courseId: 'hebrew', kind: 'consonant', glyph, roman, ipa,
  title: `${glyph} · 辅音读法`, group: '辅音与字形', explanation,
  requires: pre('unpointed', ...requires), sources: refs,
}));
const finals: Knowledge[] = ([
  ['final-kh', 'ך', 'kh', 'χ', 'kh', 'כ 的词尾形，本卡取常见擦音 /χ/，不是因为变形就新增元音。'],
  ['final-m', 'ם', 'm', 'm', 'm', 'מ 的词尾形；与 ס 区分。שלם、דרום 等词尾可见，不能当作数字零。'],
  ['final-n', 'ן', 'n', 'n', 'n', 'נ 的词尾形，通常向下伸长；与较短的 ו 对照。'],
  ['final-f', 'ף', 'f', 'f', 'f', 'פ 的词尾形，本卡取常见 /f/；在 חוף（海滩）里练习。'],
  ['final-ts', 'ץ', 'ts', 'ts', 'ts', 'צ 的词尾形；קיבוץ 的末尾，不另加元音。'],
] as string[][]).map(([id, glyph, roman, ipa, base, explanation]) => ({
  id: `he-${id}`, courseId: 'hebrew', kind: 'consonant', glyph, roman, ipa,
  title: `${glyph} · 词尾形`, group: '五个词尾形', explanation,
  requires: pre('finals', base), sources: refs,
}));

type VowelRow = [string, string, string, string, string];
const vowels: Knowledge[] = ([
  ['patah', '◌ַ', 'a', 'a', 'patah，基字下方横线；通常对应 /a/，词尾喉音下的特殊先后顺序另学。'],
  ['qamats', '◌ָ', 'a', 'a', 'qamats，本卡教常见 /a/。传统同形点在部分词中是 qamats qatan /o/，不能只凭形状保证 /a/。'],
  ['tsere', '◌ֵ', 'e', 'e', 'tsere，下方横排两点。本课现代宽式 /e/，不要求历史长音。'],
  ['segol', '◌ֶ', 'e', 'e', 'segol，下方三点成三角。现代常与 tsere 同为 /e/，保留两种拼写。'],
  ['hiriq', '◌ִ', 'i', 'i', 'hiriq，下方单点；与字母内部的 dagesh 区分，后接 י 时也可表示 /i/。'],
  ['holam', '◌ֹ', 'o', 'o', 'holam haser，上方的元音点；不要与 שׁ 的字母识别点混淆。'],
  ['holam-vav', 'וֹ', 'o', 'o', 'holam male，ו 参与 o 的拼写，本结构不先读 /v/。无点 ו 仍需要词汇语境。'],
  ['shuruq', 'וּ', 'u', 'u', 'shuruq，ו 中间的点标 /u/。这个完整结构不读 /v/ 加一个元音。'],
  ['qubuts', '◌ֻ', 'u', 'u', 'qubuts，下方斜列三点，现代常与 shuruq 同为 /u/；不是 segol 的三角形。'],
  ['qamats-qatan', '◌ׇ', 'o', 'o', 'qamats qatan，Unicode 可用专门符号区别；传统印刷经常与普通 qamats 同形，实际仍要看词。现代读 /o/，不是另一个长 a。'],
  ['hataf-patah', '◌ֲ', 'a', 'a', 'hataf patah，sheva 两点与 patah 的组合。历史“减缩”不要求现代读出另一套元音长短。'],
  ['hataf-segol', '◌ֱ', 'e', 'e', 'hataf segol，sheva 与 segol 的组合；本课现代宽式为 /e/，不把两部分逐个发音。'],
  ['hataf-qamats', '◌ֳ', 'o', 'o', 'hataf qamats，组合附标，本课现代宽式 /o/。它与 qamats 的常见 /a/ 区分。'],
] satisfies VowelRow[]).map(([id, glyph, roman, ipa, explanation]) => ({
  id: `he-${id}`, courseId: 'hebrew', kind: 'vowel', glyph, roman, ipa,
  title: `${glyph} · 元音结构`, group: '元音点与拼写', explanation,
  requires: pre('niqqud'), sources: refs,
}));
const foreign: Knowledge[] = ([
  ['foreign-j', 'ג׳', 'j', 'dʒ', 'ג 加 geresh，用于外来 /dʒ/；不是普通 ג 的 /ɡ/。', 'g'],
  ['foreign-zh', 'ז׳', 'zh', 'ʒ', 'ז 加 geresh，用于外来 /ʒ/；不能把单撇号当成元音点。', 'z'],
  ['foreign-ch', 'צ׳', 'ch', 'tʃ', 'צ 加 geresh，用于外来 /tʃ/，与普通 צ /ts/ 区分。', 'ts'],
] as string[][]).map(([id, glyph, roman, ipa, explanation, base]) => ({
  id: `he-${id}`, courseId: 'hebrew', kind: 'consonant', glyph, roman, ipa,
  title: `${glyph} · 外来辅音`, group: '外来音与标点', explanation,
  requires: pre('punctuation', base), sources: refs,
}));

// Full words are authored, not decoded from unpointed letters.
type WordRow = [string, string, string, string, string, string, string[], string[]?];
const wordRows: WordRow[] = [
  ['street', 'רחוב', 'רְחוֹב', 'reẖov', 'ʁeˈχov', '街；街道', ['r', 'het', 'v', 'vet', 'sheva', 'holam-vav'], ['rehov', 'rechov']],
  ['road', 'דרך', 'דֶּרֶךְ', 'derekh', 'ˈdeʁeχ', '路；道路', ['d', 'r', 'final-kh', 'segol', 'sheva']],
  ['highway', 'כביש', 'כְּבִישׁ', 'kvish', 'ˈkviʃ', '公路', ['k', 'vet', 'y', 'sh', 'sheva', 'hiriq']],
  ['bridge', 'גשר', 'גֶּשֶׁר', 'gesher', 'ˈɡeʃeʁ', '桥', ['g', 'sh', 'r', 'segol']],
  ['junction', 'צומת', 'צֹמֶת', 'tsomet', 'ˈtsomet', '交叉口；路口', ['ts', 'v', 'm', 'tav', 'holam', 'segol'], ['tzomet']],
  ['avenues', 'שדרות', 'שְׂדֵרוֹת', 'sderot', 'sdeˈʁot', '林荫道（复数）', ['sin', 'd', 'r', 'v', 'tav', 'sheva', 'tsere', 'holam-vav']],
  ['station', 'תחנה', 'תַּחֲנָה', 'taẖana', 'taχaˈna', '车站；站', ['tav', 'het', 'n', 'h', 'patah', 'hataf-patah', 'qamats'], ['tahana', 'tachana']],
  ['railway', 'רכבת', 'רַכֶּבֶת', 'rakkevet', 'ʁaˈkevet', '火车；铁路', ['r', 'k', 'vet', 'tav', 'patah', 'segol'], ['rakevet']],
  ['entrance', 'כניסה', 'כְּנִיסָה', 'knisa', 'kniˈsa', '入口', ['k', 'n', 'y', 's', 'h', 'sheva', 'hiriq', 'qamats']],
  ['exit', 'יציאה', 'יְצִיאָה', "yetsi'a", 'jetsiˈʔa', '出口', ['y', 'ts', 'alef', 'h', 'sheva', 'hiriq', 'qamats'], ['yetzia']],
  ['center', 'מרכז', 'מֶרְכָּז', 'merkaz', 'meʁˈkaz', '中心', ['m', 'r', 'k', 'z', 'segol', 'sheva', 'qamats']],
  ['market', 'שוק', 'שׁוּק', 'shuk', 'ˈʃuk', '市场', ['sh', 'v', 'qof', 'shuruq']],
  ['beach', 'חוף', 'חוֹף', 'ẖof', 'ˈχof', '海滩；海岸', ['het', 'v', 'final-f', 'holam-vav'], ['chof', 'khof']],
  ['port', 'נמל', 'נָמֵל', 'namel', 'naˈmel', '港口', ['n', 'm', 'l', 'qamats', 'tsere'], ['namal']],
  ['north', 'צפון', 'צָפוֹן', 'tsafon', 'tsaˈfon', '北', ['ts', 'f', 'v', 'final-n', 'qamats', 'holam-vav'], ['tzafon']],
  ['south', 'דרום', 'דָּרוֹם', 'darom', 'daˈʁom', '南', ['d', 'r', 'v', 'final-m', 'qamats', 'holam-vav']],
  ['east', 'מזרח', 'מִזְרָח', 'mizraẖ', 'mizˈʁaχ', '东', ['m', 'z', 'r', 'het', 'hiriq', 'sheva', 'qamats'], ['mizrach']],
  ['west', 'מערב', 'מַעֲרָב', "ma'arav", 'maʔaˈʁav', '西', ['m', 'ayin', 'r', 'vet', 'patah', 'hataf-patah', 'qamats']],
  ['city', 'עיר', 'עִיר', 'ir', 'ˈiʁ', '城市', ['ayin', 'y', 'r', 'hiriq']],
  ['house', 'בית', 'בַּיִת', 'bayit', 'ˈbajit', '房屋；家', ['b', 'y', 'tav', 'patah', 'hiriq']],
  ['moshav', 'מושב', 'מוֹשָׁב', 'moshav', 'moˈʃav', '莫沙夫；一种乡村聚落', ['m', 'v', 'sh', 'vet', 'holam-vav', 'qamats']],
  ['kibbutz', 'קיבוץ', 'קִבּוּץ', 'kibbuts', 'kiˈbuts', '基布兹；一种集体聚落', ['qof', 'y', 'b', 'v', 'final-ts', 'hiriq', 'shuruq'], ['kibbutz', 'kibuts']],
  ['garden', 'גן', 'גַּן', 'gan', 'ˈɡan', '花园；园', ['g', 'final-n', 'patah']],
  ['israel', 'ישראל', 'יִשְׂרָאֵל', "yisra'el", 'jisʁaˈʔel', '以色列', ['y', 'sin', 'r', 'alef', 'l', 'hiriq', 'sheva', 'qamats', 'tsere'], ['Israel']],
];
const lexical = ([id, glyph, pointed, roman, ipa, meaning, requires, aliases]: WordRow): Knowledge => ({
  id: `he-word-${id}`, courseId: 'hebrew', kind: 'word', glyph, roman, ipa,
  title: meaning, meaning, aliases, group: '街景与地址词',
  requires: pre('unpointed', 'rafe', 'maps', ...requires),
  sources: ['he-ungegn', 'he-lexicon', 'he-phonology'],
  explanation: `有点形式 ${pointed} 用于核对读法；练习采用常见无点词形。UNGEGN 保留规范拼写，现代宽式 IPA 不标历史元音长短或辅音重叠；ʔ、h、r 等有说话人变体。词义限本卡街景语境，不穷举同形词。尚待母语者独立审读。`,
  context: `${pointed} · ${meaning}。无点词不能靠逐字替换唯一恢复读音。`,
  pronunciation: { speech: { text: pointed, label: `有点整词：${pointed}`, lang: 'he' } },
});
const words = wordRows.map(lexical);
words.find(item => item.id === 'he-word-avenues')!.explanation += ' 此词用左上点 sin；不要把它与无点时的同形城市名 שְׁדֵרוֹת（Sderot，开头 /ʃd/）混同。';
words.find(item => item.id === 'he-word-house')!.explanation += ' 地名中常见连属形式 בֵּית（bet），如 בית שמש；本卡独立形式 bayit 不能替代所有词形。';
words.find(item => item.id === 'he-word-port')!.explanation += ' 本卡取规范式 נָמֵל namel；常见口语 נָמָל /naˈmal/ 也指港口，输入接受 namal，不把这两种元音形式混称同一规范式。';

type CityRow = [string, string, string, string, string, string, string[], [number, number], string[], string?];
const cityRows: CityRow[] = [
  ['jerusalem', 'ירושלים', 'יְרוּשָׁלַיִם', 'Yerushalayim', 'jeʁuʃaˈlajim', '耶路撒冷', ['Jerusalem', 'Yerushalayim'], [35.2137, 31.7683], ['y', 'r', 'v', 'sh', 'l', 'final-m', 'sheva', 'shuruq', 'qamats', 'patah', 'hiriq']],
  ['tel-aviv', 'תל אביב', 'תֵּל אָבִיב', 'Tel Aviv', 'tel aˈviv', '特拉维夫', ['Tel Aviv', 'Tel-Aviv'], [34.7818, 32.0853], ['tav', 'l', 'alef', 'vet', 'y', 'tsere', 'qamats', 'hiriq']],
  ['haifa', 'חיפה', 'חֵיפָה', 'ẖefa', 'ˈχajfa', '海法', ['Haifa', 'Hefa'], [34.9896, 32.794], ['het', 'y', 'f', 'h', 'tsere', 'qamats'], '规范 ẖefa 依有点地名，IPA 取词典列出的 /ˈχajfa/ 变体；另列有 /χejˈfa/，不从地图 Haifa 反推唯一元音。'],
  ['beer-sheva', 'באר שבע', 'בְּאֵר שֶׁבַע', "Be'er Sheva", 'ˌbeʔeʁ ˈʃeva', '贝尔谢巴', ["Be'er Sheva", 'Beer Sheva', 'Beersheba'], [34.7913, 31.252], ['b', 'alef', 'r', 'sh', 'vet', 'ayin', 'sheva', 'tsere', 'segol', 'patah']],
  ['eilat', 'אילת', 'אֵילַת', 'Elat', 'eˈlat', '埃拉特', ['Eilat', 'Elat'], [34.9519, 29.5577], ['alef', 'y', 'l', 'tav', 'tsere', 'patah']],
  ['ashdod', 'אשדוד', 'אַשְׁדּוֹד', 'Ashdod', 'aʃˈdod', '阿什杜德', ['Ashdod'], [34.6553, 31.8044], ['alef', 'sh', 'd', 'v', 'patah', 'sheva', 'holam-vav']],
  ['ashkelon', 'אשקלון', 'אַשְׁקְלוֹן', 'Ashkelon', 'aʃkeˈlon', '阿什凯隆', ['Ashkelon', 'Ashqelon'], [34.5715, 31.6688], ['alef', 'sh', 'qof', 'l', 'v', 'final-n', 'patah', 'sheva', 'holam-vav']],
  ['netanya', 'נתניה', 'נְתַנְיָה', 'Netanya', 'netanˈja', '内坦亚', ['Netanya', 'Natanya'], [34.8555, 32.3215], ['n', 'tav', 'y', 'h', 'sheva', 'patah', 'qamats'], '本卡取词典列出的 /netanˈja/；词典另列 /naˈtanja/ 口语变体，不能把一种重音说成唯一读法。'],
  ['akko', 'עכו', 'עַכּוֹ', 'Akko', 'ˈako', '阿卡', ['Akko', 'Acre', 'Acco'], [35.0827, 32.9281], ['ayin', 'k', 'v', 'patah', 'holam-vav']],
  ['nazareth', 'נצרת', 'נָצְרַת', 'Natsrat', 'natsˈʁat', '拿撒勒', ['Nazareth', 'Natsrat', 'Natzeret'], [35.3035, 32.6996], ['n', 'ts', 'r', 'tav', 'qamats', 'sheva', 'patah'], '采用 Natsrat /natsˈʁat/，也有 Natseret 变体；不把英语 Nazareth 的发音套给希伯来语。'],
];
const cities: Knowledge[] = cityRows.map(([id, glyph, pointed, roman, ipa, meaning, names, coordinates, requires, note]) => ({
  ...lexical([id, glyph, pointed, roman, ipa, meaning, requires]),
  extra: true, group: '城市与地图名', conventionalNames: names,
  sources: ['he-ungegn', 'he-places', 'he-lexicon', 'he-phonology'],
  place: { type: 'city', coordinates },
  explanation: `${note || '规范转写、地图惯用名和现代读音分别保留。'} 有点地名 ${pointed} 作为核对依据。IPA 为人工整理的宽式记音，尚待母语者独立审读。红点只标近似市区位置，不表示行政范围、边界或主权立场。`,
}));

const unit = (id: number, title: string, names: string[], phase: string, note: string): Unit => ({
  id: `hebrew-u${id}`, title, subtitle: '现代希伯来语 · 含单元综合复习',
  items: pre(...names), phase, note,
});
export const hebrewCourse: Course = {
  id: 'hebrew', type: 'script', title: '希伯来语文字', nativeTitle: 'עברית',
  scriptName: '希伯来文', scriptClass: 'hebrew', direction: 'rtl', locale: 'he',
  englishTitle: 'HEBREW SCRIPT', iconGlyph: 'א', label: '从无点词形到街道与城市',
  description: '认识 22 个字母、五个词尾形、常用元音点与无点街景词，分别对应规范转写、实际读音和地图名称。',
  romanizationName: 'UNGEGN 2007', romanizationSource: 'he-ungegn',
  notationNote: 'UNGEGN 2007 + 现代宽式 IPA；不是圣经转写。地图惯用拼法另列，普通键盘输入可省附加符号。',
  ipaNote: '现代通用语宽式 IPA，标主要重音；不标历史长短与重叠。r 取 /ʁ/；喉音弱化与地区变体另述，待独立审读。',
  pronunciationReference: 'he-pronunciation',
  onlineListening: { label: '在线听希伯来语', language: 'he' },
  referenceNotes: [
    '范围是现代以色列希伯来语的街景认读，不是圣经吟诵、意第绪语或完整会话课。22 个基本字母含不同读法的明确标记；五个词尾形不是五个新字母。字体仅提供印刷体，不假装已经教授手写体。',
    '采用联合国 2007 年推荐的方案：ח ẖ、כ kh、צ ts、ק k、שׁ sh；历史重叠按规范保留，如 rakkevet、kibbuts，但现代 IPA 不读出虚构的长辅音。א/ע 的撇号在词首词尾依规范省略，词中的静音字母另按整词核对。',
    '普通无点文本的 ב/כ/פ/ש/ו/י 不唯一决定发音。软音字母卡用真实但罕用的 rafe 横线明确教学读法，普通词汇不添加这些标记；不会把无点 ב 单独出题并断言只能读 v。元音点保留历史区别，现代音系以 /a e i o u/ 为核心。',
    '只做人工编写的字母、附标和整词练习，不启用任意辅音加元音的生成器；sheva、qamats qatan、词尾喉音与缺省元音都不能靠简单字符替换可靠推导。',
    '主线有 24 个街景、地址及地名成分词；额外课为 10 个城市，含地图惯用名与本地位置示意。无点地名及路牌拉丁名参考以色列交通部 2025 年 5 月方向标志地名表；有点形式逐词查词典，规范转写另依 UNGEGN。人工整理的 IPA 尚待母语者全量独立审读，程序通过不等于语言审定。',
    '尚无本站收录的希伯来语真人录音。仅明确的有点整词可使用匹配 he 的设备语音或在线收听；不自动朗读孤立字母、附标或 IPA，也不以英语语音替代。',
    '地图来自 Natural Earth v5.1.2 公有领域数据，只作位置示意；数据集边线不表达对争议地区边界或主权的立场。希伯来语名不取代同地的其他语言名称。',
  ],
  geography: { ...geography, projection: { ...geography.projection, translate: geography.projection.translate as [number, number] } },
  items: [...rules, ...letters, ...finals, ...vowels, ...foreign, ...words, ...cities],
  units: [
    unit(1, '从右向左，先认完整文字', ['rtl', 'unpointed', 'm', 'n', 'l', 'r'], '01 · 字形起步', '先接受无点词不唯一决定读音，再学四个常用字母；不把字母名当作词内辅音。'),
    unit(2, '三对塞音与擦音', ['rafe', 'b', 'vet', 'k', 'kh', 'p', 'f'], '01 · 字形起步', '用明确标记区分 b/v、k/kh、p/f；rafe 是教学辨别符，不是现代路牌的常规写法。'),
    unit(3, '喉音与静音字母', ['alef', 'ayin', 'h', 'het'], '02 · 字母对照', '同一个字母在实际词中可能弱化或不发音，所选现代读法不覆盖所有口音。'),
    unit(4, '嘶音与同音异形', ['sh', 'sin', 's', 'ts', 't', 'tav'], '02 · 字母对照', 'ש 的左右点、ס 与 ם、ט 与 ת；同音异形仍须记住拼写。'),
    unit(5, '易混字与元音载体', ['g', 'd', 'z', 'v', 'y', 'qof'], '02 · 字母对照', 'ד/ר、ז/ו、י/ו 的视觉差异；ו 与 י 不是始终发辅音。'),
    unit(6, '把词尾的五个形状认出来', ['finals', 'final-kh', 'final-m', 'final-n', 'final-f', 'final-ts'], '03 · 词尾与元音', 'ך ם ן ף ץ；词尾形不等于新的辅音，也不额外插入元音。'),
    unit(7, 'a、e、i 的常见元音点', ['niqqud', 'patah', 'qamats', 'tsere', 'segol', 'hiriq'], '03 · 词尾与元音', '只在明确标点的结构中练音值，不把历史点法等同于现代长短音。'),
    unit(8, 'o、u 与组合结构', ['holam', 'holam-vav', 'shuruq', 'qubuts', 'qamats-qatan'], '03 · 词尾与元音', 'וֹ、וּ 是完整元音结构；qamats qatan 在传统字形中常需靠语境识别。'),
    unit(9, '减缩点与条件读法', ['hataf-patah', 'hataf-segol', 'hataf-qamats', 'sheva', 'furtive'], '04 · 真实读法', 'sheva 不强行设为固定 e，furtive patah 只在指定结构中先读。'),
    unit(10, '撇号、外来音与数字', ['punctuation', 'foreign-j', 'foreign-zh', 'foreign-ch', 'numbers', 'maps'], '04 · 真实读法', '区分外来辅音、地址缩写、字母数值和地图惯用拼名。'),
    unit(11, '路牌与道路', ['word-street', 'word-road', 'word-highway', 'word-bridge', 'word-junction', 'word-avenues'], '05 · 街景实读', '先读转写，再揭示词义；שדרות 的林荫道复数与同形城市名要区分。'),
    unit(12, '车站、出入口与设施', ['word-station', 'word-railway', 'word-entrance', 'word-exit', 'word-center', 'word-market'], '05 · 街景实读', '无点牌面以完整词认读；标准拼写与现代读音分别核对。'),
    unit(13, '海岸与四个方向', ['word-beach', 'word-port', 'word-north', 'word-south', 'word-east', 'word-west'], '05 · 街景实读', '词尾 ם/ן/ף 放回实际词中；ẖ、撇号可用普通键盘输入。'),
    unit(14, '城市与聚落成分', ['word-city', 'word-house', 'word-moshav', 'word-kibbutz', 'word-garden', 'word-israel'], '05 · 街景实读', '注意 בית 的独立式 bayit 与地名连属式 bet；完成主线后开放城市额外课。'),
  ],
  extraUnits: [{
    id: 'hebrew-extra-1', title: '10 个城市与地图惯用名', subtitle: '海岸、北部与南部的常见城市',
    phase: '额外 · 城市地名', items: cities.map(item => item.id), placeLesson: true,
    note: '每个城市保留无点字形、规范转写、地图拼名和位置。红点不代表行政范围；不以课程命名表达边界或主权立场。',
  }],
  sources: sources.filter(source => source.id.startsWith('he-') || source.id === 'fsrs'),
};
