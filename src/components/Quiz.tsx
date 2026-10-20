import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, CircleHelp, Flag, Lightbulb, RotateCcw, Sparkles, X } from 'lucide-react';
import { courses, itemMap } from '../data';
import { checkTyped, reading, shuffle } from '../lib/engine';
import type { AppState, Exercise, Session } from '../types';
import { KnowledgeDetail } from './KnowledgeDetail';
import { PronunciationButton } from './PronunciationButton';
import { useScriptStyle } from './ScriptVariants';
import { NotationText } from './NotationText';

interface Feedback { correct: boolean; pairs?: Record<string, boolean> }
export function Quiz({ state, onIntro, onAnswer, onPause }: {
  state: AppState;
  onIntro: () => void;
  onAnswer: (correct: boolean, hinted: boolean, pairs?: Record<string, boolean>) => void;
  onPause: () => void;
}) {
  const session = state.session!;
  const exercise = session.queue[session.index];
  const scriptStyle = useScriptStyle(courses[session.courseId]);
  return <QuizStep key={exercise.id} state={state} exercise={exercise} scriptStyle={scriptStyle} onIntro={onIntro} onAnswer={onAnswer} onPause={onPause} />;
}
function QuizStep({ state, exercise, scriptStyle, onIntro, onAnswer, onPause }: {
  state: AppState; exercise: Exercise; onIntro: () => void;
  scriptStyle: ReturnType<typeof useScriptStyle>;
  onAnswer: (correct: boolean, hinted: boolean, pairs?: Record<string, boolean>) => void; onPause: () => void;
}) {
  const session = state.session!;
  const course = courses[session.courseId];
  const { scriptClass, control } = scriptStyle;
  const item = itemMap[exercise.itemId];
  const [selected, setSelected] = useState('');
  const [typed, setTyped] = useState('');
  const [hinted, setHinted] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();
  const [left, setLeft] = useState('');
  const [matched, setMatched] = useState<string[]>([]);
  const [pairErrors, setPairErrors] = useState<Record<string, boolean>>({});
  const [wrongPair, setWrongPair] = useState('');
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rightPairs = useMemo(() => shuffle(exercise.pairs || []), [exercise.pairs]);
  const heading = useRef<HTMLHeadingElement>(null);
  const isIntro = exercise.kind === 'intro';
  const isMatch = exercise.kind === 'match';
  const canCheck = !!selected || !!typed.trim();
  const percentage = Math.round(session.index / session.queue.length * 100);
  useEffect(() => {
    heading.current?.focus();
    return () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); };
  }, []);
  const confirm = useCallback(() => {
    if (feedback) {
      onAnswer(feedback.correct, hintUsed, feedback.pairs); return;
    }
    if (isIntro) { onIntro(); return; }
    if (isMatch || !canCheck) return;
    setFeedback({ correct: exercise.kind === 'type' ? checkTyped(item, typed) : selected === exercise.answer });
  }, [feedback, hintUsed, onAnswer, isIntro, onIntro, isMatch, canCheck, exercise, item, typed, selected]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Escape') { onPause(); return; }
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); confirm(); }
      if (tag === 'INPUT' || feedback || isIntro || isMatch) return;
      const index = Number(e.key) - 1;
      if (index >= 0 && index < exercise.options.length) setSelected(exercise.options[index].id);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [confirm, onPause, feedback, isIntro, isMatch, exercise.options]);

  function matchRight(id: string) {
    if (!left || matched.includes(id) || feedback) return;
    if (id === left) {
      const next = [...matched, id]; setMatched(next); setLeft('');
      if (next.length === exercise.pairs!.length) {
        const results = Object.fromEntries(exercise.pairs!.map(p => [p.id, !pairErrors[p.id]]));
        setFeedback({ correct: Object.values(results).every(Boolean), pairs: results });
      }
    } else {
      setPairErrors(p => ({ ...p, [left]: true }));
      setWrongPair(id);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongPair(''), 650);
    }
  }
  return <div className="quiz-shell">
    <header className="quiz-header">
      <button className="icon-button" onClick={onPause} title="保存并退出" aria-label="保存并退出"><X size={22} /></button>
      <div className="quiz-progress" role="progressbar" aria-label="本课进度" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percentage}%` }} /></div>
      <span className="quiz-position">{session.index + 1}<span> / {session.queue.length}</span></span>
    </header>
    <main className="quiz-content">
      <div className="quiz-eyebrow">
        {isIntro ? <Sparkles size={15} /> : exercise.repair ? <RotateCcw size={15} /> : <Flag size={15} />}
        {isIntro ? '初次见面' : exercise.repair ? '再试一次' : isMatch ? '连接记忆' : exercise.kind === 'combine' ? '拼读组合' : '提取练习'}
        <span>{courses[session.courseId].title}</span>
      </div>
      <h1 ref={heading} tabIndex={-1}><NotationText text={exercise.prompt} /></h1>
      {control}
      {isIntro ? <KnowledgeDetail item={item} state={state} scriptClass={scriptClass} /> : <>
        {!isMatch && <div className={`question-display ${['read', 'combine', 'type'].includes(exercise.kind) ? `${scriptClass} large-glyph` : 'phonetic'}`} dir={['read', 'combine', 'type'].includes(exercise.kind) ? course.direction : 'ltr'} lang={['read', 'combine', 'type'].includes(exercise.kind) ? course.locale : undefined}>
          <span>{exercise.display}</span>
          {['read', 'type'].includes(exercise.kind) && <PronunciationButton item={item} />}
        </div>}
        {exercise.combination && <div className="combination-parts">{exercise.combination.parts.map(id => <span key={id} className={scriptClass} dir={course.direction} lang={course.locale}>{itemMap[id].glyph}</span>)}<small>拼读练习 · 不考词义{course.ipaNote && ` · ${course.ipaNote}`}</small></div>}
        {isMatch ? <div className="matching-grid">
          <div>{exercise.pairs!.map(p => <button key={p.id} disabled={matched.includes(p.id)}
            className={`match-button script-match ${scriptClass} ${left === p.id ? 'selected' : ''} ${matched.includes(p.id) ? 'matched' : ''}`}
            dir={course.direction} lang={course.locale}
            aria-pressed={left === p.id} onClick={() => setLeft(p.id)}>{p.left}{matched.includes(p.id) && <Check size={15} />}</button>)}</div>
          <div>{rightPairs.map(p => <button key={p.id} disabled={matched.includes(p.id) || !left}
            className={`match-button phonetic ${matched.includes(p.id) ? 'matched' : ''} ${wrongPair === p.id ? 'wrong' : ''}`}
            onClick={() => matchRight(p.id)}>{p.right}{matched.includes(p.id) && <Check size={15} />}</button>)}</div>
        </div> : exercise.kind === 'type' ? <div className="typed-answer">
          <label htmlFor="transcription">转写</label>
          <input id="transcription" value={typed} onChange={e => setTyped(e.target.value)} autoCapitalize="off" autoComplete="off" spellCheck={false} disabled={!!feedback} autoFocus />
        </div> : <div className="answer-options" role="group" aria-label="答案选项">
          {exercise.options.map((o, index) => {
            const correct = feedback && o.id === exercise.answer;
            const wrong = feedback && o.id === selected && !correct;
            const glyph = ['reverse', 'meaning'].includes(exercise.kind);
            return <button key={o.id}
              className={`answer-option ${selected === o.id ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
              onClick={() => setSelected(o.id)} disabled={!!feedback} aria-pressed={selected === o.id}>
              <span className="option-index">{correct ? <Check size={15} /> : wrong ? <X size={15} /> : index + 1}</span>
              <span className={glyph ? `${scriptClass} option-glyph` : 'phonetic'} dir={glyph ? course.direction : 'ltr'} lang={glyph ? course.locale : undefined}>{o.label}</span>
            </button>;
          })}
        </div>}
        {!feedback && !isMatch && <button className="hint-button" onClick={() => { setHinted(!hinted); setHintUsed(true); }} aria-expanded={hinted}><Lightbulb size={15} />{hinted ? '收起提示' : '想一想'}</button>}
        {hinted && !feedback && <div className="hint-content">{item.kind === 'word'
          ? item.segments?.map(s => `${s.text} → ${s.reading}`).join(' · ')
          : exercise.combination ? exercise.combination.parts.map(id => `${itemMap[id].glyph} → ${reading(itemMap[id])}`).join(' + ')
          : item.explanation}</div>}
      </>}
    </main>
    <footer className={`quiz-footer ${feedback ? feedback.correct ? 'feedback-correct' : 'feedback-wrong' : ''}`}>
      <div className="quiz-footer-inner">
        {feedback ? <div className="feedback-copy" role="status">
          <div className="feedback-title">{feedback.correct ? <Check size={22} /> : <RotateCcw size={22} />}<h2>{feedback.correct ? item.kind === 'word' ? item.meaning : '记住了，继续' : isMatch ? '配对完成，易混项会再出现' : '差一点，再记一次'}</h2></div>
          {!isMatch && <><p><strong className={scriptClass} dir={course.direction} lang={course.locale}>{exercise.combination?.glyph || item.glyph}</strong><span> → </span><NotationText text={exercise.combination ? `${exercise.combination.roman} /${exercise.combination.ipa}/` : item.kind === 'rule' ? item.ruleAnswer || '' : reading(item)} /></p>
            {item.kind === 'word' && <p>{item.context} {!!item.conventionalNames?.length && <span>地图常见拼法：{item.conventionalNames.join(' / ')}</span>}</p>}
            {!feedback.correct && <p><NotationText text={item.explanation} /></p>}
            {item.kind === 'word' && course.ipaNote && <small>{course.ipaNote}</small>}
            {!exercise.combination && !['read', 'type'].includes(exercise.kind) && <PronunciationButton item={item} />}
          </>}
        </div> : <span className="quiz-footer-note"><CircleHelp size={16} />{isIntro ? '理解以后，再试着回忆' : isMatch ? `${matched.length} / ${exercise.pairs!.length} 已配对` : '不计时，按自己的节奏来'}</span>}
        <button className="button primary quiz-next" disabled={!isIntro && !feedback && (isMatch || !canCheck)} onClick={confirm}>
          {isIntro ? '开始练习' : feedback ? '继续' : '检查答案'}<ArrowRight size={18} />
        </button>
      </div>
    </footer>
  </div>;
}

export function SessionComplete({ session, onClose, onContinue }: {
  session: Session; onClose: () => void; onContinue: () => void;
}) {
  const accuracy = session.answers ? Math.round(session.correct / session.answers * 100) : 0;
  return <div className="complete-screen">
    <div className="complete-icon"><Check size={40} /></div>
    <span className="eyebrow">LESSON COMPLETE</span>
    <h1>又多认出了世界的一小部分</h1>
    <p>{courses[session.courseId].title} · {session.mode === 'learn' ? '学习完成' : '复习完成'}</p>
    <div className="complete-stats">
      <div><strong>{session.newIds.filter(id => session.outcomes[id]).length}</strong><span>新知识</span></div>
      <div><strong>{session.answers}</strong><span>次提取练习</span></div>
      <div><strong>{accuracy}%</strong><span>课内正确率</span></div>
    </div>
    <div className="complete-review-note"><RotateCcw size={18} /><span>本课已保存。记忆调度已根据答题情况更新；答错过的知识会更早复习。</span></div>
    <button className="button primary" onClick={onContinue}>继续下一小课<ArrowRight size={18} /></button>
    <button className="text-button" onClick={onClose}>回到学习路径</button>
  </div>;
}
