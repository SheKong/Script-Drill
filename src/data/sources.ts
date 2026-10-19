import type { Source } from '../types';

export const sources: Source[] = [
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
