import type { Source } from '../types';

export const devanagariSources: Source[] = [
  {
    id: 'hi-ungegn', title: 'Romanization of Hindi · UN 1972/1977 · 2016 report',
    organization: 'UNGEGN · Working Group on Romanization Systems',
    url: 'https://arhiiv.eki.ee/wgrs/rom1_hi.pdf',
    description: '主线规范：ch/chh、sh/ṣh、ṙ、ṁ、m̐，保留词中固有 a、地名词尾省略 a。报告并未发现推荐方案在印度地图上统一使用的证据；不能把它称作印度统一官方路牌拼法。',
  },
  {
    id: 'ne-ungegn', title: 'Romanization of Nepali · UN 1972 · 2013 report',
    organization: 'UNGEGN · Working Group on Romanization Systems',
    url: 'https://arhiiv.eki.ee/wgrs/rom1_ne.pdf',
    description: '尼泊尔语分支规范；区分联合国推荐表、Nepal Survey Department 转写和简化地图名，不将三者混用。长音字母的转写不等于口语长短对立。',
  },
  {
    id: 'mr-loc', title: 'ALA-LC Marathi Romanization Table · 2011',
    organization: 'Library of Congress',
    url: 'https://www.loc.gov/catdir/cpso/romanization/marathi.pdf',
    description: '马拉地语书目转写的 c/ch、ś/sh、ḷ、ê/ô、鼻音按后接部位转写和其他位置的元音波浪号。保留书写固有 a，包括词尾；不是语音转写或统一地图拼名。',
  },
  {
    id: 'deva-unicode', title: 'Unicode 17.0 · 12.1 Devanagari',
    organization: 'The Unicode Consortium',
    url: 'https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-12/#G12284',
    description: '书写单位、元音附标重排、virama、半形、合字、reph/rakar、nukta、语言特定字形与数字。编码标准不提供逐词语音审校。',
  },
  {
    id: 'hi-orthography', title: 'Hindi orthography notes',
    organization: 'Richard Ishida · 原创文字与排版研究',
    url: 'https://r12a.github.io/scripts/deva/hi.html',
    description: '现代印地语固有元音、元音附标、鼻化、借词字母与马拉地语睫毛形 r 的实例；区分文字结构和具体语言实际读音。',
  },
  {
    id: 'ne-phonetics', title: 'Nepali · Illustrations of the IPA · 2009',
    organization: 'Rajesh Khatiwada · Journal of the International Phonetic Association',
    url: 'https://doi.org/10.1017/S0025100309990181',
    description: '基于母语说话人的原始语音研究：六类口元音、无常规 i/ī 和 u/ū 长短对立、齿龈塞擦音、卷舌塞音的闪音变体、鼻化与 rhotic。不能据此声称所有课程地名均获作者审定。',
  },
  {
    id: 'deva-lexicon', title: 'Hindi, Nepali and Marathi lexical entries · per-word evidence',
    organization: 'Wiktionary · 原创词条贡献者',
    url: 'https://en.wiktionary.org/wiki/Category:Devanagari_script_languages',
    description: '逐词保留原文、语言分节、版本、词典转写、所列 IPA 和课程采用值。缺失或不同的 IPA 单列人工宽式状态；不是母语者独立审读。',
  },
  {
    id: 'hi-teaching', title: 'Hindi at the University of Texas at Austin',
    organization: 'University of Texas at Austin',
    url: 'https://hindi.la.utexas.edu/',
    description: '大学原站语言教学入口；仅作外部学习与发音资源，不下载或假称本站拥有其真人录音。',
  },
  {
    id: 'ne-lalitpur-official', title: 'ललितपुर महानगरपालिका',
    organization: 'Lalitpur Metropolitan City',
    url: 'https://lmc.gov.np/en/',
    description: '市政府原站确认 ललितपुर 本地拼写与地点语境；不提供或背书课程 IPA。',
  },
  {
    id: 'mr-pwd-official', title: 'सार्वजनिक बांधकाम विभाग',
    organization: 'Public Works Department · Government of Maharashtra',
    url: 'https://pwd.maharashtra.gov.in/',
    description: '政府道路部门通知中的 महामार्ग 拼写与道路语境；不是词典或独立语音审校。',
  },
  {
    id: 'mr-satara-official', title: 'सातारा जिल्हा',
    organization: 'Satara District · Government of Maharashtra',
    url: 'https://www.satara.gov.in/',
    description: '地区政府原站的 सातारा 拼写与地理语境；课程宽式 IPA 仍待独立审读。',
  },
  {
    id: 'mr-sangli-official', title: 'सांगली जिल्हा',
    organization: 'Sangli District · Government of Maharashtra',
    url: 'https://sangli.nic.in/mr/',
    description: '地区政府原站的 सांगली 拼写与地理语境；课程宽式 IPA 仍待独立审读。',
  },
  {
    id: 'mr-ratnagiri-official', title: 'रत्नागिरी जिल्हा',
    organization: 'Ratnagiri District · Government of Maharashtra',
    url: 'https://ratnagiri.gov.in/',
    description: '地区政府原站的 रत्नागिरी 拼写与地理语境；课程宽式 IPA 仍待独立审读。',
  },
  {
    id: 'deva-nepal-boundaries', title: 'Natural Earth · Nepal outline · v5.1.2',
    organization: 'Natural Earth',
    url: 'https://www.naturalearthdata.com/about/terms-of-use/',
    description: '公有领域 1:50m 示意轮廓；城市在尼泊尔独立投影上展示。派生 GeoJSON、版本和用途说明随 /maps/ 提供，不据此判定争议归属。',
  },
];
