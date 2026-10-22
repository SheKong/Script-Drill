import { ExternalLink, LoaderCircle, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { courses } from '../data';
import { onlinePronunciation } from '../lib/speech';
import type { Knowledge } from '../types';
import { useCourseVoice } from './VoiceEnvironment';

let stopCurrent: (() => void) | undefined;

export function PronunciationButton({ item }: { item: Knowledge }) {
  const course = courses[item.courseId];
  const recording = item.pronunciation?.recording;
  const speech = item.pronunciation?.speech;
  const language = speech?.lang || course.locale;
  const voice = useCourseVoice(language);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [error, setError] = useState('');
  const [usingSpeech, setUsingSpeech] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const stop = useRef<() => void>(() => {});
  const watchdog = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generation = useRef(0);

  stop.current = () => {
    generation.current++;
    clearTimeout(watchdog.current);
    if (audio.current) {
      audio.current.pause();
      audio.current.removeAttribute('src');
      audio.current.load();
      audio.current = null;
    }
    if (utterance.current) {
      utterance.current = null;
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
    setUsingSpeech(false);
    if (stopCurrent === halt) stopCurrent = undefined;
  };
  const halt = useRef(() => stop.current()).current;
  useEffect(() => {
    setError('');
    setUsingSpeech(false);
    const onHidden = () => { if (document.hidden) halt(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      halt();
    };
  }, [item.id, halt]);

  if (!recording && !speech) return null;
  const canSpeak = !!(speech && voice && language && typeof SpeechSynthesisUtterance === 'function');
  const unavailable = !recording && !canSpeak;
  const onlineUrl = speech && course.onlineListening ? onlinePronunciation(speech.text, course.onlineListening.language) : undefined;
  const label = recording && !usingSpeech ? '真人发音' : '合成语音';
  const message = error;
  const source = course.sources.find(s => s.id === course.pronunciationReference);

  function play() {
    if (status !== 'idle') { halt(); return; }
    stopCurrent?.();
    stopCurrent = halt;
    setError('');
    setUsingSpeech(!recording);
    const token = ++generation.current;
    let tryingSpeech = !recording;
    const finish = () => { if (token === generation.current) halt(); };
    const fail = () => {
      if (token !== generation.current) return;
      if (!tryingSpeech && canSpeak) {
        tryingSpeech = true;
        if (audio.current) {
          audio.current.onplaying = audio.current.onended = audio.current.onerror = null;
          audio.current.pause();
          audio.current.removeAttribute('src');
          audio.current.load();
          audio.current = null;
        }
        clearTimeout(watchdog.current);
        setUsingSpeech(true);
        setError('录音暂时不可用，已尝试切换为匹配的设备语音。');
        setStatus('loading');
        watchdog.current = setTimeout(fail, 15000);
        speak();
        return;
      }
      halt();
      setError(tryingSpeech ? '设备语音播放失败，请重试或在线收听。'
        : `录音播放失败。请重试${onlineUrl ? '，或在线收听原文' : '或查看原始录音'}。`);
    };
    const started = () => {
      if (token !== generation.current) return;
      clearTimeout(watchdog.current);
      watchdog.current = setTimeout(fail, 45000);
      setStatus('playing');
    };
    const speak = () => {
      if (!speech || !canSpeak) { fail(); return; }
      try {
        const next = new SpeechSynthesisUtterance(speech.text);
        utterance.current = next;
        next.lang = language!;
        next.voice = voice!;
        next.rate = 0.85;
        next.onstart = started;
        next.onend = finish;
        next.onerror = fail;
        window.speechSynthesis.speak(next);
      } catch { fail(); }
    };
    setStatus('loading');
    watchdog.current = setTimeout(fail, 15000);
    if (recording) {
      try {
        const element = new Audio(recording.src);
        audio.current = element;
        element.onplaying = () => { if (!tryingSpeech) started(); };
        element.onended = finish;
        const recordingFailed = () => { if (!tryingSpeech) fail(); };
        element.onerror = recordingFailed;
        void element.play().catch(recordingFailed);
      } catch { fail(); }
    } else speak();
  }

  return <div className="pronunciation-control">
    {!unavailable && <button className="icon-button" type="button"
      aria-label={status === 'idle' ? label : '停止发音'} title={message || `${label}${speech ? ` · ${speech.label}` : ''}`}
      aria-pressed={status !== 'idle'} onClick={play}>
      {status === 'loading' ? <LoaderCircle size={20} className="audio-loading" />
        : status === 'playing' ? <Square size={18} /> : <Volume2 size={20} />}
    </button>}
    {onlineUrl && <a className="online-pronunciation" href={onlineUrl}
      target="_blank" rel="noreferrer" onClick={halt} title="在 Google 翻译中收听原文；需联网，会打开新页面">
      {course.onlineListening!.label}<ExternalLink size={13} />
    </a>}
    {message && <span className="audio-message" role="status">{message}
      {(recording || source) && <a href={recording?.sourceUrl || source?.url} target="_blank" rel="noreferrer">
        {recording ? '原始录音' : '发音资料'}<ExternalLink size={11} /></a>}
    </span>}
  </div>;
}
