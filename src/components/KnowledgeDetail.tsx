import { BookOpen, Check, ExternalLink, Headphones, LockKeyhole } from 'lucide-react';
import { courses, itemMap } from '../data';
import { trained } from '../lib/engine';
import type { AppState, Knowledge } from '../types';
import { PronunciationButton } from './PronunciationButton';
import { ScriptComparison } from './ScriptVariants';
import { NotationText } from './NotationText';

export function KnowledgeDetail({ item, state, compact = false, hideMeaning = false, scriptClass }: {
  item: Knowledge; state: AppState; compact?: boolean; hideMeaning?: boolean; scriptClass?: string;
}) {
  const course = courses[item.courseId];
  const glyphClass = scriptClass || course.scriptClass;
  const audioReference = course.sources.find(source => source.id === course.pronunciationReference);
  return <div className={`knowledge-detail ${compact ? 'compact' : ''}`}>
    {!compact && <div className="detail-symbol">
      <span className={glyphClass} dir={course.direction} lang={course.locale}>{item.glyph}</span>
    </div>}
    {!compact && item.kind !== 'rule' && <ScriptComparison course={course} text={item.glyph} />}
    {!compact && <PronunciationButton item={item} />}
    <div className="detail-title">
      <span className="eyebrow">{item.group}</span>
      {!(hideMeaning && item.kind === 'word') && <h3>{item.title}</h3>}
    </div>
    {item.kind !== 'rule' && <div className="reading-grid">
      {course.type === 'script' && <div><span>{item.kind === 'number' ? '数值' : course.romanizationName || '转写'}</span><strong>{item.roman || '不写'}</strong></div>}
      {item.ipa && <div><span>{course.type === 'phonetics' ? 'IPA' : item.kind === 'word' ? '宽式 IPA' : 'IPA'}</span><strong className="phonetic">/{item.ipa}/</strong></div>}
      {course.type === 'phonetics' && <div><span>发音特征</span><strong>{item.title}</strong></div>}
      {item.officialRoman && item.officialRoman !== item.roman && item.kind !== 'number' && <div><span>{course.officialRomanizationName || '规范转写'}</span><strong>{item.officialRoman}</strong></div>}
    </div>}
    {!!item.conventionalNames?.length && <p className="conventional-names">地图常见拼法：<strong>{item.conventionalNames.join(' / ')}</strong></p>}
    {item.ipa && course.ipaNote && <p className="reading-note">{course.ipaNote}</p>}
    {course.type === 'phonetics' && item.kind === 'symbol' && audioReference && <a className="ipa-audio-link" href={audioReference.url} target="_blank" rel="noreferrer"><Headphones size={14} />真人发音资料<ExternalLink size={11} /></a>}
    <p className="explanation"><NotationText text={item.explanation} /></p>
    {item.class && <div className="detail-facts">
      <span>{item.class}类辅音</span>
      {item.final && <span>尾音 <b className="phonetic">/{item.final}/</b></span>}
      {item.obsolete && <span>历史字母 · 非高频</span>}
    </div>}
    {item.segments && <div className="segment-section">
      <span className="eyebrow">拆开看看</span>
      <div className="segments">{item.segments.map((s, i) => <div key={i}>
        <strong className={glyphClass} dir={course.direction} lang={course.locale}>{s.text}</strong><span><NotationText text={s.reading} /></span>{s.note && <small>{s.note}</small>}
      </div>)}</div>
    </div>}
    {!compact && item.requires.length > 0 && <div className="prerequisites">
      <span className="eyebrow">前置知识</span>
      <div>{item.requires.map(id => <span key={id} title={itemMap[id]?.title} className={trained(id, state.progress) ? 'is-trained' : ''}>
        {trained(id, state.progress) ? <Check size={12} /> : <LockKeyhole size={12} />}
        {itemMap[id]?.kind === 'rule' ? itemMap[id].title : <span className={glyphClass} dir={course.direction} lang={course.locale}>{itemMap[id]?.glyph}</span>}
      </span>)}</div>
    </div>}
    <div className="detail-sources"><BookOpen size={13} />
      {item.sources.map(id => course.sources.find(s => s.id === id)).filter(Boolean).map(s =>
        <a key={s!.id} href={s!.url} target="_blank" rel="noreferrer">{s!.organization.split(' · ')[0]}<ExternalLink size={10} /></a>,
      )}
    </div>
    {item.pronunciation?.recording && <p className="audio-credit">
      录音：<a href={item.pronunciation.recording.sourceUrl} target="_blank" rel="noreferrer">{item.pronunciation.recording.author}</a>
      {' · '}<a href={item.pronunciation.recording.licenseUrl} target="_blank" rel="noreferrer">{item.pronunciation.recording.license}</a>
    </p>}
  </div>;
}
