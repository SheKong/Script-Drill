import { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Timer, Trophy, X, Zap } from 'lucide-react';
import type { AppState, Course } from '../types';
import { refillRush, rushPool, startRush, type RushMode } from '../lib/rush';
import { mainComplete } from '../lib/engine';
import { useScriptStyle } from './ScriptVariants';
import { PlaceMap } from './PlaceMap';
import { Modal } from './Modal';

export type StartRush = (mode: RushMode) => void;
export function RushEntryPoints({ state, course, startRush: start }: { state: AppState; course: Course; startRush: StartRush }) {
  const complete = mainComplete(course, state);
  return <section className="rush-entry">
    <div className="section-heading"><h2><Zap size={18} />Rush</h2><span>2 分钟 · {complete ? '主线已完成' : '推荐完成主线后挑战'}</span></div>
    <div className="rush-modes">{(['simple', 'vocabulary'] as const).map(mode => {
      const count = rushPool(course, mode, state).length;
      if (!count) return null;
      return <button className="rush-mode" key={mode} disabled={count < 6} onClick={() => start(mode)}>
        <span><strong>{mode === 'simple' ? '简单 Rush' : '词汇 Rush'}</strong><small>{mode === 'simple' ? '字母与基础组合' : `${count} 个词汇`}</small></span>
        <span className="rush-best"><Trophy size={14} />{state.rushBest?.[`${course.id}:${mode}`] || 0}</span><ArrowRight size={17} />
      </button>;
    })}</div>
  </section>;
}

export function Rush({ state, course, mode, onExit, onFinish, onRestart }: {
  state: AppState; course: Course; mode: RushMode; onExit: () => void; onFinish: (score: number) => void; onRestart: () => void;
}) {
  const [pool] = useState(() => rushPool(course, mode, state));
  const [board, setBoard] = useState(() => startRush(pool));
  const [selected, setSelected] = useState<number>();
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number>();
  const [meaning, setMeaning] = useState<(typeof pool)[number]>();
  const [remaining, setRemaining] = useState(120);
  const [done, setDone] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const deadline = useRef(Date.now() + 120000);
  const recorded = useRef(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busyUntil = useRef(0);
  const { scriptClass, control } = useScriptStyle(course);
  const best = state.rushBest?.[`${course.id}:${mode}`] || 0;
  useEffect(() => {
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) { clearInterval(timer); setDone(true); }
    };
    const timer = setInterval(tick, 100);
    return () => { clearInterval(timer); clearTimeout(wrongTimer.current); };
  }, []);
  useEffect(() => {
    if (done && !recorded.current) { recorded.current = true; onFinish(score); }
  }, [done, onFinish, score]);
  function match(index: number) {
    if (Date.now() >= deadline.current) { setDone(true); return; }
    if (selected === undefined || done || Date.now() < busyUntil.current) return;
    if (board.left[selected].id !== board.right[index].id) {
      setWrong(index); setScore(value => Math.max(0, value - 1)); setSelected(undefined);
      busyUntil.current = Date.now() + 450;
      clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrong(undefined), 450);
      return;
    }
    setScore(value => value + 1);
    setMeaning(board.left[selected]);
    setBoard(refillRush(board, pool, selected, index));
    setSelected(undefined); setWrong(undefined);
    busyUntil.current = Date.now() + 250;
  }
  if (done) return <div className="complete-screen">
    <div className="complete-icon"><Trophy size={40} /></div><span className="eyebrow">RUSH COMPLETE</span>
    <h1>两分钟，挑战完成</h1><p>{mode === 'simple' ? '简单 Rush' : '词汇 Rush'} · {course.title}</p>
    <div className="complete-stats"><div><strong>{score}</strong><span>本次得分</span></div><div><strong>{Math.max(best, score)}</strong><span>最高纪录</span></div><div><strong>2:00</strong><span>挑战时间</span></div></div>
    <button className="button primary" onClick={onRestart}><RotateCcw size={17} />再来一次</button>
    <button className="text-button" onClick={onExit}>回到课程<ArrowRight size={17} /></button>
  </div>;
  return <div className="rush-shell">
    <header className="rush-header"><button className="icon-button" title="退出 Rush" aria-label="退出 Rush" onClick={() => setConfirmExit(true)}><X size={22} /></button>
      <h1>{mode === 'simple' ? '简单 Rush' : '词汇 Rush'}</h1><span className={remaining <= 15 ? 'rush-time urgent' : 'rush-time'} role="timer"><Timer size={18} />{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span></header>
    <main className="rush-content">
      <div className="rush-score"><span><Zap size={17} />{score}</span><span><Trophy size={15} />{best}</span></div>
      {control}
      {mode === 'vocabulary' && <div className="rush-meaning" aria-live="polite">
        {meaning ? <><div><strong className={scriptClass}>{meaning.glyph}</strong><span>{meaning.item?.meaning}</span></div><PlaceMap item={meaning.item} compact /></> : <span>词汇 Rush</span>}
      </div>}
      <div className="matching-grid rush-grid">
        <div>{board.left.map((entry, index) => <button key={`${index}:${entry.id}`} data-entry-id={entry.id} className={`match-button script-match ${scriptClass} ${entry.glyph.length > 8 ? 'dense-glyph' : ''} ${selected === index ? 'selected' : ''}`}
          dir={course.direction} lang={course.locale} aria-pressed={selected === index} onClick={() => setSelected(index)}><span>{entry.glyph}</span><PlaceMap item={entry.item} compact anonymous /></button>)}</div>
        <div>{board.right.map((entry, index) => <button key={`${index}:${entry.id}`} data-entry-id={entry.id} className={`match-button phonetic ${entry.reading.length > 35 ? 'dense-reading' : ''} ${wrong === index ? 'wrong' : ''}`}
          disabled={selected === undefined} onClick={() => match(index)}><span>{entry.reading}</span></button>)}</div>
      </div>
      <div className="rush-status"><RotateCcw size={13} />配对 +1 · 错配 −1</div>
    </main>
    {confirmExit && <Modal title="退出本次 Rush？" onClose={() => setConfirmExit(false)}><p className="dialog-copy">计时仍在继续。未完成的挑战不会更新最高分。</p><div className="dialog-actions"><button className="button primary" onClick={() => setConfirmExit(false)}>继续挑战<ArrowRight size={16} /></button><button className="button secondary" onClick={onExit}><X size={16} />退出挑战</button></div></Modal>}
  </div>;
}
