import type { Source } from '../types';

export const sources: Source[] = [
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
