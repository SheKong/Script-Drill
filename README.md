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
- **泰语文字课**：19 个单元，118 个字母、结构与规则知识，51 个地名和街景词汇。覆盖传统 44 辅音、元音及常见变形、尾音、隐含元音、基础声调规则、特殊拼写与数字。
- 数据驱动的双向四选一、唯一对应配对、受限语法生成的声母元音拼读、词义反选、转写输入。
- 首次词汇先练转写，答后提供含义；词义反向与输入仅在已初见词的练习中出现。
- FSRS 间隔调度、小批量引入、前置知识解锁、课内错题间隔重现。
- 可搜索图鉴、学习记录、本地备份导入导出、刷新续学、手机布局。
- 备份校验、损坏数据保护、无题可练状态、音频故障时的重试、在线收听与系统语音安装指引。
- 传统有圈体与现代无圈体切换、详情并排对照；完整 Charis SIL 字体覆盖连音弧和 IPA 附标，不依赖手机补字。
- 本地真人 IPA 录音 63 条（覆盖 64 个音值中的 63 个）、泰语录音 15 条（共享例词后覆盖 18 个条目），含逐条作者与许可；未收录的泰语提供匹配语言的设备语音，以及带原文的 Google / Bing 在线收听入口。

## 重要边界

1. 泰文主线只学 **RTGS + IPA**，地图惯用拼法另列。`จ → ch /tɕ/` 与 `ช → ch /tɕʰ/` 用 IPA 区分；不再要求额外背自定义教学转写。旧输入作为兼容别名保留。
2. 泰语**词汇 IPA 均未标声调**。这不等于泰语没有声调；课程单独讲解声调计算框架。
3. IPA 学习的是**符号与发音特征**，没有虚构一套“通用英文转写”。它是入门选集，不是完整 IPA 发音资格训练。
4. 公开授权的 IPA 和已收录泰语真人音频随站点提供，不需要安装语音包。未收录 IPA 可查看协会及 Seeing Speech 原站。泰语未覆盖条目使用可选设备语音或在线翻译网站的朗读，不调用未公开的 TTS API，也不把密钥放进前端。Windows / Android / Apple 安装步骤、官方说明和重新检测入口在发音控件的「语音安装与排查」中；系统装好声音不保证浏览器可用。字母名称/元音例词不是孤立音，TTS 不是人工审定录音。
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

不采集学习数据，不上传进度。本地录音只请求本站文件；点击在线收听才将当前条目的泰文带到所选 Google / Bing 页面，不附带学习进度。系统合成语音是否联网取决于声音厂商。`localStorage` 的键为 `script-drill:v1`；同域名下的不同部署路径共享这一份存档，浏览器或设备之间不自动同步。
