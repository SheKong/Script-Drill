import { ExternalLink, LoaderCircle, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { courses } from '../data';
import { selectVoice } from '../lib/speech';
import type { Knowledge } from '../types';

let stopCurrent: (() => void) | undefined;

export function PronunciationButton({ item }: { item: Knowledge }) {
  const course = courses[item.courseId];
  const recording = item.pronunciation?.recording;
  const speech = item.pronunciation?.speech;
  const language = speech?.lang || course.locale;
  const [voice, setVoice] = useState<SpeechSynthesisVoice>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const stop = useRef<() => void>(() => {});
  const watchdog = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generation = useRef(0);

  useEffect(() => {
    if (!speech || !language || !('speechSynthesis' in window)) return;
    const check = () => setVoice(selectVoice(window.speechSynthesis.getVoices(), language));
    check();
    window.speechSynthesis.addEventListener('voiceschanged', check);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', check);
  }, [speech, language]);

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
    if (stopCurrent === halt) stopCurrent = undefined;
  };
  const halt = useRef(() => stop.current()).current;
  useEffect(() => {
    setError('');
    const onHidden = () => { if (document.hidden) halt(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      halt();
    };
  }, [item.id, halt]);

  if (!recording && !speech) return null;
  const unavailable = !recording && (!voice || !language || typeof SpeechSynthesisUtterance !== 'function');
  const label = recording ? '真人发音' : `合成语音 · ${speech!.label}`;
  const message = error || (unavailable ? `当前浏览器没有${language || '该语言'}语音，无法合成` : '');
  const source = course.sources.find(s => s.id === course.pronunciationReference);

  function play() {
    if (status !== 'idle') { halt(); return; }
    stopCurrent?.();
    stopCurrent = halt;
    setError('');
    const token = ++generation.current;
    const finish = () => { if (token === generation.current) halt(); };
    const fail = () => {
      if (token !== generation.current) return;
      halt();
      setError(recording ? '录音播放失败，请重试或查看原始录音' : '语音合成失败，请重试或查看发音资料');
    };
    setStatus('loading');
    watchdog.current = setTimeout(fail, 15000);
    if (recording) {
      const element = new Audio(recording.src);
      audio.current = element;
      element.onplaying = () => {
        if (token !== generation.current) return;
        clearTimeout(watchdog.current);
        setStatus('playing');
      };
      element.onended = finish;
      element.onerror = fail;
      void element.play().catch(fail);
    } else if (speech && language && voice) {
      try {
        const next = new SpeechSynthesisUtterance(speech.text);
        utterance.current = next;
        next.lang = language;
        next.voice = voice;
        next.rate = 0.85;
        next.onstart = () => {
          if (token !== generation.current) return;
          clearTimeout(watchdog.current);
          setStatus('playing');
        };
        next.onend = finish;
        next.onerror = fail;
        window.speechSynthesis.speak(next);
      } catch { fail(); }
    }
  }

  return <div className="pronunciation-control">
    <button className="icon-button" type="button" disabled={unavailable && status === 'idle'}
      aria-label={status === 'idle' ? label : '停止发音'} title={message || label}
      aria-pressed={status !== 'idle'} onClick={play}>
      {status === 'loading' ? <LoaderCircle size={20} className="audio-loading" />
        : status === 'playing' ? <Square size={18} /> : <Volume2 size={20} />}
    </button>
    <span className="pronunciation-label">{label}</span>
    {message && <span className="audio-message" role="status">{message}
      {(recording || source) && <a href={recording?.sourceUrl || source?.url} target="_blank" rel="noreferrer">
        {recording ? '原始录音' : '发音资料'}<ExternalLink size={11} /></a>}
    </span>}
  </div>;
}
