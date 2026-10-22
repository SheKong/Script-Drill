import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, Check, ChevronDown, Compass,
  Flame, Globe2, GraduationCap, Library, MapPin, RotateCcw, Settings2, ShieldCheck, X,
} from 'lucide-react';
import { courses } from './data';
import { advanceIntro, answerExercise, createSession, finishSession, mainComplete, streak } from './lib/engine';
import { initialState, loadState, saveState } from './lib/storage';
import type { AppState, CourseId, Knowledge, Session } from './types';
import { KnowledgeDetail } from './components/KnowledgeDetail';
import { Modal } from './components/Modal';
import { LearnPage, LibraryPage, ReviewPage, Settings, SourcesPage, StatsPage, type Start } from './components/Pages';
import { CourseComplete, Quiz, SessionComplete } from './components/Quiz';
import { Rush } from './components/Rush';
import type { RushMode } from './lib/rush';

type Page = 'learn' | 'library' | 'review' | 'stats' | 'sources';
const nav = [
  { id: 'learn', name: '学习路径', icon: GraduationCap },
  { id: 'library', name: '文字图鉴', icon: Library },
  { id: 'review', name: '记忆复习', icon: RotateCcw },
  { id: 'stats', name: '学习记录', icon: ChartNoAxesColumnIncreasing },
] as const;

export default function App() {
  const [loaded] = useState(loadState);
  const [state, setState] = useState<AppState>(loaded.state);
  const [page, setPage] = useState<Page>('learn');
  const [warning, setWarning] = useState(loaded.warning || '');
  const [writeBlocked, setWriteBlocked] = useState(!!loaded.writeBlocked);
  const [courseMenu, setCourseMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const [detail, setDetail] = useState<Knowledge>();
  const [inQuiz, setInQuiz] = useState(false);
  const [summary, setSummary] = useState<Session>();
  const [graduated, setGraduated] = useState(false);
  const [rush, setRush] = useState<RushMode>();
  const [rushRun, setRushRun] = useState(0);
  const [pendingStart, setPendingStart] = useState<{ mode: Session['mode']; unitId?: string; ids?: string[] }>();
  const [toast, setToast] = useState('');
  const [, refresh] = useState(0);
  const courseButton = useRef<HTMLDivElement>(null);
  const course = courses[state.courseId];
  useEffect(() => {
    if (writeBlocked) return;
    const message = saveState(state);
    if (message) setWarning(message);
  }, [state, writeBlocked]);
  useEffect(() => {
    const handle = setInterval(() => refresh(n => n + 1), 30000);
    return () => clearInterval(handle);
  }, []);
  useEffect(() => {
    if (courseMenu) courseButton.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus();
  }, [courseMenu]);
  useEffect(() => {
    if (!inQuiz) return;
    const handle = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setState(s => s.session ? {
        ...s, session: { ...s.session, activeSeconds: s.session.activeSeconds + 10 },
      } : s);
    }, 10000);
    return () => clearInterval(handle);
  }, [inQuiz]);
  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(handle);
  }, [toast]);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (!courseButton.current?.contains(e.target as Node)) setCourseMenu(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setCourseMenu(false); };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('keydown', escape); };
  }, []);
  const closeSettings = useCallback(() => setSettings(false), []);
  const closeDetail = useCallback(() => setDetail(undefined), []);
  const closePending = useCallback(() => setPendingStart(undefined), []);
  const pause = useCallback(() => setInQuiz(false), []);
  const start: Start = (mode, unitId, ids) => {
    if (state.session) { setPendingStart({ mode, unitId, ids }); return; }
    const session = createSession(state, mode, unitId, ids);
    if (!session) { setToast(mode === 'review' ? '目前没有到期的知识。' : '暂无可练习的内容，请先完成前置知识。'); return; }
    setState({ ...state, session }); setInQuiz(true); setSummary(undefined);
    window.scrollTo(0, 0);
  };
  function applyStep(next: AppState) {
    if (next.session && next.session.index >= next.session.queue.length) {
      const sessionCourse = courses[next.session.courseId];
      const finished = finishSession(next);
      setGraduated(next.session.mode === 'learn' && !mainComplete(sessionCourse, state) && mainComplete(sessionCourse, finished));
      setSummary(next.session);
      setState(finished);
      setInQuiz(false);
      window.scrollTo(0, 0);
    } else {
      setState(next); window.scrollTo(0, 0);
    }
  }
  const selectCourse = (id: CourseId) => {
    setState(s => ({ ...s, courseId: id }));
    setCourseMenu(false); setPage('learn'); window.scrollTo(0, 0);
    courseButton.current?.querySelector<HTMLButtonElement>('.course-current')?.focus();
  };
  const completeContinue = () => {
    const mode = summary?.mode === 'extra' ? 'extra' : mainComplete(course, state) ? 'review' : 'learn';
    setSummary(undefined);
    const next = createSession(state, mode);
    if (next) { setState({ ...state, session: next }); setInQuiz(true); }
    else { setPage('learn'); setToast('本轮练习已完成，可在学习路径选择其他内容。'); }
    window.scrollTo(0, 0);
  };
  const props = { state, course, start, inspect: setDetail, startRush: (mode: RushMode) => { setRush(mode); window.scrollTo(0, 0); } };
  return <>
    {rush ? <Rush key={`${course.id}:${rush}:${rushRun}`} state={state} course={course} mode={rush} onRestart={() => setRushRun(value => value + 1)}
      onExit={() => setRush(undefined)} onFinish={score => setState(previous => ({
        ...previous, rushBest: { ...previous.rushBest, [`${course.id}:${rush}`]: Math.max(previous.rushBest?.[`${course.id}:${rush}`] || 0, score) },
      }))} /> : inQuiz && state.session ? <Quiz state={state}
      onIntro={() => applyStep(advanceIntro(state))}
      onAnswer={(correct, hinted, pairs) => applyStep(answerExercise(state, correct, hinted, pairs))}
      onPause={pause} /> : summary && graduated ? <CourseComplete courseId={course.id}
        onReview={() => { setSummary(undefined); setPage('review'); }}
        onRush={() => { setSummary(undefined); setPage('library'); }}
        onExplore={() => { setSummary(undefined); setPage('learn'); }} /> : summary ? <SessionComplete session={summary}
        onClose={() => { setSummary(undefined); setPage('learn'); }}
        onContinue={completeContinue} /> : <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => { setPage('learn'); window.scrollTo(0, 0); }} aria-label="字里，回到学习路径">
          <span className="brand-mark"><Compass size={24} strokeWidth={1.7} /></span>
          <span><strong>字里<span className="brand-dot">.</span></strong><small>SCRIPT DRILL</small></span>
        </button>
        <div className="sidebar-caption">在文字里，读懂世界</div>
        <div className="course-switcher" ref={courseButton} onKeyDown={event => {
          if (event.key === 'Escape' && courseMenu) {
            event.preventDefault(); setCourseMenu(false);
            courseButton.current?.querySelector<HTMLButtonElement>('.course-current')?.focus();
          }
          if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
          event.preventDefault();
          if (!courseMenu) { setCourseMenu(true); return; }
          const buttons = Array.from(courseButton.current!.querySelectorAll<HTMLButtonElement>('[role=menuitem]'));
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
        }}>
          <button className="course-current" onClick={() => setCourseMenu(!courseMenu)} aria-expanded={courseMenu} aria-haspopup="menu">
            {state.courseId === 'thai' ? <span className="thai-flag" aria-label="泰国旗"><i /><i /><i /><i /><i /></span> : <span className={`ipa-course-icon ${course.scriptClass}`}>{course.iconGlyph}</span>}
            <span><strong>{course.title}</strong><small>{course.englishTitle}</small></span><ChevronDown size={15} />
          </button>
          {courseMenu && <div className="course-menu" role="menu">{Object.values(courses).map(c => <button role="menuitem" key={c.id} onClick={() => selectCourse(c.id)}>
            <span className={c.scriptClass} dir={c.direction} lang={c.locale}>{c.iconGlyph}</span><div><strong>{c.title}</strong><small>{c.label}</small></div>{c.id === state.courseId && <Check size={15} />}
          </button>)}</div>}
        </div>
        <nav className="main-nav" aria-label="主导航">
          {nav.map(({ id, name, icon: Icon }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); window.scrollTo(0, 0); }} aria-current={page === id ? 'page' : undefined}>
            <Icon size={20} strokeWidth={1.7} /><span>{id === 'library' && course.type === 'phonetics' ? '音标图鉴' : name}</span>{id === 'learn' && page === id && <span className="nav-active-dot" />}
          </button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-world"><Globe2 size={21} /><span>从一个字母<br /><strong>走向更大的世界</strong></span></div>
          <button className={page === 'sources' ? 'sidebar-link active' : 'sidebar-link'} onClick={() => { setPage('sources'); window.scrollTo(0, 0); }}><BookOpen size={17} />课程与资料来源</button>
          <button className="sidebar-link" onClick={() => setSettings(true)}><Settings2 size={17} />设置与数据</button>
          <div className="sidebar-local"><ShieldCheck size={12} />{writeBlocked ? '本地写入已暂停' : warning ? '请检查数据保存状态' : '进度保存在此浏览器'}</div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar"><div className="breadcrumb"><Globe2 size={15} /><span>文字探索</span><ChevronDown size={12} className="breadcrumb-chevron" /><strong>{course.title}</strong></div>
          <div className="topbar-right"><span className="geoguessr-note"><MapPin size={14} />为街景探索而学</span><span className="streak"><Flame size={16} /><strong>{streak(state)}</strong><span>天</span></span><button className="icon-button settings-shortcut" onClick={() => setSettings(true)} title="设置与数据" aria-label="设置与数据"><Settings2 size={18} /></button></div>
        </header>
        {warning && <div className="storage-warning" role="alert"><ShieldCheck size={17} /><span>{warning}</span><button onClick={() => setSettings(true)}>数据设置<ArrowRight size={13} /></button></div>}
        <main className="page-content">
          {page === 'learn' && <LearnPage {...props} resume={() => { setInQuiz(true); window.scrollTo(0, 0); }} />}
          {page === 'library' && <LibraryPage {...props} />}
          {page === 'review' && <ReviewPage {...props} />}
          {page === 'stats' && <StatsPage state={state} course={course} />}
          {page === 'sources' && <SourcesPage course={course} />}
          <footer className="page-footer"><span>字里 · SCRIPT DRILL</span><span>慢慢学，认得更远。</span></footer>
        </main>
        <nav className="mobile-nav" aria-label="移动端导航">{nav.map(({ id, icon: Icon, name }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); window.scrollTo(0, 0); }} aria-label={name} aria-current={page === id ? 'page' : undefined}><Icon size={19} /><span>{{ learn: '学习', library: '图鉴', review: '复习', stats: '记录' }[id]}</span></button>)}<button className={page === 'sources' ? 'active' : ''} onClick={() => { setPage('sources'); window.scrollTo(0, 0); }} aria-label="课程与资料来源"><BookOpen size={19} /><span>资料</span></button></nav>
      </div>
    </div>}
    {detail && <Modal title={detail.title} onClose={closeDetail}>
      <KnowledgeDetail item={detail} state={state} />
      {state.progress[detail.id]?.introduced && <button className="button secondary full-width" onClick={() => { const id = detail.id; setDetail(undefined); start('custom', undefined, [id]); }}><RotateCcw size={15} />练习这个知识<ArrowRight size={15} /></button>}
    </Modal>}
    {settings && <Settings state={state} update={setState} close={closeSettings} rawBackup={writeBlocked}
      importState={next => {
        setState(next); setWriteBlocked(false); setWarning(''); setInQuiz(false); setSummary(undefined);
        setSettings(false); setToast('备份导入成功。');
      }}
      reset={() => {
        setState(initialState()); setWriteBlocked(false); setWarning(''); setInQuiz(false); setSummary(undefined);
        setSettings(false); setToast('全部进度已重置。');
      }} />}
    {pendingStart && <Modal title="有一段尚未完成的练习" onClose={closePending}>
      <p className="dialog-copy">可以接着上次的位置继续，也可以结算已经完成的题目，再开始这次练习。尚未答题的知识不会增加复习次数。</p>
      <div className="dialog-actions">
        <button className="button primary" onClick={() => { setPendingStart(undefined); setState(s => ({ ...s, courseId: s.session!.courseId })); setInQuiz(true); }}>继续上次练习<ArrowRight size={16} /></button>
        <button className="button secondary" onClick={() => {
          const next = finishSession(state);
          const session = createSession(next, pendingStart.mode, pendingStart.unitId, pendingStart.ids);
          setState({ ...next, session }); setPendingStart(undefined);
          if (session) setInQuiz(true); else setToast('当前没有可练习内容，已保存此前作答。');
        }}>结算上次，开始这次</button>
      </div>
    </Modal>}
    {toast && <div className="toast" role="status"><Check size={17} /><span>{toast}</span><button className="icon-button" aria-label="关闭提示" onClick={() => setToast('')}><X size={14} /></button></div>}
  </>;
}
