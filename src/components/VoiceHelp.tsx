import { ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { voicePlatform, type VoicePlatform } from '../lib/speech';

export function VoiceHelp({ recheck, available }: { recheck: () => void; available: boolean }) {
  const [platform, setPlatform] = useState<VoicePlatform>(() => voicePlatform(navigator.userAgent));
  const [checked, setChecked] = useState(false);
  return <details className="voice-help">
    <summary>语音安装与排查</summary>
    <p>本站录音不需要语音包；未收录的条目可用「在线听泰语」，在打开的页面点泰文下方的扬声器。扬声器按钮只在有录音或可用设备语音时出现。播放字母名或元音例词时，按钮悬停提示会标明示范内容。</p>
    <label className="voice-platform">设备系统<select aria-label="语音帮助的设备系统" value={platform}
      onChange={event => setPlatform(event.target.value as VoicePlatform)}>
      <option value="windows">Windows 10 / 11</option><option value="android">Android</option>
      <option value="apple">iPhone / iPad / Mac</option><option value="other">其他系统</option>
    </select></label>
    {platform === 'windows' && <>
      <ol><li>打开系统「设置 → 时间和语言 → 语音」。</li>
        <li>在「管理语音 → 添加语音」中选择「泰语 / Thai」并下载（Pattara）。仅添加泰语键盘不等于安装语音。</li>
        <li>下载完成后完全退出并重开浏览器，再重新检测。</li></ol>
      <a href="https://support.microsoft.com/en-us/windows/appendix-a-supported-languages-and-voices-4486e345-7730-53da-fcfe-55cc64300f01" target="_blank" rel="noreferrer">Microsoft 官方安装说明<ExternalLink size={12} /></a>
    </>}
    {platform === 'android' && <>
      <ol><li>在系统设置中搜索「文字转语音」或「文本转语音输出」。</li>
        <li>打开首选引擎的设置，查找「安装语音数据 → 泰语 / Thai」。不同品牌和引擎的菜单、可用语言不同。</li>
        <li>下载后重启浏览器并重新检测；若没有泰语选项，直接使用在线收听。</li></ol>
      <a href="https://support.google.com/accessibility/android/answer/6006983?hl=zh-Hans" target="_blank" rel="noreferrer">Google 官方语音设置说明<ExternalLink size={12} /></a>
    </>}
    {platform === 'apple' && <>
      <p>iPhone / iPad：在「设置 → 辅助功能」的「朗读内容」（部分版本为「朗读与语音」）中打开「声音 → 泰语」并下载。Mac：在「系统设置 → 辅助功能」中查找「朗读与语音 / 朗读内容」，在系统声音中添加泰语。菜单随系统版本变化；没有泰语选项时使用在线收听。</p>
      <a href="https://support.apple.com/guide/mac-help/change-the-voice-your-mac-uses-to-speak-text-mchlp2290/mac" target="_blank" rel="noreferrer">Apple 官方声音下载说明<ExternalLink size={12} /></a>
      {' · '}<a href="https://support.apple.com/en-us/111798" target="_blank" rel="noreferrer">iPhone / iPad 官方说明<ExternalLink size={12} /></a>
    </>}
    {platform === 'other' && <p>语音由系统与浏览器共同提供，无法从网页直接安装。可直接在线收听，或在另一台设备上使用本站录音。</p>}
    <p>安装成功也不保证当前浏览器会提供该声音。若仍检测不到，可换浏览器，或继续使用录音与在线收听，无需反复安装。</p>
    <button className="text-button voice-recheck" type="button" onClick={() => { recheck(); setChecked(true); }}>
      <RefreshCw size={14} />重新检测语音
    </button>
    {checked && <p role="status">{available ? '已检测到泰语声音，可以尝试播放。' : '当前浏览器仍未提供泰语声音，请使用在线收听。'}</p>}
    <small>只有点击在线收听后，才会将本条泰文带到 Google 翻译；不会附带学习进度。在线服务需要联网，能否访问取决于所在网络。</small>
  </details>;
}
