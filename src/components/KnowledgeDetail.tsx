import { BookOpen, Check, ExternalLink, Headphones, LockKeyhole, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { courses, itemMap } from '../data';
import { sources } from '../data/sources';
import { trained } from '../lib/engine';
import type { AppState, Knowledge } from '../types';

export function SpeechButton({ item }: { item: Knowledge }) {
  const course = courses[item.courseId];
  const language = course.locale?.split('-')[0];
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const check = () => setAvailable(!!language && speechSynthesis.getVoices().some(v => v.lang.toLowerCase().split('-')[0] === language.toLowerCase()));
    check();
    speechSynthesis.addEventListener('voiceschanged', check);
    return () => speechSynthesis.removeEventListener('voiceschanged', check);
  }, [language]);
  if (!course.locale || item.kind !== 'word') return null;
  return <button className="icon-button" disabled={!available}
    title={available ? '听词语（浏览器合成语音）' : '浏览器未安装相应语言语音'}
    aria-label={available ? '听词语' : '浏览器未安装相应语言语音'}
    onClick={() => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.glyph);
      utterance.lang = course.locale!;
      utterance.voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().split('-')[0] === language?.toLowerCase()) || null;
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }}><Volume2 size={20} /></button>;
}

export function KnowledgeDetail({ item, state, compact = false, hideMeaning = false }: {
  item: Knowledge; state: AppState; compact?: boolean; hideMeaning?: boolean;
}) {
  const course = courses[item.courseId];
  return <div className={`knowledge-detail ${compact ? 'compact' : ''}`}>
    {!compact && <div className="detail-symbol">
      <span className={course.scriptClass} dir={course.direction} lang={course.locale}>{item.glyph}</span>
      <SpeechButton item={item} />
    </div>}
    <div className="detail-title">
      <span className="eyebrow">{item.group}</span>
      {!(hideMeaning && item.kind === 'word') && <h3>{item.title}</h3>}
    </div>
    {item.kind !== 'rule' && <div className="reading-grid">
      {course.type === 'script' && <div><span>{item.kind === 'number' ? '数值' : '教学转写'}</span><strong>{item.roman}</strong></div>}
      {item.ipa && <div><span>{course.type === 'phonetics' ? 'IPA' : item.kind === 'word' ? '宽式 IPA' : 'IPA'}</span><strong className="phonetic">/{item.ipa}/</strong></div>}
      {course.type === 'phonetics' && <div><span>发音特征</span><strong>{item.title}</strong></div>}
      {item.officialRoman && item.kind !== 'number' && <div><span>{course.officialRomanizationName || '规范转写'}</span><strong>{item.officialRoman}</strong></div>}
    </div>}
    {course.type === 'phonetics' && item.kind === 'symbol' && <a className="ipa-audio-link" href={sources.find(s => s.id === 'ipa-audio')!.url} target="_blank" rel="noreferrer"><Headphones size={14} />协会真人发音表<ExternalLink size={11} /></a>}
    <p className="explanation">{item.explanation}</p>
    {item.class && <div className="detail-facts">
      <span>{item.class}类辅音</span>
      {item.final && <span>尾音 <b className="phonetic">/{item.final}/</b></span>}
      {item.obsolete && <span>历史字母 · 非高频</span>}
    </div>}
    {item.segments && <div className="segment-section">
      <span className="eyebrow">拆开看看</span>
      <div className="segments">{item.segments.map((s, i) => <div key={i}>
        <strong className={course.scriptClass} dir={course.direction} lang={course.locale}>{s.text}</strong><span>{s.reading}</span>{s.note && <small>{s.note}</small>}
      </div>)}</div>
    </div>}
    {!compact && item.requires.length > 0 && <div className="prerequisites">
      <span className="eyebrow">前置知识</span>
      <div>{item.requires.map(id => <span key={id} title={itemMap[id]?.title} className={trained(id, state.progress) ? 'is-trained' : ''}>
        {trained(id, state.progress) ? <Check size={12} /> : <LockKeyhole size={12} />}
        {itemMap[id]?.kind === 'rule' ? itemMap[id].title : itemMap[id]?.glyph}
      </span>)}</div>
    </div>}
    <div className="detail-sources"><BookOpen size={13} />
      {item.sources.map(id => sources.find(s => s.id === id)).filter(Boolean).map(s =>
        <a key={s!.id} href={s!.url} target="_blank" rel="noreferrer">{s!.organization.split(' · ')[0]}<ExternalLink size={10} /></a>,
      )}
    </div>
  </div>;
}
