import { useCallback, useEffect, useState } from 'react';
import { Headphones, RefreshCw } from 'lucide-react';
import { selectVoice } from '../lib/speech';
import type { Course } from '../types';
import { VoiceHelp } from './VoiceHelp';

export const VOICE_RECHECK = 'script-drill:voice-recheck';
export function useCourseVoice(language?: string) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice>();
  const recheck = useCallback(() => {
    setVoice(language && window.speechSynthesis
      ? selectVoice(window.speechSynthesis.getVoices(), language) : undefined);
  }, [language]);
  useEffect(() => {
    recheck();
    window.speechSynthesis?.addEventListener('voiceschanged', recheck);
    window.addEventListener(VOICE_RECHECK, recheck);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', recheck);
      window.removeEventListener(VOICE_RECHECK, recheck);
    };
  }, [recheck]);
  return voice;
}

export function VoiceEnvironment({ course }: { course: Course }) {
  const voice = useCourseVoice(course.locale);
  if (!course.items.some(item => item.pronunciation?.speech)) return null;
  return <section className="voice-environment">
    <h2><Headphones size={17} />发音环境</h2>
    <p role="status">{voice ? `已检测到匹配语音：${voice.name || voice.lang}`
      : course.items.some(item => item.pronunciation?.recording) ? '设备语音暂不可用。已有录音仍可播放，也可在线收听。'
      : '设备语音暂不可用，可在词条中在线收听。'}</p>
    {course.voiceHelp === 'thai' ? <VoiceHelp available={!!voice} recheck={() => window.dispatchEvent(new Event(VOICE_RECHECK))} />
      : <button className="text-button" onClick={() => window.dispatchEvent(new Event(VOICE_RECHECK))}><RefreshCw size={14} />重新检测语音</button>}
  </section>;
}
