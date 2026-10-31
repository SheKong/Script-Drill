# 转写输入全量检查

检查日期：2026-10-31。课程数量与覆盖统计来自本项目的课程注册表，不是外部语言学结论。

## 范围和结果

| 课程 | 知识条目总数 | 可生成填空题的条目 | 标准转写含附加符号 | 旧版不接受去符号标准转写 |
| --- | ---: | ---: | ---: | ---: |
| 国际音标 | 76 | 0 | 不适用 | 不适用 |
| 泰语 | 240 | 214 | 0 | 0 |
| 孟加拉语 | 136 | 127 | 58 | 30 |

“可生成填空题”按实际出题条件统计：文字类课程、非规则、标准转写非空；包括主线、补充词汇和全部地名额外课。数字题仍输入数字；泰语零声母没有标准转写，不强制出空答案题。IPA 课不新增虚构的英文字母转写输入题。

旧版虽然已经接受部分无符号的历史别名，却没有统一支持规范转写的去符号形式。58 个含附加符号的条目中，有 30 个条目的去符号标准转写会被拒绝，已统一修复。不能把“已有 ng 等读音别名”当成已经支持 ṁ → m。

## 输入规则

- 保留课程原有 RTGS / UNGEGN 和 IPA 展示，不将简化输入称为另一套标准转写。
- 输入先做 Unicode NFD 分解、忽略组合附加符号和大小写，再忽略空格、连字符、撇号、句点；预组合和分解编码结果相同。
- 弯撇号 U+2018/U+2019、连字符 U+2010/U+2011 与常见 ASCII 写法均可使用。
- 标准转写、原有 `officialRoman` 兼容字段、历史别名、地图惯用名共用同一组接受规则。
- 明确枚举每个条目的可接受拼法；大小写与分隔符的组合无限，不逐个穷举，统一说明省略规则。
- 不做编辑距离、模糊发音或任意删字符。未知拼法、额外字母、斜线等仍会判错；空白、纯标点或只有组合附标的输入不会判对。
- 泰语历史别名中的中文“（短）”说明、`rue / ri` 等兼容字符串没有作为标准答案，不要求用户输入它们；每个现有可填空条目都另有普通字母或数字可输入形式。

### 有意放宽的边界

孟加拉文历史别名中存在 `ô`。由于历史别名也按同一规则去附加符号，`ô` 现在还接受 `o`，例如 `bn-a`。这是明确的兼容行为，不是把孟加拉语固有元音规则改成“永远读 o”；教学读音仍以 IPA 和上下文为准。

去附加符号会合并部分原本不同的转写字母，这是本次输入宽容规则的预期结果。四选一、反选和配对仍使用原有规范表示和音值去歧义逻辑。

## 全部特殊转写覆盖

下列为含附加符号的标准转写条目，未只抽查某几个例子：

- 辅音和鼻音符号（12）：`bn-ng`、`bn-y`、`bn-ny`、`bn-retro-t`、`bn-retro-th`、`bn-retro-d`、`bn-retro-dh`、`bn-retro-n`、`bn-flap`、`bn-flap-h`、`bn-ss`、`bn-anusvara`。
- 元音和附标（9）：`bn-aa-sign`、`bn-aa`、`bn-ii`、`bn-uu`、`bn-ii-sign`、`bn-uu-sign`、`bn-ri`、`bn-ri-sign`、`bn-ae-sign`。
- 合字（6）：`bn-retro-tt`、`bn-ngg`、`bn-nj`、`bn-st`、`bn-ksh`、`bn-jny`。
- 主线词汇（19）：`bn-word-naam`、`bn-word-gram`、`bn-word-para`、`bn-word-bajar`、`bn-word-rasta`、`bn-word-sorok`、`bn-word-nodi`、`bn-word-hospital`、`bn-word-thana`、`bn-word-jela`、`bn-word-bibhag`、`bn-word-dokkhin`、`bn-word-purbo`、`bn-word-cha`、`bn-word-dokan`、`bn-word-hotel`、`bn-word-bus`、`bn-word-bangla`、`bn-word-bangladesh`。
- 额外城市（12）：`bn-word-dhaka`、`bn-word-chattogram`、`bn-word-khulna`、`bn-word-rajshahi`、`bn-word-barishal`、`bn-word-sylhet`、`bn-word-rangpur`、`bn-word-mymensingh`、`bn-word-cumilla`、`bn-word-coxs-bazar`、`bn-word-jashore`、`bn-word-bogura`。

| 例子 | 原标准转写 | 普通字母形式 | 同时保留的其他输入举例 |
| --- | --- | --- | --- |
| ং | ṁ | m | ng |
| ঙ | ṅ | n | ng |
| য | j̱ | j | 历史 j |
| ঋ | ṛ | r | ri |
| ক্ষ | kṣh | ksh | kkh |
| বাংলা | bāṁlā | bamla | bangla |
| ঢাকা | ḍhākā | dhaka | Dacca |

`bamla` 是 `bāṁlā` 的去附加符号输入，不是把该词实际发音从 /baŋla/ 改成 /bamla/。

## 展示与测试

- 知识详情列出全部接受的拼法代表；忽略大小写的重复项不反复列出。
- 填空题答前只显示格式规则，不直接给出答案；点击“想一想”后显示拼法，仍计作使用提示。
- 填空题答后无论对错均显示全部接受的拼法，标准转写与 IPA 仍保留。
- 展示和判题共用 `acceptedTypedAnswers`，避免帮助文案与判题条件不一致。
- `src/lib/typing.test.ts` 对 341 个现有可填空条目逐项检查标准写法、历史别名、地图名、分解编码、纯字母形式、大小写/分隔符、错误输入；另外检查数字、额外课、IPA 出题边界与旧会话兼容。
- `tests/bengali.spec.ts` 在桌面 Chromium 和手机 WebKit 中逐题输入全部 58 个特殊标准转写的纯字母形式，验证判对、答后接受列表与实际保存结果；另测提示、知识详情和 320/390/1440 像素布局。

复验命令：

```sh
npm test
npm run build
npm run test:e2e
```
