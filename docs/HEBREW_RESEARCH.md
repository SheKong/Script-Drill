# 希伯来语课程研究与审校

日期：2026-11-01。范围：现代以色列希伯来语街景识读，不是圣经吟诵、意第绪语、完整语法课或所有地区口音。**尚未取得母语者全量独立审读。**

## 依据与取舍

| 方面 | 依据 | 课程处理 |
| --- | --- | --- |
| 文字结构 | Unicode 17.0，第 9 章 Hebrew | RTL、22 个基本字母、五个词尾形、元音点、rafe、dagesh、左右 shin/sin 点及撇号；数字内部不翻转 |
| 规范转写 | UNGEGN 2007，2013 年 2 月状态报告 | ח ẖ、כ kh、צ ts、ק k，词首词尾 א/ע 的撇号省略；规范保留的历史重叠不等于现代长辅音 |
| 现代音系 | Asherov & Bat-El (2019)，第 1–2 节 | 现代辅音群、非对立元音长度与可选喉音；宽式取 /ʁ χ ts/，不要求所有说话人丢失 /ʕ ħ/ |
| 字母与元音教学 | University of Texas at Austin，Hebrew Tutorials | 作为字母、元音与整词发音的原站入口；核心五元音与传统点法分开，不转载大学音频 |
| 地名拼写 | 以色列交通部 2025-05 方向标志地名表 | 核对无点希伯来文与实际路牌拉丁名；不提供有点形式或 IPA，UNGEGN 转写另依标准表 |
| 整词证据 | 原创 Wiktionary 词条与版本 | 有点形式、词义与现代读法分开核对；没有独立 IPA 时明确记为人工宽式 |
| 字体 | Noto Sans Hebrew 5.2.8，SIL OFL | 随构建本地提供 400/500/600，检验元音点、左右点与词尾形，不借用泰文/孟加拉文字体 |
| 地图 | Natural Earth v5.1.2，公有领域 | 本地轮廓和近似城市点；不表达对争议边界或主权的立场 |

来源：

- <https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-9/>
- <https://arhiiv.eki.ee/wgrs/rom1_he.htm>
- <https://www.outibatel.com/wp-content/uploads/2010/12/Asherov-and-Bat-El-2019-Syllable-structure.pdf>
- <https://www.gov.il/BlobFolder/generalpage/destination_names_for_directions_signage/he/MOTWebsiteUpdate%40mot.gov_.il_4561_Attachment1%20%282%29.pdf>
- <https://hebrew.laits.utexas.edu/tutorials.html>
- <https://www.naturalearthdata.com/about/terms-of-use/>

交通部 PDF 共 136 页，封面日期为 2025 年 5 月；具体核对位置为 PDF 页码：海法第 26 页、耶路撒冷第 28 页、拿撒勒及内坦亚第 40 页、特拉维夫—雅法第 50 页。第 42 页城市 עכו 使用 Acre，第 105 页车站名使用 Akko，说明同地的实际拉丁名也有语境差异。此表只支持无点地名与实际路牌拉丁名；有点形式及语音另列在版本化的逐词词典记录中，不声称这些出自路牌表。

不把 UNGEGN、SBL、ALA-LC、BGN/PCGN 或英语地图拼名混作一套。词内 dagesh 的历史重叠例如 rakkevet、kibbuts 保留在规范转写中；现代 IPA 不因此双写辅音。普通键盘可将 ẖ 输入为 h，并省空格、连字符与撇号，已有输入规则不要求特殊键盘。

## 学习范围

14 个主线单元，57 个非词汇知识、24 个街景词；10 城额外课。先教方向与无点文本的非唯一性，之后为字母对照、五个词尾形、13 个元音结构、sheva/词尾 patah、外来辅音、地址缩写、数字和真实词。主线使用实际课内答题及单元复习走通，不通过伪造学习进度解锁。

普通无点 ב/כ/פ 的读法不唯一，不能单独显示 ב 再把 v 作为唯一正确答案。软音字母卡显式使用 בֿ/כֿ/פֿ 的罕用 rafe 作教学辨别；先介绍它不是现代路牌常规写法，再回到不加 rafe 的真实词。שׁ/שׂ 同样先明确点位，不能把未标点的 ש 一概读作 sh。

有点词和无点完整拼写不总是“删掉附标”关系，例如 קִבּוּץ → קיבוץ、צֹמֶת → צומת。ו/י 的辅音或元音用途、sheva、qamats qatan、静音字母与 furtive patah 都不能用逐字符替换推导。课程不配置 `composition`。

每个词条显式列出所需字母、词尾形与实际有点形式的元音结构先修；sheva 单列为条件规则，dagesh 与规范重叠依赖对应说明。测试只从字母/元音知识卡检查字形覆盖，不把规则中的例词误当作已学字母；此检查不用于生成读音。

现代公路号、门牌、距离使用熟悉的 0–9，课程不虚构另一套十进制希伯来数字，也不重复制造十个已会的数字目标。字母数值只作场景识别，保留与十进制数字的边界。

## 逐词核对

可复核的版本、原词条 IPA、原转写、课程取值和证据类型在 `HEBREW_WORD_AUDIT.json`。抓取保留原始音值，**不把原词条的历史读法、动词同形项或所有口音统称为现代唯一读法**。核对表不复制词典长篇释义。

证据类型：

1. `listed-IPA-with-notation-normalization`：词条直接列出采用的 IPA。仅规范分隔符、连音弧、r/ʁ、ɡ/g，以及单音节冗余重音，不修改多音节重音或元音。
2. `listed-IPA-with-explicit-variant-selection`：词条明确列出括号中的可选音，逐词记录选择；不是全局删喉音。מערב 保留可选 /ʔ/，עיר 取省略初始 /ʔ/ 的形式等。
3. `lexical-transcription-plus-manual-broad-IPA`：有词条转写，但未取得独立 IPA，如 רכבת、כניסה、יציאה、מושב、אילת；人工宽式仍待独立发音审读。
4. `listed-IPA-needs-manual-comparison` / `manual-broad-IPA-pending-lexical-evidence`：未解决的证据缺口，不能算自动通过或母语审定。

本轮核查中的具体修正与边界：

- רחוב reẖov /ʁeˈχov/；דרך derekh /ˈdeʁeχ/，不把规范 kh 与 ẖ 合并成同一个字母。
- נמל 取规范式 נָמֵל namel /naˈmel/；常见口语 namal /naˈmal/ 另说明并接受输入，不把两个元音形式混称同一规范式。
- שדרות 的林荫道复数为 שְׂדֵרוֹת /sdeˈʁot/，与同形城市名 שְׁדֵרוֹת 的开头 /ʃd/ 分开。
- בית 的独立形式 bayit 不替代地名连属形式 bet。
- חיפה 规范 ẖefa，地图 Haifa；采用词典列出的 /ˈχajfa/，另有 /χejˈfa/，不从英语反推唯一读音。
- באר שבע 采用 /ˌbeʔeʁ ˈʃeva/，保留词条的次重音、选择其明确的可选喉音形式。
- נתניה 采用词条 /netanˈja/；另列 /naˈtanja/，不混成未经该词条支持的元音和重音组合。
- נצרת 采用 /natsˈʁat/，保留地图 Nazareth 和 Natzeret 变体。
- 额外课城市为 Jerusalem、Tel Aviv、Haifa、Be'er Sheva、Eilat、Ashdod、Ashkelon、Netanya、Akko、Nazareth。地理点只作位置示意。

重建审校表：

```sh
node scripts/audit-hebrew-words.mjs
```

原始 HTML 缓存在忽略目录 `.local/hebrew-research/`；下载失败记录缺证，不伪造版本号或 sourceIPA。第一次抓取可能触发 Vite 页面重载，宜在浏览器验收前运行完毕。地图可执行 `node scripts/build-hebrew-map.mjs` 重建；派生数据和许可在 `public/maps/israel.geojson`、`public/maps/ISRAEL.txt`。

## 音频与验收边界

本课尚无本站真人录音。不自动朗读孤立字母、元音占位符或 IPA；仅显式有点整词可用匹配 `he` 的设备声音或 Google 在线收听。兼容设备旧语言码 `iw`，不回退到英语、阿拉伯语或意第绪语声音。合成声音不等于人工审听的发音录音。

自动测试覆盖全字母/词尾/元音结构、同音去歧义、普通键盘输入、主线实际流程、备份、两个 Rush、RTL/拉丁方向、离线字体和地图。浏览器测试包含 320、390、1440 像素宽度的截图及字体/地图像素检查。**这些只证明工程行为和来源可追溯，不能替代母语者全量审读或未见路牌迁移测试。**
