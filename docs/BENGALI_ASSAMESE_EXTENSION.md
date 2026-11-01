# 孟加拉文扩展与阿萨姆语分支

核对日期：2026-11-01。目标是街景文字认读，不是完整语言或方言课程。新增内容尚未取得母语者全量独立审读，不把程序测试当作语言审定。

## 符号与合字

用户描述的“倒过来的延音符号”没有附图，不能唯一识别。课程明确介绍可能被误认的上方 **রেফ（reph）**：前置 র্ 在 র্ক、র্ম、র্দ 上方变形，不表示元音延长；同时分开教 ঁ（鼻化）、ঃ（visarga）、已有的 ৈ/ৌ 附标。不能把所有上方弯钩一概叫 reph。

新增 14 个知识目标：鼻化附标、reph、visarga，以及 র্ক、র্ম、র্দ、ব্র、ক্ষ্ম、হ্ম、ন্দ্র、ন্ধ、ষ্ট、শ্র、ক্স。ক্ষ্ম 的 /kʰː/、হ্ম 的 /mː/ 限定于所举词，不作为任意拼读生成规则；ষ্ট 与 স্ট、স্ত 分开。

原始规范和文字结构：

- Unicode 17 Core Specification, §12 Bengali：<https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-12/>。核对 reph、ra-phala、hasanta、khanda ta、Assamese ৰ/ৱ。
- UNGEGN Bengali, v4.0 (2016)：<https://arhiiv.eki.ee/wgrs/rom1_bn.htm>。规范转写与实际读音区分。
- UNGEGN Assamese, v4.0 (2016)：<https://arhiiv.eki.ee/wgrs/rom1_as.pdf>。ৰ → r、ৱ → v、য → j̱；不把地图名 Guwahati 的 w 改称规范转写。
- Census of India, The Written Languages of the World, Assamese：<https://censusindia.gov.in/nada/index.php/catalog/32379/download/35560/29283_1981_SUR.pdf>。核对齿龈塞音、/x s z/、鼻化；其 rhotic 宽记 r，课程采用近音 /ɹ/ 变体，不宣称唯一口音。

## 地名分配

孟加拉语额外课保留原四个单元 ID，但重新分配为每组 10 个城市；12 个旧地名的知识 ID、输入兼容与已有 FSRS 不变。新增 8 个孟加拉国城市、20 个印度城市。旧单元复习标记仍保留，但一个单元只有其新目标也完成基础练习后才算完成。

| 单元 | 10 个城市 |
| --- | --- |
| 孟加拉国首都与东部 | Dhaka, Chattogram, Cumilla, Cox's Bazar, Sylhet, Mymensingh, Narayanganj, Narsingdi, Chandpur, Brahmanbaria |
| 孟加拉国北部与西南 | Khulna, Rajshahi, Barishal, Rangpur, Jashore, Bogura, Faridpur, Kushtia, Tangail, Lakshmipur |
| 印度南孟加拉 | Kolkata, Howrah, Durgapur, Asansol, Bardhaman, Krishnanagar, Kharagpur, Medinipur, Chandannagar, Shrirampur |
| 印度北孟加拉与东北 | Siliguri, Darjeeling, Jalpaiguri, Cooch Behar, Malda, Balurghat, Raiganj, Berhampore, Agartala, Silchar |
| 阿萨姆语分支 | Guwahati, Dibrugarh, Jorhat, Tezpur, Nagaon, Tinsukia, Sivasagar, Nalbari, Dhubri, Bongaigaon |

地理范围有意包含特里普拉邦和阿萨姆邦巴拉克河谷，而不把“印度孟加拉语地区”简单等同于西孟加拉邦。Darjeeling 的孟加拉语写名也不表示当地仅使用孟加拉语。

官方原文/位置背景入口：

- 孟加拉国 National Portal：<https://bangladesh.gov.bd/site/view/district-list>；Lakshmipur、Brahmanbaria 等地方政府门户。
- 西孟加拉邦：<https://wb.gov.in/our-districts.aspx>。
- Hoogly/Chandannagar/Serampore：<https://hooghly.nic.in/bn/>、<https://chandannagarmunicipalcorporation.in/>。
- Darjeeling、Siliguri：<https://darjeeling.gov.in/bn/>。
- Agartala Municipal Corporation：<https://agartalacity.tripura.gov.in/>。
- Cachar/Silchar：<https://cachar.gov.in/>。
- Assam district directory：<https://assam.gov.in/districts>；地方原文入口包括 <https://nalbari.assam.gov.in/>、<https://dibrugarh.assam.gov.in/>、<https://bongaigaon.assam.gov.in/>。

这些行政资料核对书写/地域，不是音标词典。逐词审校表 `BENGALI_WORD_AUDIT.json` 明确区分：

1. 有版本号的词典 IPA，经记录过的记号规范化后匹配。
2. 有词条转写，无独立词典 IPA，人工按宽式音值记音。
3. 原文地名 + 人工宽式 IPA，**待独立发音审读**。不伪造词典版本号、词典转写或 sourceIPA。

本轮取得的原始词条包括 Brahmanbaria、Kushtia、Kolkata、Howrah、Bardhaman、Darjeeling、Malda、Agartala 和 Assamese Guwahati 的列出 IPA，及 Durgapur、Medinipur、Siliguri、Cooch Behar、Silchar 的词条转写。按词典修正了 Brahmanbaria/Kushtia 的 i̯、Howrah 的元音记法，以及 Silchar 中不可机械删掉的固有元音。其他查询未取得可用词条的名字保留待审状态，不宣称已获逐词词典验证。

复核缓存可用：

```sh
node scripts/audit-bengali-words.mjs কলকাতা হাওড়া বর্ধমান
node scripts/audit-bengali-words.mjs --language=Assamese গুৱাহাটী
node scripts/build-bengali-audit.mjs
```

词典查询为原始贡献者词条，不用百科转引替代发音证据。下载失败只记录缺证，不生成猜测的“来源转写”。

## 分支边界

入口在主界面地名额外课之后，但学习关系与主线平行。未学完主线时显示提醒、第一单元仍可直接开始；分支内部按顺序学习、完成综合复习。早学只绕过默认的主线先修要求，绝不写入主线进度、主线结课或地名提前解锁。

分支教 ৰ、ৱ，শ/ষ/স 的常见 /x/，চ/ছ 的 /s/，জ/ঝ/য 的 /z/，传统齿音/卷舌拼写的现代合流，র/ৰ 合字与鼻化。条件变体仍需逐词核对；不是凭单字符就能判定所有词读音的替换器。

共享字母/数字只有在本课所教转写、音值都适用时才标记两语言归属；同形异音独立 ID。字形、附标保持完整 shaping；阿萨姆语词只使用 as 声音/在线入口，不回退 bn。

图鉴复选框对两个 Rush 使用相同并集筛选，空选集为空；子集最高分独立存储，全选保留旧键。具体工程约定和后续课程模板见 `ADDING_A_COURSE.md` 第 9 节。

## 地图与其他课程

新增印度轮廓使用与原孟加拉国轮廓相同版本的 Natural Earth v5.1.2 公有领域数据。`place.mapId: 'india'` 选择独立轮廓与 Mercator 投影；不移动孟加拉国地图或把印度城市画到孟加拉国上。

重建：先用现有 `fetch-bengali-map.mjs` 获取固定版本的国家数据，再执行 `node scripts/build-india-map.mjs`。派生数据和许可在 `public/maps/india.geojson`、`public/maps/INDIA.txt`。城市点为近似位置，不代表行政边界、导航精度或法定疆界立场。

“地名单元约 10 个”也落实到泰语：原 90 个地名目标（含 7 个主线已教词）分为 9 组，每组 10 个，不增删原知识 ID。全课程额外课、标记为 `placeLesson` 的分支地名课由模板强制校验 8–12 项。
