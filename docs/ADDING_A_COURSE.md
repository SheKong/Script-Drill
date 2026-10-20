# 添加一种文字课程

原则：研究先于录入；课程内容、组合规则和界面元数据是数据，FSRS 和通用题型不需要按语言重写。

## 1. 研究包

为新课程先建立一份审校表，至少包括：

| 项目 | 必须记录 |
| --- | --- |
| 语言与书写系统 | 标准语/方言、文字方向、字形是否随位置变化 |
| 字音单位 | 字母、字母组合、音节、附标，而非机械按 Unicode 切分 |
| 转写方案 | 面向目标的主方案、可选规范方案及其不可逆性，惯用名和别名政策；不强制双转写 |
| IPA | 宽/严式、声调、重音、元音长短的取舍 |
| 形态变化 | 连写、上下标、独立/附属元音、尾音规则 |
| 来源 | 优先官方规范、大学课程、原始语言学研究与权威辞典 |
| 场景词 | 行政区划、主要城市、道路设施；逐词读音核查 |
| 音频 | 来源、说话人/口音、许可；无音频不得伪装已有真人录音 |

孟加拉文需考虑固有元音、元音附标、合字、尾部与固有元音脱落；阿拉伯文需考虑右到左、位置形、连接行为、短元音附标与常规不标元音文本。不能把泰文的占位替换模型直接认作这些语言的全部规则。

## 2. 一个课程文件

新建 `src/data/<course-id>.ts`，导出 `Course`。沿用现有 `thai.ts` 的数据工厂方式，但所有事实必须重新研究。必须填写：

```ts
import type { Course, Knowledge, Unit } from '../types';

// items 与 units 由已审定的教学事实组成，不能使用猜测的读音。
const items: Knowledge[] = [];
const units: Unit[] = [];

export const newCourse: Course = {
  id: 'your-stable-id',
  type: 'script',
  title: '课程中文名',
  nativeTitle: '本族文字名称',
  scriptName: '文字中文名',
  scriptClass: 'your-font-class',
  direction: 'rtl', // 或 ltr；只作用于实际文字，不翻转中文界面
  locale: 'ar',     // 仅在核对了具体语言后设置
  englishTitle: 'SCRIPT NAME',
  iconGlyph: '一个代表字形',
  label: '课程短标签',
  description: '课程范围',
  notationNote: '转写、IPA 和变体的明确边界',
  romanizationName: '主转写方案名',
  officialRomanizationName: '实际采用的规范名称',
  ipaNote: '本课程 IPA 的取舍，如是否省略声调',
  referenceNotes: ['本课程自己的范围、转写约定与音频边界'],
  pronunciationReference: '发音资料的来源 ID', // 可选；须在课程 sources 中
  // 有字体变体时才配置；第一项为默认，不要求每种语言都有两种字体。
  scriptVariants: [
    { id: 'print', label: '印刷体', className: 'your-font-class' },
    { id: 'other', label: '另一字形', className: 'your-other-font-class' },
  ],
  items,
  units,
  sources: [],
};
```

代码块是结构模板，**不是可发布课程**；空课程不能通过课程验收。

## 3. 知识记录

- `id`：全项目唯一、发布后稳定。
- `courseId`：课程 ID。
- `kind`：`consonant`、`vowel`、`symbol`、`rule`、`word`、`number`。
- `glyph`：完整的书写单位，可以是字母组合，不必是单个字符。
- `roman`：本课程主转写。泰语用 RTGS；IPA 课程使用发音特征名称，不伪造转写。载体声母的空转写显示为“不写”。
- `ipa`：已核对的音值；无读音的数值练习可为空。
- `officialRoman`：可选的规范转写。不要默认规范名就是 RTGS。
- `explanation`：初见所需说明，特别写清上下文条件、反例和局限。
- `sources`：在本课程来源表中确实存在的 ID。
- `requires`：真实先修知识，不仅是表面出现的字符。
- `segments`：可选的、人工核对的词内结构，不靠字符替换推断。
- `aliases`：输入可接受别名，只添加真的合理变体。
- `conventionalNames`：地图等语境中的惯用拉丁名称，与主转写分别展示，也可输入匹配；不把它们误标成规范方案。
- `pronunciation.recording`：可选的真人录音，包含本地 `src`、`title`、`sourceUrl`、`author`、`license`、`licenseUrl`；必须先核对音值与许可。语言词语、字母名称或例词另记 `spokenText`，与 `speech.text` 保持一致，保证本地录音、设备合成和在线收听是同一示范范围；共享例词可复用同一文件。
- `pronunciation.speech`：可选的 `{ text, label, lang? }`。必须显式指定可读原文和示范范围，例如“字母名称，非孤立辅音”或“元音例词”；不自动朗读字母/占位符/IPA。`lang` 缺省取课程 `locale`，浏览器没有同语言声音就明确降级，不使用英语声音。

抽象规则使用 `rulePrompt`、`ruleAnswer`、3 个 `ruleChoices` 表达一个已审定的判断；这属于知识编写，而不是在出题组件中插入语言分支。

每个非词汇知识恰好出现在一个 `Unit` 中。所有先修在总阶段顺序中必须位于其前方；允许同单元中的后续知识依赖前面知识，出题器会等下一小课已完成练习后再引入。

## 4. 可选的组合生成

没有审定组合语法时，**不配置** `composition`。双向题、配对、词汇解锁与 FSRS 仍然工作。

当前受限组合器适用于已核对的“一个辅音替换一个占位符”的结构：

```ts
composition: {
  vowelIds: ['course-vowel-1', 'course-vowel-2'],
  excludedConsonantIds: ['course-context-dependent-letter'],
}
```

元音 glyph 必须恰有一个 `◌`，组合音值必须真能由声母音值和所记元音拼合。连写、合字、同化、固有元音脱落、重排、带尾音变形等若不能满足这些前提，必须改用人工审定的组合知识或单独经过测试的语言适配器，不能强行使用通用拼接。

## 5. 注册和字体

1. 在 `src/data/index.ts` 中导入并加入 `courses`。
2. 在 `src/main.tsx` 导入有许可且覆盖该文字的本地字体。
3. 在 `styles.css` 添加与 `scriptClass` 对应的字体样式和合适行高。
   泰语的两种字体只由其 `scriptVariants` 数据配置；其他课程不继承泰语字形、RTGS 或声调说明。连写文字应保留完整文本节点，不能为了对照或标记而逐字符拆成 span。
4. 用实际 `rtl` 文本检查字形、标点和拉丁转写的混排；已有字形展示节点设置了独立方向与语言，不翻转整个学习 UI。
5. 来源注册到 `src/data/sources.ts`，并放进课程 `sources` 列表。

课程切换器、备份 ID 校验、图鉴、双向题、复习与进度记录自动读取注册表。无需新增 CourseId 枚举或修改 FSRS。新语言不自动继承泰语的组合配置、声调类别或街景照片。

## 6. 验收门槛

```sh
npm run check
npm run test:e2e
```

此外为新文字补充：

- 同音异形、同形异音和条件变体测试，四选一每题必须有且仅有一个正确答案。
- 从零按真实答题流程走完所有阶段，不可依赖人工篡改进度解锁。
- 每个词的声母、元音、尾音、隐含知识、特殊分音节都在前置图里。
- 相同标签或相同声音不会在唯一对应配对中产生歧义。
- 宽窄屏字形不截断，附标不被行高裁掉，RTL 与数字混排不颠倒。
- 原生或可信审校者对全量内容的独立审读。
- 真实语言音频若尚未就绪，明确显示边界，不使用其他语言 TTS 充当该音。
- 图鉴/练习中的字形切换、RTL 的完整 shaping、音频停止/失败/无匹配语音，以及录音署名。

## 7. 已发布数据的变更

存档使用稳定知识 ID。修正读音或题型可以保留 ID；删除或改变知识含义属于迁移事项。当前 v1 对未知 ID 采用保护性拒绝读取，原始存档不被覆盖；新增已注册课程不影响旧 ID。正式删除知识前，应先增加显式版本迁移，而不是要求用户无提示丢失进度。

已有未完成练习在读取时用知识 ID 更新转写标签、输入答案及组合读音，不改变题序、正确项 ID、作答统计或 FSRS。此逻辑不含泰语 ID 分支。保留旧转写兼容输入时应使用 `aliases`，不要把旧方案再放回主教学界面。
