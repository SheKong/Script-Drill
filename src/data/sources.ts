import type { Source } from '../types';

export const sources: Source[] = [
  {
    id: 'he-ungegn', title: 'Romanization of Hebrew · UN 2007 system · 2013 report',
    organization: 'UNGEGN · Working Group on Romanization Systems',
    url: 'https://arhiiv.eki.ee/wgrs/rom1_he.htm',
    description: '核对 2007 年 IX/9 推荐方案：现代希伯来语地名的辅音、元音、外来音、喉音撇号、dagesh 与静音字母。与 1977 年旧表、ALA-LC、SBL 及地图惯用名分别处理。',
  },
  {
    id: 'he-unicode', title: 'Unicode 17.0 · Hebrew',
    organization: 'The Unicode Consortium',
    url: 'https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-9/#G6528',
    description: '核对 RTL、22 字母、五个词尾形、niqqud、rafe、dagesh、shin/sin 点及 geresh/gershayim。字符编码并不决定词内实际读音。',
  },
  {
    id: 'he-phonology', title: 'Syllable structure and complex onsets in Modern Hebrew · 2019',
    organization: 'Daniel Asherov & Outi Bat-El · 原始语言学研究',
    url: 'https://www.outibatel.com/wp-content/uploads/2010/12/Asherov-and-Bat-El-2019-Syllable-structure.pdf',
    description: '核对现代辅音群、非对立元音长度和可选喉音等现代口语边界；不是全部词条都有独立审定 IPA 的声明。',
  },
  {
    id: 'he-lexicon', title: 'Hebrew lexical entries · pointed forms and readings',
    organization: 'Wiktionary · 原创词条贡献者',
    url: 'https://en.wiktionary.org/wiki/Category:Hebrew_lemmas',
    description: '核对逐词有点形式、词义与读音变体。课程采用人工整理的现代宽式 IPA，具体词条、取舍及待独立审读状态列在 docs/HEBREW_RESEARCH.md，不冒充母语审定。',
  },
  {
    id: 'he-places', title: 'Destination Names for Direction Signs · May 2025',
    organization: 'Israel Ministry of Transport',
    url: 'https://www.gov.il/BlobFolder/generalpage/destination_names_for_directions_signage/he/MOTWebsiteUpdate%40mot.gov_.il_4561_Attachment1%20%282%29.pdf',
    description: '方向标志的希伯来文、阿拉伯文及拉丁地名表，用于核对无点地名与路牌实际拉丁名。不提供有点形式或 IPA，也不把路牌惯用名等同于 UNGEGN 规范转写。',
  },
  {
    id: 'he-pronunciation', title: 'Hebrew Language Learning Resources',
    organization: 'University of Texas at Austin · Hebrew',
    url: 'https://hebrew.laits.utexas.edu/tutorials.html',
    description: '大学原站字母、元音和发音教学入口，仅链接，不转载音频。本站尚无希伯来语真人录音，设备语音和在线整词示范不等于人工录音。',
  },
  {
    id: 'he-boundaries', title: 'Natural Earth · Israel outline · v5.1.2',
    organization: 'Natural Earth',
    url: 'https://www.naturalearthdata.com/about/terms-of-use/',
    description: '公有领域 1:50m 国家数据的 ISR 要素，仅作城市位置示意。派生数据、版本与来源随 /maps/ 提供；边线不表达对争议边界或主权的立场。',
  },
  {
    id: 'as-lsp', title: 'Assamese as Spoken in Assam · Language Specific Peculiarities',
    organization: 'Appen Butler Hill · Linguistic Data Consortium',
    url: 'https://catalog.ldc.upenn.edu/docs/LDC2016S06/LSP_102_final.pdf',
    description: '语料采集者的一手语音说明，页 6–9 核对字母、条件音值、এ /ɛ~e/、ও /ʊ/ 与共用元音。其内部可逆罗马化不是本站 UNGEGN 方案；两者不得混用。',
  },
  {
    id: 'bn-script', title: 'The Bangla Script', organization: 'University of Texas at Austin · Bangla OER',
    url: 'https://bangla.la.utexas.edu/resources/the-bangla-script/',
    description: '字母、元音附标、固有元音、合字与 phala 的大学资料。与 UNGEGN 字母转写、IPA 音值分别核对，不用英语近似音代替 IPA。',
  },
  {
    id: 'bn-ungegn', title: 'UNGEGN Bengali Romanization · 2016 status report', organization: 'UNGEGN · Working Group on Romanization Systems',
    url: 'https://arhiiv.eki.ee/wgrs/rom1_bn.htm',
    description: '本课采用的联合国推荐字母转写表，依据 1972 年 II/11 决议。区分 ā/ī/ū、ṭ/ḍ、ṙ/ṛ、j̱/y、sh/ṣh 与 ṁ。报告未发现该系统在当地或国际地图使用的证据，不将推荐标准冒称孟加拉国统一官方地图拼法；实际发音另用 IPA。',
  },
  {
    id: 'bn-pronunciation', title: 'Pronouncing the Bangla Alphabet', organization: 'University of Texas at Austin · Bangla OER',
    url: 'https://bangla.la.utexas.edu/resources/pronunciation/',
    description: '原站真人发音与发音部位教学；只链接原站，不转载其录音。孤立字母名不等于词内辅音读法。',
  },
  {
    id: 'bn-recordings', title: 'Bengali pronunciation recordings', organization: 'Wikimedia Commons · Lingua Libre',
    url: 'https://commons.wikimedia.org/wiki/Category:Lingua_Libre_pronunciation-ben',
    description: '词条本地示范音频。每个录音都链接到对应原文件页，署名、说话人及许可按素材分别标注。',
  },
  {
    id: 'bn-unicode', title: 'Unicode 17.0 · 12.2 Bengali (Bangla)', organization: 'The Unicode Consortium',
    url: 'https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-12/#G11121',
    description: '核对完整字符、元音附标、hasanta、reph、ya-phalaa、khanda ta、数字，以及孟加拉语与阿萨姆语共用文字的边界。',
  },
  {
    id: 'bn-orthography', title: 'Bengali/Bangla Orthography Notes', organization: 'Richard Ishida · 文字与排版研究',
    url: 'https://r12a.github.io/scripts/beng/bn.html',
    description: '作者的文字系统与 Unicode 实例研究，核对附标位置、独立元音、合字、鼻音符号及完整文本 shaping；不是官方语言规范。',
  },
  {
    id: 'bn-phonetics', title: 'Bengali (Bangladeshi Standard) · 2010', organization: 'Sameer ud Dowla Khan · Journal of the International Phonetic Association',
    url: 'https://www.reed.edu/linguistics/khan/assets/Khan%202010%20Bengali%20Bangladeshi%20standard.pdf',
    description: '孟加拉国标准语的原始语音学研究，DOI 10.1017/S0025100310000071。核对元音无常规长短对立、重叠辅音、舌位、r、s/sh 与鼻化的地区边界，不将其与传统宽式记音混为一套严式音标。',
  },
  {
    id: 'bn-loc', title: 'ALA-LC Bengali Romanization Table · 2017', organization: 'Library of Congress',
    url: 'https://www.loc.gov/catdir/cpso/romanization/bengali.pdf',
    description: '核对书目转写与实际读音的差别。本站没有采用 ALA-LC 作为输入考核方案；不把 ā、ī、ai 等字母编码直接当现代语音。',
  },
  {
    id: 'bn-lexicon', title: 'Bengali lexical entries · per-word audit', organization: 'Wiktionary · 原创词条贡献者',
    url: 'https://en.wiktionary.org/wiki/Category:Bengali_lemmas',
    description: '逐词核对原文、词义、转写及词条列出的 IPA 变体。具体词条 URL、版本、采用音值与缺少独立 IPA 的状态记录在项目 docs/BENGALI_WORD_AUDIT.json，不声称是母语独立审校。',
  },
  {
    id: 'bn-government', title: 'Divisions of Bangladesh · National Portal', organization: 'Bangladesh National Portal',
    url: 'https://bangladesh.gov.bd/site/view/division-list',
    description: '官方行政区目录，用于核对地名拼写、Division / District 层级与英语惯用名；不以此目录冒充地名 IPA 的来源。',
  },
  {
    id: 'bn-india-places', title: 'Bengali geographical names in India', organization: 'Government of West Bengal · district portals',
    url: 'https://wb.gov.in/our-districts.aspx',
    description: '西孟加拉邦及其市、县官方门户的原文地名；同时参考 Agartala Municipal Corporation 与 Cachar District 官方门户。不以行政目录冒充 IPA 依据；逐词来源与待审状态见扩展研究文档。',
  },
  {
    id: 'bn-india-boundaries', title: 'Natural Earth · India outline · v5.1.2', organization: 'Natural Earth',
    url: 'https://www.naturalearthdata.com/about/terms-of-use/',
    description: '公有领域 1:50m 国家轮廓，印度城市使用独立地图配置；保留派生 GeoJSON 与来源。仅学习位置示意，不代表法定边界主张。',
  },
  {
    id: 'as-ungegn', title: 'Romanization of Assamese · version 4.0 (2016)', organization: 'UNGEGN · Working Group on Romanization Systems',
    url: 'https://arhiiv.eki.ee/wgrs/rom1_as.pdf',
    description: '联合国 1972 年 II/11 决议推荐的阿萨姆语转写表；ৰ r、ৱ v、য j̱ 与附标的规范依据。推荐方案不等于当地统一地图拼名；与孟加拉语分别配置。',
  },
  {
    id: 'as-unicode', title: 'Unicode Core Specification · Bengali / Assamese', organization: 'Unicode Consortium',
    url: 'https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-12/',
    description: '核对共用编码区块、Assamese ৰ/ৱ、合字和 reph。区块名 Bengali 不是语言归属标签；相同编码可有不同语言读音。',
  },
  {
    id: 'as-phonology', title: 'The Written Languages of the World · Assamese', organization: 'Census of India · language survey',
    url: 'https://censusindia.gov.in/nada/index.php/catalog/32379/download/35560/29283_1981_SUR.pdf',
    description: '阿萨姆语音系中的齿龈塞音、/x/、/s/、/z/ 和鼻化背景。资料将 rhotic 宽记 r，本分支选择近音 /ɹ/ 变体；不声称本调查逐词提供地名 IPA 或课程已获母语审定。',
  },
  {
    id: 'as-places', title: 'Assam districts and Assamese place spellings', organization: 'Government of Assam · district portals',
    url: 'https://assam.gov.in/districts',
    description: '核对阿萨姆邦城市、地区与阿萨姆语拼写，参考 Nalbari、Dibrugarh、Bongaigaon 等地方政府原文。地图惯用名与人工宽式读音分别记录。',
  },
  {
    id: 'bn-boundaries', title: 'Natural Earth · Bangladesh outline · v5.1.2', organization: 'Natural Earth',
    url: 'https://www.naturalearthdata.com/about/terms-of-use/',
    description: '公有领域的 1:50m 国家轮廓。随站点提供派生 GeoJSON 和来源说明；城市为近似参考点，不能当作法定边界或精确导航。',
  },
  {
    id: 'thai-boundaries', title: 'Thailand ADM1 · 77 regions', organization: 'geoBoundaries · OpenStreetMap contributors / Wambacher',
    url: 'https://www.geoboundaries.org/api/current/gbOpen/THA/ADM1/',
    description: '2017 年边界数据，76 府与曼谷；本地简化轮廓仅用于位置示意。数据按 ODbL 1.0 提供，改编数据库、来源和许可在 /maps/ 中随站点提供。',
  },
  {
    id: 'thai-places', title: 'Thai geographical names · pronunciation reference', organization: 'Wiktionary · 泰语地名词条',
    url: 'https://en.wiktionary.org/wiki/Category:th:Provinces_of_Thailand',
    description: '地名的完整拼写和逐词读音参考。本站采用省略声调与不释放附标的宽式 IPA，不用逐字符替换来猜测地名发音。中文译名在不同地图中可能不同。',
  },
  {
    id: 'rush-duolingo', title: 'Ways to practice · Match Madness', organization: 'Duolingo',
    url: 'https://blog.duolingo.com/ways-to-practice-in-duolingo/',
    description: '借鉴限时词汇配对的公开玩法；本站的三格轮换、防固定位置重复和候选冷却算法为独立设计，不宣称复现产品内部算法。',
  },
  {
    id: 'rush-quizlet', title: 'Playing Match', organization: 'Quizlet',
    url: 'https://help.quizlet.com/hc/en-us/articles/360031183611-Playing-Match',
    description: '参考计时匹配术语与定义的玩法；本站固定两分钟，比较有效配对得分，不采用清空棋盘最短耗时。',
  },
  {
    id: 'rtgs', title: 'Romanization of Thai geographical names',
    organization: 'UNGEGN · 泰国皇家学会转写方案',
    url: 'https://arhiiv.eki.ee/wgrs/rom1_th.pdf',
    description: '联合国地名专家组汇编的泰语罗马化表；核对辅音、元音及 RTGS 地名转写。RTGS 不标声调和元音长短。',
  },
  {
    id: 'thai-reading', title: 'Reading Thai · 阅读课程',
    organization: 'Thai Notes · 原创泰文阅读课程',
    url: 'https://thai-notes.com/reading/index.html',
    description: '核对字母读音、元音变形、尾音、隐含元音、声调及拼读例外。本站重新编写中文讲解，没有照搬原课程。',
  },
  {
    id: 'ipa-chart', title: 'The International Phonetic Alphabet',
    organization: 'International Phonetic Association',
    url: 'https://www.internationalphoneticassociation.org/content/full-ipa-chart',
    description: '核对 IPA 符号、发音部位与方法、元音位置及附加符号。本课程不是完整 IPA 表。',
  },
  {
    id: 'ipa-audio', title: 'Interactive IPA Chart',
    organization: 'International Phonetic Association',
    url: 'https://www.internationalphoneticassociation.org/IPAcharts/inter_chart_2018/IPA_2018.html',
    description: '协会交互音标表，可在原站听真人示范。本站不以英语 TTS 假冒 IPA 发音。',
  },
  {
    id: 'ipa-recordings', title: 'IPA sound recordings',
    organization: 'Wikimedia Commons · 各录音作者',
    url: 'https://commons.wikimedia.org/wiki/Category:Audio_files_of_phonetic_samples',
    description: '随站点提供公开授权的真人 IPA 录音，转为 MP3 兼容移动浏览器，未裁切或改变音高、速度。每条录音列出原文件页、作者及许可；单个录音是示范，不代表所有语言中的具体实现。',
  },
  {
    id: 'speech-api', title: 'Web Speech API · SpeechSynthesis',
    organization: 'MDN · 浏览器语音合成接口',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis',
    description: '未收录真人音频时的可选合成方案，不是泰语发音的唯一入口。只选择匹配语言的声音，不切换到英语；缺少声音时提供系统安装指引和不依赖语音包的在线收听。部分声音可能联网。',
  },
  {
    id: 'seeing-speech', title: 'Seeing Speech · IPA Charts',
    organization: 'University of Glasgow · Seeing Speech',
    url: 'https://www.seeingspeech.ac.uk/ipa-charts/',
    description: '另一套真人 IPA 示范，配合口部、超声及 MRI 影像观察发音动作。仅链接原站，不将影像或音频擅自转载为本站素材。',
  },
  {
    id: 'thai-recordings', title: 'Thai pronunciation · Commons / Lingua Libre',
    organization: 'Wikimedia Commons · Lingua Libre 及录音贡献者',
    url: 'https://commons.wikimedia.org/wiki/Category:Thai_pronunciation',
    description: '已收录的泰语真人示范随站点提供，无需设备语音包。含传统 Commons 录音及 Lingua Libre 贡献，每条素材保留作者、许可和原文件页；尚未覆盖全部课程。',
  },
  {
    id: 'duo-writing', title: 'Tools for learning to read other writing systems',
    organization: 'Duolingo · Cindy Blanco / Chris Denter · 2021',
    url: 'https://blog.duolingo.com/learning-other-writing-systems/',
    description: '借鉴文字图鉴、字音映射、从字母到音节和词语的渐进练习；不使用其课程素材或品牌资产。',
  },
  {
    id: 'duo-spacing', title: 'How we learn how you learn',
    organization: 'Duolingo · Burr Settles · 2016',
    url: 'https://blog.duolingo.com/how-we-learn-how-you-learn/',
    description: '借鉴提取练习和个体化遗忘模型的设计思想；本站调度器使用 FSRS，不声称复现多邻国算法。',
  },
  {
    id: 'fsrs', title: 'TS-FSRS',
    organization: 'Open Spaced Repetition',
    url: 'https://github.com/open-spaced-repetition/ts-fsrs',
    description: '实际使用的间隔复习实现，目标保持率 90%。同一知识每课只结算一次，避免课内重复虚增长期记忆强度。',
  },
  {
    id: 'tat', title: 'Destinations in Thailand',
    organization: 'Tourism Authority of Thailand',
    url: 'https://www.tourismthailand.org/Destinations',
    description: '核对常见目的地英文名称。约定俗成的英文名可能与 RTGS 不同，例如 Pattaya / Phatthaya。',
  },
];
