# 字体、发音与地图转写决策

核对日期：2026-10-20。

## 为什么取消双转写主线

旧版“教学转写”是项目自定义的读音提示：例如 `aa /aː/`、`aw /ɔː/`、`j /tɕ/`。它既不是 RTGS，也不是 ISO 11940。它能辅助口头读音，但会让面向地图的学习者额外记忆 `baan → ban`、`jangwat → changwat` 等转换，而且并未完整标注声调，也不能替代 IPA。

本项目已保留 IPA，因此采用“RTGS 作为拉丁转写主线，IPA 补足读音，惯用地名另列”。不再同时考两套拉丁方案。旧输入保留为 `aliases`，稳定知识 ID 和 FSRS 进度不清空。

依据 [UNGEGN 泰语地名罗马化报告，2013 版](https://arhiiv.eki.ee/wgrs/rom1_th.pdf)：

- RTGS 是基于实际读音的非可逆转写，不是按 Unicode 替换字母。
- 不写声调，不区分元音长短：`นา /naː/ → na`。
- 部分音质/送气对立也合并：`จ /tɕ/` 与 `ช /tɕʰ/ → ch`，`/oː/` 与 `/ɔː/ → o`。所以题目继续使用“RTGS + IPA”，不能只比较 RTGS。
- 作为声门起始载体的 อ 不写；作为元音结构的一部分时按元音处理。
- 地名的词切分、隐含元音、静音字母等需要逐词核对，不能靠字符替换生成词答案。

Google Maps 不是 RTGS 规范的保证。课程将已核对惯用名放在 `conventionalNames`，例如 `เกาะ → ko / Koh`、`กรุงเทพ → Krung Thep / Bangkok`。这些不是“另一个完整教学方案”，而是具体地名的检索知识。旅游拼法参照 [泰国旅游局目的地资料](https://www.tourismthailand.org/Destinations)，不自动声称地图中的每个地点当前采用某个拼法。

## 字体排查

原站只提供 Noto Sans Thai（现代无圈风格），现加上 Noto Sans Thai Looped（传统有圈风格），默认传统，支持图鉴与练习切换、详情并排比较。字体来自 [Noto Thai 官方项目](https://github.com/notofonts/thai)，通过 Fontsource 自托管，保留 OFL 许可。

原 Noto Sans 网页子集不覆盖连音弧 U+0361 等字符。字体名称存在、`document.fonts.check()` 返回成功，都不能证明每个组合附标有字形。现使用 [Charis SIL](https://software.sil.org/charis/) 的完整字体，来源为 [Google Fonts 原始字体](https://github.com/google/fonts/tree/main/ofl/charissil)，无字符删减，仅转成 WOFF2，保留 OFL。检查其 cmap 包括 U+0361、U+035C、U+031A、U+25CC、IPA 扩展和调值字母。

音标展示节点显式使用该字体；正文中 `/…/` 和 `[…]` 的音标片段也采用它，减少基础字母与附标跨字体错位。单独附标配虚线圆，例如 `◌̚`。不拆分泰文、阿拉伯文等完整字形文本，避免破坏 shaping。

## 发音资源选择

### 当前实现

1. IPA：从 Wikimedia Commons 原文件页和 API 核对公开录音、作者及 CC 许可，下载并转为本地 MP3。文件版本、原文件 SHA-256、转换说明见 `src/data/recordings.json`；每条知识及资料页显示署名和许可链接。无音高、速度或剪辑改动。录音只代表该次示范，不是各语言中的所有语音实现。
2. 没有本地录音的 IPA 音值：保留 [国际语音协会真人交互表](https://www.internationalphoneticassociation.org/IPAcharts/inter_chart_2018/IPA_2018.html) 外链，不把英语 TTS 当成 IPA。
3. 泰语：通过 [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) 使用设备提供的泰语语音。词语、完整字母名称、明确元音例词由数据显式指定。字母名称不等于孤立辅音；有上下文的例词也不是纯元音录音。
4. 匹配语言后优先本地声音；缺少匹配声音时显示原因和资料入口，不回退英语。处理异步声音列表、15 秒启动超时、播放失败、停止按钮、切换条目和页面隐藏时停止。全站只允许一个发音任务。
5. 不预加载音频，无自动播放。真人录音走同源静态文件；合成声音是否联网取决于浏览器/操作系统厂商。不会把学习进度上传给语音服务。

Commons 原文件信息是许可和作者的一手来源，但不能替代专业语音审听。部分历史元音录音的作者字段标记为推定署名，清单保留这一不确定性；后续更换素材须重新核对。

### 云端 TTS 取舍

已核对官方支持列表：[Azure Speech 语言支持](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)、[Google Cloud Text-to-Speech 语音列表](https://cloud.google.com/text-to-speech/docs/voices)。均列有泰语，可作为以后统一发音的候选，但本次不接入：

- 当前为无账号、无后端、无密钥的静态站，不能把云端服务密钥放进前端。
- 正式接入需服务端代理、限流/预算、缓存、隐私说明和当前使用条款核对。
- 不采用 Google Translate 等未文档化免费音频接口，也不把需要登录/付费的发音平台当成可任意转载资源。
- 没有接入云 API，没有验证其实际合成质量，也不承诺免费额度或具体价格。

下一步若要保证所有手机都能听泰语，应优先补充审定的本地真人录音，或在有后端后统一生成、审校并合法缓存 TTS；浏览器合成不能保证每台设备都有泰语声音。

## 通用模板边界

新增字段均为可选：课程的 `romanizationName`、`ipaNote`、`referenceNotes`、`scriptVariants`，知识的 `conventionalNames` 和 `pronunciation`。通用界面与 FSRS 不按 Thai ID 分支；组合器仍仅用于课程明确批准的单占位语法。孟加拉文/阿拉伯文可不配置组合器或字形变体，使用其自身方向、字体、转写及音频，不继承 RTGS 和泰语声调说明。
