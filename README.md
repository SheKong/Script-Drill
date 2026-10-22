# 字里 · Script Drill

面向 GeoGuessr 街景探索的文字学习网页。React、TypeScript、Vite，纯静态部署，无账号、无后台、无 API 密钥。

## 本地运行

需要 Node.js 24。

```sh
npm ci
npm run dev
```

默认地址为 `http://localhost:5173`。泰文与 IPA 字体随构建提供；中文使用操作系统字体，不依赖 Google Fonts 网络请求。

## 已实现

- **独立的国际音标基础课**：14 个单元，按通用语音学的发音部位、方法、清浊、元音坐标、附加符号与气流机制组织，不是某一语言的先修定制课。
- **泰语文字课**：19 个基础单元和 1 个词汇补充单元，119 个字母、结构与规则知识，38 个主线词汇。声调和辅音类别在开头说明，后续重点练习调号辨认，不要求计算完整声调。
- 数据驱动的双向四选一、唯一对应配对、受限语法生成的声母元音拼读、词义反选、转写输入。
- 首次词汇先练转写，答后提供含义；词义反向与输入仅在已初见词的练习中出现。
- FSRS 间隔调度、小批量引入、前置知识解锁、课内错题间隔重现。
- 每单元末尾有至少 30 题的综合复习，覆盖本单元全部知识与最多 16 个到期知识；可行时填满 5 对，输入题覆盖字母、元音结构和已学词。
- 主线词汇集中收尾，主线全部完成后显示祝贺页，不再隐式逐词追加短课。
- 简单 / 词汇 Rush：两分钟无限五对配对、三格轮换补位、防固定位置刷分、候选冷却、分课程和模式保存最高分。Rush 不改变 FSRS。
- 7 组地名额外课，覆盖 76 府、曼谷特别行政区和 13 个额外城市（共 83 个主线外词汇）；结课后加入词汇 Rush。
- 地名使用本地国家轮廓示意：行政区红面、城市红点；全部运行时地图路径约 40 KB，无在线底图依赖。
- 可搜索图鉴、学习记录、本地备份导入导出、刷新续学、手机布局。
- 备份校验、损坏数据保护、无题可练状态、音频故障时的重试、在线收听与系统语音安装指引。
- 传统有圈体与现代无圈体切换、详情并排对照；完整 Charis SIL 字体覆盖连音弧和 IPA 附标，不依赖手机补字。
- 本地真人 IPA 录音 63 条（覆盖 64 个音值中的 63 个）、泰语录音 15 条（共享例词后覆盖 18 个条目），含逐条作者与许可。只在有录音或匹配的 TTS 声音时显示扬声器；无声音时只保留 Google 在线收听。环境检测和安装帮助位于学习首页。

## 重要边界

1. 泰文主线只学 **RTGS + IPA**，地图惯用拼法另列。`จ → ch /tɕ/` 与 `ช → ch /tɕʰ/` 用 IPA 区分；不再要求额外背自定义教学转写。旧输入作为兼容别名保留。
2. 泰语**词汇 IPA 均未标声调**。开头解释五调与辅音类别的意义，后续练习认出调号；系统声调和口语训练请使用专门课程。
3. IPA 学习的是**符号与发音特征**，没有虚构一套“通用英文转写”。它是入门选集，不是完整 IPA 发音资格训练。
4. 公开授权的 IPA 和已收录泰语真人音频随站点提供，不需要安装语音包。未收录 IPA 可查看协会及 Seeing Speech 原站。泰语未覆盖条目使用可选设备语音或在线翻译网站的朗读，不调用未公开的 TTS API，也不把密钥放进前端。Windows / Android / Apple 安装步骤、官方说明和重新检测入口集中在学习首页；系统装好声音不保证浏览器可用。字母名/元音例词的示范范围在悬停提示中说明，TTS 不是人工审定录音。
5. 自动检查能验证内容结构、选项歧义和路径可达性，**不能替代语言专家对全部条目的独立审校**。正式对外发布前建议逐词复核，并补充人工审定的音频。

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

不采集学习数据，不上传进度。本地录音只请求本站文件；点击在线收听才将当前条目的原文带到 Google 翻译，不附带学习进度。系统合成语音是否联网取决于声音厂商。`localStorage` 的键为 `script-drill:v1`；新增复习完成记录与 Rush 最高分兼容旧备份，同域名下的不同部署路径共享存档，浏览器或设备之间不自动同步。
