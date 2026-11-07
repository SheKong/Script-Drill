# 字里 · Script Drill

面向 GeoGuessr 街景探索的文字学习网页。React、TypeScript、Vite，纯静态部署，无账号、无后台、无 API 密钥。

## 本地运行

需要 Node.js 24。

```sh
npm ci
npm run dev
```

默认地址为 `http://localhost:5173`。泰文、孟加拉文、希伯来文、天城文与 IPA 字体随构建提供；中文使用操作系统字体，不依赖 Google Fonts 网络请求。

## 已实现

- **独立的国际音标基础课**：14 个单元，按通用语音学的发音部位、方法、清浊、元音坐标、附加符号与气流机制组织，不是某一语言的先修定制课。
- **泰语文字课**：19 个基础单元和 1 个词汇补充单元，119 个字母、结构与规则知识，38 个主线词汇。声调和辅音类别在开头说明，后续重点练习调号辨认，不要求计算完整声调。
- **孟加拉语文字课**：20 个基础单元和 1 个词汇补充单元，109 个字母、附标、合字、规则与数字知识、29 个主线街景词。4 组地名额外课共 40 城，包含孟加拉国、西孟加拉邦、特里普拉和巴拉克河谷。另有 5 单元的平行阿萨姆语分支，含 31 个差异知识与 10 个城市。
- **希伯来语文字课**：14 个主线单元，57 个字母、词尾形、元音结构与规则知识、24 个街景词及 10 城额外课。现代希伯来语，使用 UNGEGN 2007 + 宽式 IPA，支持 RTL、本地字体、地图惯用名和位置；不把无点文本当作唯一可机械拼读的形式。
- **天城文课**：16 单元印地语主线，33 个基本辅音、11 个常见独立元音及 10 个附标、合字、nukta、鼻化与数字，24 个街景词和 10 城额外课。另有各 5 单元的尼泊尔语、马拉地语分支，各含 8 个街景词与 10 城；语言音值、规范转写、图鉴筛选、语音和独立进度均分开。
- 数据驱动的双向四选一、可从任一侧开始的唯一对应配对、受限语法生成的声母元音拼读、词义反选、转写输入。同侧点击只切换/取消选择，不能构成配对。
- 转写输入接受去附加符号的普通字母、历史别名及地图惯用名；知识详情、提示和答后反馈列出可接受输入，不要求键入 ā、ṁ 等特殊字符。
- 首次词汇先练转写，答后提供含义；词义反向与输入仅在已初见词的练习中出现。
- FSRS 间隔调度、小批量引入、前置知识解锁、课内错题间隔重现。
- 每单元末尾有综合复习，通常约 36 题，**含错题补练最多 50 题**；优先覆盖本单元实际知识，混入到期与已学内容，可行时填满 5 对。
- 抽象规则只需一次无提示正确判断，不重复伪反向题；通过后至少间隔 14 天才进入自动复习，每轮最多选 2 条。纯规则且无实际知识可混排时不强凑题数，规则主要放回实际词中应用。
- 主线词汇集中收尾，主线全部完成后显示祝贺页，不再隐式逐词追加短课。
- 简单 / 词汇 Rush：两分钟无限五对配对、三格轮换补位、防固定位置刷分、候选冷却、分课程和模式保存最高分。Rush 不改变 FSRS。
- 泰语 9 组地名额外课，覆盖 76 府、曼谷特别行政区和 13 个额外城市（共 83 个主线外词汇）；孟加拉语 4 组共 40 城市。所有地名课目标每组约 10 个，模板校验 8–12 个。默认结课后开放，也可确认警告后按课程提前解锁，不代替主线学习。
- 阿萨姆语分支在主界面显示于地名课之后，但与主线平行；提前进入有先修提醒而不锁入口，分支内部独立推进。图鉴支持孟加拉语/阿萨姆语多选，共享知识只显示一次；两个 Rush 使用同一语言范围，并分语言子集保存最高分。
- 配对、Rush 和图鉴的语言角标只用于差异项；所有课程语言共用的知识不显示角标。এ/ও 及其附标的阿萨姆语音值独立建卡，不再误归为完全共用。
- 地名使用本地轮廓示意：行政区红面、城市红点；红点固定屏幕尺寸，放大页面/地图时不跟随变粗。无在线底图依赖，保留边界来源与许可。
- 印度轮廓统一采用 Natural Earth 中国视角数据（不是官方审定地图）；仅可能涉及争议地图的课程主页显示共用的展示用途、非政治立场与和平声明，不添加地区专属段落，泰语等课程不显示。长期规则见 `docs/MAP_POLICY.md`。
- 可搜索图鉴、学习记录、本地备份导入导出、刷新续学、手机布局。
- 备份校验、损坏数据保护、无题可练状态、音频故障时的重试、在线收听与系统语音安装指引。
- 传统有圈体与现代无圈体切换、详情并排对照；完整 Charis SIL 字体覆盖连音弧和 IPA 附标，不依赖手机补字。
- 本地真人 IPA 录音 63 条（覆盖 64 个音值中的 63 个）、泰语录音 15 条（共享例词后覆盖 18 个条目），含逐条作者与许可。只在有录音或匹配的 TTS 声音时显示扬声器；无声音时只保留 Google 在线收听。环境检测和安装帮助位于学习首页。

## 重要边界

1. 泰文主线只学 **RTGS + IPA**，地图惯用拼法另列。`จ → ch /tɕ/` 与 `ช → ch /tɕʰ/` 用 IPA 区分；不再要求额外背自定义教学转写。旧输入作为兼容别名保留。
2. 泰语**词汇 IPA 均未标声调**。开头解释五调与辅音类别的意义，后续练习认出调号；系统声调和口语训练请使用专门课程。
3. IPA 学习的是**符号与发音特征**，没有虚构一套“通用英文转写”。它是入门选集，不是完整 IPA 发音资格训练。
4. 公开授权的 IPA 和已收录泰语真人音频随站点提供，不需要安装语音包。未收录 IPA 可查看协会及 Seeing Speech 原站。泰语未覆盖条目使用可选设备语音或在线翻译网站的朗读，不调用未公开的 TTS API，也不把密钥放进前端。Windows / Android / Apple 安装步骤、官方说明和重新检测入口集中在学习首页；系统装好声音不保证浏览器可用。字母名/元音例词的原文和“非单音”标注直接放在发音入口旁，TTS 不是人工审定录音。
5. 孟加拉文使用联合国推荐 UNGEGN + IPA，不再使用自定义读音转写。UNGEGN 的 ā/ī/ū 等保留历史拼写，不强制现代长短对立，固有元音实际读法看 IPA；它不是当地统一官方地图拼法。地图旧新英语名另列并可输入。原输入作为兼容别名保留。部分街景词和城市提供逐条署名的 Commons 真人录音；其他整词可用可选 `bn` 设备语音和在线收听。
6. 自动检查能验证内容结构、选项歧义和路径可达性，**不能替代语言专家对全部条目的独立审校**。孟加拉语全量母语独立审读尚未取得，词典没有独立 IPA 的 5 个条目单列审校状态；新增录音也仍需语言专家审听。
7. 希伯来语针对现代街景而非圣经吟诵。字母课用显式点位及罕用 rafe 区分读法，真实词用无点形式；不启用自动拼词。部分整词只有词典转写而没有独立 IPA，逐词证据与人工宽式状态另列，尚待母语者全量独立审读；没有本站真人录音，仅提供匹配语言的可选设备语音与在线整词收听。
8. 天城文是文字，不是语言或国家。印地语/尼泊尔语用各自 UNGEGN 表，马拉地语用 ALA-LC 2011；规范保留的拼写元音不保证实际读出。整词 IPA 人工核查、尚待三种语言各自的独立母语审读，不启用自动拼词，不宣称有本站真人录音。

## 部署到 Vercel

将整个项目上传 Git 仓库，在 Vercel 导入，使用以下配置：

| 配置 | 值 |
| --- | --- |
| Framework Preset | Vite |
| Node.js | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| 环境变量 | 无 |

仓库已包含 `vercel.json`。本地构建：

```sh
npm run build
npm run preview
```

没有实际执行远程部署，不需要将 `node_modules`、`.local` 或测试截图提交到仓库。

## 检查

```sh
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm audit
```

测试会验证知识 ID 和来源完整性、阶段拓扑、44 辅音和数字覆盖、IPA 独立性、四选一无歧义、同音配对排除、组合生成、前置解锁、错题重现上限、FSRS 每课单次结算、跨课程存档校验、备份损坏保护以及真实浏览器操作。浏览器测试生成的桌面和手机截图在 `.local/screenshots/`。

本次调研与方案取舍见 [MEDIA_AND_ROMANIZATION.md](docs/MEDIA_AND_ROMANIZATION.md)。录音维护脚本为 `node scripts/fetch-audio.mjs`（需要 ffmpeg，仅维护时联网，不参与构建）；原始文件在忽略目录 `.local/audio-originals/`，署名、原文件版本、校验和在 `src/data/recordings.json`。

本轮审查、Rush 的产品调研与算法证明见 [REVIEW_AND_RUSH.md](docs/REVIEW_AND_RUSH.md)。地名逐词核对结果见 [THAI_PLACE_AUDIT.json](docs/THAI_PLACE_AUDIT.json)。地图可用 `node scripts/fetch-thai-map.mjs` 重新生成，来源、ODbL 署名及可下载改编数据库在 `public/maps/`。

孟加拉文研究与来源取舍见 [BENGALI_RESEARCH.md](docs/BENGALI_RESEARCH.md)，本轮扩展及阿萨姆语边界见 [BENGALI_ASSAMESE_EXTENSION.md](docs/BENGALI_ASSAMESE_EXTENSION.md)。79 个词的证据与 IPA 状态见 [BENGALI_WORD_AUDIT.json](docs/BENGALI_WORD_AUDIT.json)，明确区分词典列出 IPA、词条转写和待审人工宽式音值，不宣称新增地名已获母语审定。地图重建：`node scripts/fetch-bengali-map.mjs`、`node scripts/build-india-map.mjs`；审校表重建：`node scripts/build-bengali-audit.mjs`。

转写输入的全量检查与兼容边界见 [TYPING_INPUT_AUDIT.md](docs/TYPING_INPUT_AUDIT.md)。后续语言文字课程的调研、优先级与待办见 [LANGUAGE_COURSE_TODO.md](docs/LANGUAGE_COURSE_TODO.md)，该规划不改变网页课程内容。

分支归属与角标核查见 [LANGUAGE_LABEL_AUDIT.md](docs/LANGUAGE_LABEL_AUDIT.md)。希伯来语的来源、教学取舍和验收边界见 [HEBREW_RESEARCH.md](docs/HEBREW_RESEARCH.md)，34 个词的词典版本及证据状态见 [HEBREW_WORD_AUDIT.json](docs/HEBREW_WORD_AUDIT.json)。审校表重建：`node scripts/audit-hebrew-words.mjs`；地图重建：`node scripts/build-hebrew-map.mjs`。

天城文研究、两分支选择及音值取舍见 [DEVANAGARI_RESEARCH.md](docs/DEVANAGARI_RESEARCH.md)，70 个词的版本与证据状态见 [DEVANAGARI_WORD_AUDIT.json](docs/DEVANAGARI_WORD_AUDIT.json)。审校表重建：`node scripts/audit-devanagari-words.mjs`；尼泊尔地图：`node scripts/build-nepal-map.mjs`。所有地图工作同时遵守 [MAP_POLICY.md](docs/MAP_POLICY.md)。

## 结构

```text
src/
  data/                 课程内容、阶段、来源和注册表
  lib/engine.ts         出题、解锁、错题重现、FSRS 结算
  lib/storage.ts        localStorage、版本和备份校验
  components/Quiz.tsx   初见、练习、反馈、完成页
  components/Pages.tsx  路径、图鉴、复习、记录、资料、设置
  types.ts              通用课程与学习数据结构
docs/
  CURRICULUM.md         课程设计、来源依据、调度边界
  ADDING_A_COURSE.md    新语言制作与验收模板
```

不采集学习数据，不上传进度。本地录音只请求本站文件；点击在线收听才将当前条目的原文带到 Google 翻译，不附带学习进度。系统合成语音是否联网取决于声音厂商。`localStorage` 的键为 `script-drill:v1`；复习完成记录、Rush 最高分、按课程提前解锁均兼容旧备份，同域名下的不同部署路径共享存档，浏览器或设备之间不自动同步。
