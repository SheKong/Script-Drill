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
- **泰语文字课**：19 个单元，117 个字母、结构与规则知识，51 个地名和街景词汇。覆盖传统 44 辅音、元音及常见变形、尾音、隐含元音、基础声调规则、特殊拼写与数字。
- 数据驱动的双向四选一、唯一对应配对、受限语法生成的声母元音拼读、词义反选、转写输入。
- 首次词汇先练转写，答后提供含义；词义反向与输入仅在已初见词的练习中出现。
- FSRS 间隔调度、小批量引入、前置知识解锁、课内错题间隔重现。
- 可搜索图鉴、学习记录、本地备份导入导出、刷新续学、手机布局。
- 备份校验、损坏数据保护、无题可练状态、浏览器缺少语音的明确降级。

## 重要边界

1. 泰文的教学转写和 RTGS 分栏呈现，`จ → j /tɕ/` 不被误标成官方 RTGS；RTGS 对应 `ch`。
2. 泰语**词汇 IPA 均未标声调**。这不等于泰语没有声调；课程单独讲解声调计算框架。
3. IPA 学习的是**符号与发音特征**，没有虚构一套“通用英文转写”。它是入门选集，不是完整 IPA 发音资格训练。
4. 未打包真人音频。IPA 提供协会真人音表的外链；泰文词语可使用浏览器已安装的相应语言合成语音，合成语音不是人工审定录音。
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
npx playwright install chromium
npm run test:e2e
npm audit
```

测试会验证知识 ID 和来源完整性、阶段拓扑、44 辅音和数字覆盖、IPA 独立性、四选一无歧义、同音配对排除、组合生成、前置解锁、错题重现上限、FSRS 每课单次结算、跨课程存档校验、备份损坏保护以及真实浏览器操作。浏览器测试生成的桌面和手机截图在 `.local/screenshots/`。

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

不采集学习数据，不上传进度。`localStorage` 的键为 `script-drill:v1`；同域名下的不同部署路径共享这一份存档，浏览器或设备之间不自动同步。
