import { useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, ArrowUpFromLine, BookOpen, CalendarDays, Check, ChevronDown,
  ChevronRight, CircleCheck, Clock3, ExternalLink, Flame, GraduationCap, Layers3, LockKeyhole,
  MapPin, Play, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Target, Trash2, X,
} from 'lucide-react';
import { itemMap, kindNames } from '../data';
import { sources } from '../data/sources';
import { cardStatus, dueItems, eligibleWords, localDay, nextUnit, streak, trained, unitDone, unitOpen, weakItems } from '../lib/engine';
import { exportBackup, parseBackup } from '../lib/storage';
import type { AppState, Course, Knowledge, Session } from '../types';
import { Modal } from './Modal';
import { useScriptStyle } from './ScriptVariants';
import { NotationText } from './NotationText';

export type Start = (mode: Session['mode'], unitId?: string, ids?: string[]) => void;
type PageProps = { state: AppState; course: Course; start: Start; inspect: (item: Knowledge) => void };

export function LearnPage({ state, course, start, inspect, resume }: PageProps & { resume: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const current = nextUnit(course, state.progress);
  const currentIndex = current ? course.units.indexOf(current) : course.units.length;
  const symbols = course.items.filter(i => i.kind !== 'word');
  const trainedCount = symbols.filter(i => trained(i.id, state.progress)).length;
  const due = dueItems(course, state.progress);
  const unlockedWords = eligibleWords(course, state.progress);
  const newWords = unlockedWords.filter(i => !state.progress[i.id]?.introduced);
  const today = state.history.filter(h => localDay(h.date) === localDay()).reduce((n, h) => n + h.answers, 0);
  const visibleUnits = expanded ? course.units : course.units.slice(Math.max(0, currentIndex - 1), Math.min(course.units.length, currentIndex + 4));
  const hasSession = state.session?.courseId === course.id;
  const phases = [...new Set(visibleUnits.map(u => u.phase))];
  return <div className="workspace-grid">
    <div className="primary-column">
      <div className="page-heading">
        <div><div className="eyebrow">你的文字地图 <span>/</span> {course.label}</div><h1>{course.title}<span className={course.scriptClass} dir={course.direction} lang={course.locale}>{course.nativeTitle}</span></h1></div>
        <span className="course-edition">基础课程 · 01</span>
      </div>
      <p className="course-description">{course.description}</p>
      <div className="course-meta">
        <span><Layers3 size={15} />{course.units.length} 个单元</span>
        <span><BookOpen size={15} />{symbols.length} 个知识点</span>
        <span><MapPin size={15} />{course.items.filter(i => i.kind === 'word').length || '通用'} {course.type === 'script' ? '个街景词汇' : '语音学基础'}</span>
      </div>
      <section className="next-lesson">
        <div className="next-top"><span className="tag"><span className="status-dot" />{hasSession ? '上次停在这里' : '下一小步'}</span><span className="subtle"><Clock3 size={13} />约 3–6 分钟</span></div>
        <h2>{hasSession ? '继续未完成的练习' : current?.title || (newWords.length ? '读懂新解锁的词汇' : '核心路径已完成')}</h2>
        <p>{hasSession ? `已完成 ${state.session!.index} / ${state.session!.queue.length} 个环节` : current?.subtitle || (newWords.length ? `${newWords.length} 个词汇已经具备全部前置知识` : '回访到期知识，让认得出变成记得住。')}</p>
        <div className="next-bottom">
          <div className="letter-stack">{(hasSession ? state.session!.newIds : current?.items || []).slice(0, 4).map(id => {
            const item = itemMap[id];
            const length = Array.from(item.glyph).length;
            return <span key={id} className={course.scriptClass} dir={course.direction} lang={course.locale} title={item.title}>
              {item.kind === 'rule' ? <BookOpen size={16} /> : <b style={{ fontSize: length > 4 ? 11 : length > 2 ? 14 : undefined }}>{item.glyph}</b>}
            </span>;
          })}</div>
          <button className="button primary" onClick={() => hasSession ? resume() : start(current || newWords.length ? 'learn' : 'review', current?.id)}
            disabled={!hasSession && !current && !newWords.length && !due.length}>
            {hasSession ? '继续练习' : current || newWords.length ? '开始学习' : '开始复习'}<ArrowRight size={17} />
          </button>
        </div>
      </section>
      <div className="section-heading"><h2>学习路径</h2><span>{course.units.filter(u => unitDone(u, state.progress)).length} / {course.units.length} 单元</span></div>
      <div className="learning-path">
        {phases.map(phase => <section className="path-phase" key={phase}>
          <div className="phase-label">{phase}</div>
          {visibleUnits.filter(u => u.phase === phase).map(unit => {
            const index = course.units.indexOf(unit);
            const open = unitOpen(course, index, state.progress);
            const done = unitDone(unit, state.progress);
            const active = unit.id === current?.id;
            const count = unit.items.filter(id => trained(id, state.progress)).length;
            return <div key={unit.id} className={`unit-row ${active ? 'active' : ''} ${!open ? 'locked' : ''} ${done ? 'done' : ''}`}>
              <div className="unit-node">{done ? <Check size={20} /> : active ? <Play size={18} fill="currentColor" /> : open ? index + 1 : <LockKeyhole size={17} />}</div>
              <div className="unit-copy"><span className="unit-number">单元 {String(index + 1).padStart(2, '0')}{active && <span className="current-label">正在学习</span>}</span>
                <h3>{unit.title}</h3><p>{unit.subtitle}</p>
                <div className="unit-progress"><span><i style={{ width: `${count / unit.items.length * 100}%` }} /></span><small>{count} / {unit.items.length}</small></div>
              </div>
              <div className="unit-actions">
                <button className="icon-button" title={`${unit.title} · 单元说明`} aria-label={`${unit.title} · 单元说明`}
                  onClick={() => inspect({
                    id: unit.id, courseId: course.id, kind: 'rule', title: unit.title, glyph: String(index + 1).padStart(2, '0'),
                    roman: '', ipa: '', explanation: unit.note, sources: course.type === 'phonetics' ? ['ipa-chart'] : course.sources.slice(0, 2).map(s => s.id),
                    requires: [], group: `单元 ${index + 1}`,
                  })}><BookOpen size={16} /></button>
                <button className={`unit-start ${active ? 'is-current' : ''}`} disabled={!open}
                  onClick={() => start(done ? 'custom' : 'learn', unit.id, done ? unit.items : undefined)}
                  aria-label={done ? `复习${unit.title}` : open ? `学习${unit.title}` : `${unit.title}尚未解锁`}
                  title={open ? done ? '复习本单元' : '开始本单元' : '完成前一单元后解锁'}><ChevronRight size={19} /></button>
              </div>
            </div>;
          })}
        </section>)}
      </div>
      {!expanded && visibleUnits.length < course.units.length && <button className="expand-path" onClick={() => setExpanded(true)}>展开全部 {course.units.length} 个单元<ChevronDown size={16} /></button>}
      {expanded && <button className="expand-path" onClick={() => setExpanded(false)}>回到当前进度<ChevronDown size={16} className="rotate" /></button>}
      <div className="course-footnote"><ShieldCheck size={15} /><span>{course.notationNote}</span></div>
    </div>
    <aside className="study-rail">
      <section className="daily-goal">
        <div className="rail-heading"><h2>今天，也向前一点</h2><Target size={18} /></div>
        <div className="daily-number"><strong>{today}</strong><span>/ {state.settings.dailyGoal} 题</span><span className="goal-tag">{today >= state.settings.dailyGoal ? '已达成' : '今日目标'}</span></div>
        <div className="meter"><span style={{ width: `${Math.min(100, today / state.settings.dailyGoal * 100)}%` }} /></div>
        <div className="daily-days">{Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i));
          const done = state.history.some(h => localDay(h.date) === localDay(d));
          return <div key={i} className={i === 6 ? 'today' : ''}><span>{'日一二三四五六'[d.getDay()]}</span><i className={done ? 'checked' : ''}>{done ? <Check size={11} /> : <span />}</i></div>;
        })}</div>
      </section>
      <section className="rail-review">
        <div className="rail-heading"><h2>留给记忆一点时间</h2><RotateCcw size={17} /></div>
        <p>{due.length ? <><strong>{due.length}</strong> 个知识到了复习时间</> : '每一次回忆，都让下次更容易。'}</p>
        <button className="button secondary full-width" onClick={() => start('review')} disabled={!due.length}>{due.length ? '开始到期复习' : '暂时没有到期复习'}{due.length ? <ArrowRight size={15} /> : <Check size={15} />}</button>
      </section>
      {course.id === 'thai' ? <section className="field-note">
        <div className="field-image"><img src="/thailand.jpg" alt="泰国街道上的泰文与中文招牌、三轮车" /><span><MapPin size={12} />泰国 · 街景观察</span></div>
        <div className="field-heading"><span className="eyebrow">从字母走向街头</span><h2>在路牌上，认出下一站</h2></div>
        <div className="field-words">{['th-word-ban', 'th-word-thanon', 'th-word-mueang'].map(id => {
          const word = itemMap[id], ready = word.requires.every(r => trained(r, state.progress));
          return <button key={id} onClick={() => inspect(word)}><span className="thai">{word.glyph}</span><span>{word.meaning?.split('；')[0]}</span>{ready ? <ChevronRight size={14} /> : <LockKeyhole size={12} />}</button>;
        })}</div>
      </section> : course.type === 'phonetics' ? <section className="ipa-map-note">
        <span className="eyebrow">一张共同的声音地图</span>
        <div className="vowel-compass phonetic"><span>i · y</span><span>ɯ · u</span><span>e · ø</span><span>ɤ · o</span><span>ɛ · œ</span><span>ʌ · ɔ</span><span>a</span><span>ɑ</span></div>
        <p>前后、开闭、圆唇。<br />从发音坐标，而不是拼写出发。</p>
        <a className="source-link" href={sources.find(s => s.id === 'ipa-chart')!.url} target="_blank" rel="noreferrer">完整 IPA 表<ExternalLink size={13} /></a>
      </section> : null}
      <div className="rail-progress"><GraduationCap size={18} /><div><strong>{trainedCount} / {symbols.length}</strong><span>个知识已完成双向练习</span></div></div>
    </aside>
  </div>;
}

export function LibraryPage({ state, course, start, inspect }: PageProps) {
  const { scriptClass, control } = useScriptStyle(course);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('all');
  const kinds = [...new Set(course.items.map(i => i.kind))];
  const items = useMemo(() => course.items.filter(i => {
    const q = query.toLowerCase().trim();
    return (kind === 'all' || i.kind === kind) && (
      !q || [i.glyph, i.roman, i.ipa, i.officialRoman, i.title, i.explanation, i.meaning, ...(i.conventionalNames || [])].some(s => s?.toLowerCase().includes(q))
    ) && (status === 'all' || status === 'known' && state.progress[i.id]?.introduced || status === 'new' && !state.progress[i.id]?.introduced);
  }), [course, query, kind, status, state.progress]);
  const known = items.filter(i => state.progress[i.id]?.introduced);
  return <div className="wide-page">
    <div className="page-heading"><div><div className="eyebrow">{course.title} / REFERENCE</div><h1>{course.type === 'script' ? '文字图鉴' : '音标图鉴'}</h1></div>
      <button className="button secondary" disabled={!known.length} onClick={() => start('custom', undefined, known.slice(0, 8).map(i => i.id))}><Play size={15} />练习已学内容</button></div>
    <div className="library-tools">
      <div className="search-box"><Search size={17} /><input aria-label="搜索知识" placeholder="搜索文字、转写、IPA 或名称" value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="icon-button" onClick={() => setQuery('')} title="清空搜索" aria-label="清空搜索"><X size={15} /></button>}</div>
      <label className="status-select"><SlidersHorizontal size={15} /><select aria-label="学习状态" value={status} onChange={e => setStatus(e.target.value)}><option value="all">全部状态</option><option value="known">已经初见</option><option value="new">尚未学习</option></select></label>
    </div>
    <div className="filter-tabs" role="tablist" aria-label="知识类别">{['all', ...kinds].map(k => <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>{k === 'all' ? '全部' : kindNames[k]}<span>{k === 'all' ? course.items.length : course.items.filter(i => i.kind === k).length}</span></button>)}</div>
    {control}
    <div className="results-count">{items.length} 个条目<span>{course.type === 'phonetics' ? '符号与发音特征一一对应；没有“通用英文转写”' : '词汇解锁同时检查字母与拼读规则'}</span></div>
    {!items.length ? <Empty title="没有找到匹配的知识" copy="试试另一种文字、名称或转写。" icon={<Search size={27} />} /> :
      <div className={`knowledge-grid ${kind === 'word' || kind === 'rule' ? 'wide-items' : ''}`}>
        {items.map(item => {
          const p = state.progress[item.id], s = cardStatus(p);
          const ready = item.kind !== 'word' || item.requires.every(id => trained(id, state.progress));
          return <button className={`knowledge-tile ${p?.introduced ? 'known' : ''} ${item.kind === 'word' || item.kind === 'rule' ? 'text-tile' : ''}`} key={item.id} onClick={() => inspect(item)}>
            <span className={`tile-state ${s}`} title={s === 'new' ? '尚未学习' : s === 'learning' ? '学习中' : '间隔复习中'}>{p?.introduced ? <Check size={10} /> : null}</span>
            <strong className={`${scriptClass} tile-glyph`} dir={course.direction} lang={course.locale}>{item.glyph}</strong>
            <span className="tile-roman">{item.kind === 'word' || item.kind === 'rule' || course.type === 'phonetics' ? item.title : item.roman || '不写'}</span>
            {item.ipa && course.type === 'script' && <span className="tile-ipa phonetic">/{item.ipa}/</span>}
            {item.class && <small>{item.class}类{item.obsolete ? ' · 历史' : ''}</small>}
            {item.kind === 'word' && <small>{ready ? '前置知识已具备' : <><LockKeyhole size={10} />尚未解锁</>}</small>}
          </button>;
        })}
      </div>}
  </div>;
}

export function ReviewPage({ state, course, start, inspect }: PageProps) {
  const due = dueItems(course, state.progress);
  const weak = weakItems(course, state.progress);
  const known = course.items.filter(i => state.progress[i.id]?.introduced);
  const next = known.filter(i => state.progress[i.id]?.card).sort((a, b) => Date.parse(state.progress[a.id].card!.due) - Date.parse(state.progress[b.id].card!.due))[0];
  return <div className="wide-page">
    <div className="page-heading"><div><div className="eyebrow">{course.title} / PRACTICE</div><h1>让记忆留下来</h1></div><span className="tag"><RotateCcw size={13} />FSRS · 90% 目标保持率</span></div>
    <div className="review-actions">
      <section><div className="review-action-icon green"><Clock3 size={23} /></div><h2>到期复习</h2><strong>{due.length}<small> 个知识</small></strong><p>{due.length ? '按到期时间，先复习最需要回忆的内容。' : next ? `下一次：${new Date(state.progress[next.id].card!.due).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '完成第一小课后，复习计划会出现在这里。'}</p><button className="button primary" disabled={!due.length} onClick={() => start('review')}>开始复习<ArrowRight size={16} /></button></section>
      <section><div className="review-action-icon amber"><RotateCcw size={23} /></div><h2>易错巩固</h2><strong>{weak.length}<small> 个知识</small></strong><p>从真实错题出发，重新分清相似的声音与字形。</p><button className="button secondary" disabled={!weak.length} onClick={() => start('mistakes')}>再练一次<ArrowRight size={16} /></button></section>
    </div>
    <div className="section-heading"><h2>当前复习清单</h2><span>{due.length} 个到期</span></div>
    {!due.length ? <Empty icon={<CircleCheck size={30} />} title="这一刻，没有需要赶上的复习" copy={known.length ? '继续学习新内容，或者在图鉴中回访已经认识的知识。' : '先从学习路径开始，积累第一组记忆。'} /> :
      <div className="review-list">{due.map(item => <button key={item.id} onClick={() => inspect(item)}><strong className={course.scriptClass} dir={course.direction} lang={course.locale}>{item.glyph}</strong><span>{item.title}</span><small>{kindNames[item.kind]}</small><ChevronRight size={16} /></button>)}</div>}
    <div className="method-note"><BookOpen size={18} /><div><h3>一次课内重复，不等于多次长期复习</h3><p>每个知识每课只结算一次：答错用 Again，借助提示用 Hard，独立答对用 Good。配对中的错误也会记录；重复答对不掩盖本课先前的错误。</p></div></div>
  </div>;
}

export function StatsPage({ state, course }: { state: AppState; course: Course }) {
  const history = state.history.filter(h => h.courseId === course.id);
  const answers = history.reduce((n, h) => n + h.answers, 0);
  const correct = history.reduce((n, h) => n + h.correct, 0);
  const trainedCount = course.items.filter(i => trained(i.id, state.progress)).length;
  const days = Array.from({ length: 35 }, (_, i) => {
    const day = new Date(); day.setDate(day.getDate() - (34 - i));
    return { date: localDay(day), count: history.filter(h => localDay(h.date) === localDay(day)).reduce((n, h) => n + h.answers, 0) };
  });
  return <div className="wide-page">
    <div className="page-heading"><div><div className="eyebrow">{course.title} / YOUR JOURNEY</div><h1>每一步，都算数</h1></div><span className="local-badge"><ShieldCheck size={14} />仅保存在此浏览器</span></div>
    <div className="stats-row">
      <div><GraduationCap size={19} /><strong>{trainedCount}</strong><span>已完成基础练习</span></div>
      <div><Target size={19} /><strong>{answers ? `${Math.round(correct / answers * 100)}%` : '—'}</strong><span>课内累计正确率</span></div>
      <div><Flame size={19} /><strong>{streak(state)}</strong><span>连续学习天数 · 所有课程</span></div>
      <div><Clock3 size={19} /><strong>{history.reduce((n, h) => n + h.minutes, 0)}</strong><span>累计练习分钟</span></div>
    </div>
    <section className="activity-section"><div className="section-heading"><h2>最近 35 天</h2><CalendarDays size={17} /></div><div className="activity-grid">{days.map(day => <div key={day.date} title={`${day.date} · ${day.count} 题`} aria-label={`${day.date}，${day.count}题`} className={day.count >= 40 ? 'level3' : day.count >= 15 ? 'level2' : day.count > 0 ? 'level1' : ''}><span>{Number(day.date.slice(-2))}</span></div>)}</div><div className="activity-legend"><span>{days[0].date}</span><span>少 <i /> <i className="level1" /> <i className="level2" /> <i className="level3" /> 多</span></div></section>
    <div className="section-heading"><h2>最近的练习</h2><span>最多显示 10 次</span></div>
    {!history.length ? <Empty title="第一段记录，等你开始" copy="完成一小课，这里就会留下你的真实学习记录。" icon={<BookOpen size={28} />} /> :
      <div className="history-table"><div className="history-row table-head"><span>时间</span><span>新知识</span><span>练习题</span><span>正确率</span></div>{history.slice(-10).reverse().map(h => <div className="history-row" key={h.id}><span>{new Date(h.date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span><span>{h.newCount}</span><span>{h.answers}</span><span>{h.answers ? Math.round(h.correct / h.answers * 100) : 0}%</span></div>)}</div>}
    <div className="method-note"><ShieldCheck size={18} /><p>“已完成基础练习”表示完成所需的双向提取，不代表永久掌握。记忆强度仍需跨天复习建立。正确率包含错题重练，不能等同于独立测验成绩。</p></div>
  </div>;
}

export function SourcesPage({ course }: { course: Course }) {
  const recordings = course.items.flatMap(item => item.pronunciation?.recording ? [item.pronunciation.recording] : []);
  return <div className="wide-page sources-page">
    <div className="page-heading"><div><div className="eyebrow">CURRICULUM NOTES</div><h1>知识应当有出处</h1></div><span className="tag">资料核对 · 2026.10.20</span></div>
    <div className="source-principles"><h2>课程边界与记号约定</h2>
      {(course.referenceNotes || [course.notationNote]).map((note, index) => <p key={index}><NotationText text={note} /></p>)}
      <p>词汇同时检查字母、元音和拼读规则。被消音的字母、隐含元音和例外读法必须显式记录；不使用“按字符替换”的自动转写来生成正确答案。初见词先练转写，意义反向题只在复习中出现。</p>
    </div>
    <div className="section-heading"><h2>本课程参考资料</h2><span>{course.sources.length} 项</span></div>
    <div className="source-list">{course.sources.map((s, index) => <a key={s.id} href={s.url} target="_blank" rel="noreferrer"><span className="source-index">{String(index + 1).padStart(2, '0')}</span><div><small>{s.organization}</small><h3>{s.title}</h3><p>{s.description}</p></div><ExternalLink size={17} /></a>)}</div>
    {!!recordings.length && <details className="recording-credits"><summary>真人录音署名与许可 · {recordings.length} 条</summary>
      <ul>{recordings.map(recording => <li key={recording.src}>
        <a href={recording.sourceUrl} target="_blank" rel="noreferrer">{recording.title}</a>
        {' · '}{recording.author}{' · '}
        <a href={recording.licenseUrl} target="_blank" rel="noreferrer">{recording.license}</a>
      </li>)}</ul>
      <p className="asset-credit">Ogg 转为 MP3；未裁切，未改变音高或速度。录音的原始来源、文件校验和与版本保存在 recordings.json 中，许可仅适用于相应素材。</p>
    </details>}
    <div className="method-note"><BookOpen size={18} /><div><h3>设计借鉴，不是产品或算法复刻</h3><p>参考多邻国对字音映射、文字图鉴和语境组合的做法，并使用 FSRS 进行间隔调度。小批量引入、交错双向提取、错题延迟重现是本站的具体实现；没有宣称复制多邻国当前的内部系统。</p></div></div>
    <p className="asset-credit">街景照片来自 Unsplash（原始图片标识：photo-1508009603885-50cf7c579365）。本地字体：
      {' '}<a href="/licenses/NotoSansThai-OFL.txt" target="_blank" rel="noreferrer">Noto Sans Thai</a>、
      <a href="/licenses/NotoSansThaiLooped-OFL.txt" target="_blank" rel="noreferrer">Noto Sans Thai Looped</a>、
      <a href="/licenses/NotoSans-OFL.txt" target="_blank" rel="noreferrer">Noto Sans</a>、
      <a href="/licenses/CharisSIL-OFL.txt" target="_blank" rel="noreferrer">Charis SIL（完整 IPA）</a>。
      均保留 OFL 许可。本站不隶属于 GeoGuessr 或 Duolingo。</p>
  </div>;
}

export function Settings({ state, update, close, reset, importState, rawBackup }: {
  state: AppState; update: (state: AppState) => void; close: () => void;
  reset: () => void; importState: (state: AppState) => void; rawBackup: boolean;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<AppState>();
  const [confirmReset, setConfirmReset] = useState(false);
  return <Modal title="学习设置" onClose={close}>
    <div className="settings-section"><h3>学习节奏</h3>
      <label className="setting-row"><span>每日目标<small>以完成的练习题数计算</small></span><select value={state.settings.dailyGoal} onChange={e => update({ ...state, settings: { ...state.settings, dailyGoal: Number(e.target.value) } })}>{[10, 20, 30, 50].map(v => <option key={v} value={v}>{v} 题</option>)}</select></label>
      <label className="setting-row"><span>每课新知识<small>已开始的课程不受影响；可额外加入 1 个新词</small></span><select value={state.settings.newPerLesson} onChange={e => update({ ...state, settings: { ...state.settings, newPerLesson: Number(e.target.value) } })}>{[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} 个</option>)}</select></label>
      <label className="setting-row"><span>转写输入题<small>仅用于已经初见过的语言词汇</small></span><input type="checkbox" role="switch" checked={state.settings.typing} onChange={e => update({ ...state, settings: { ...state.settings, typing: e.target.checked } })} /></label>
    </div>
    <div className="settings-section"><h3>你的数据</h3><p>数据只在当前浏览器。换设备、清理浏览器或使用隐私模式前，请导出备份。</p>
      <div className="backup-actions"><button className="button secondary" onClick={() => exportBackup(state)}><ArrowDownToLine size={16} />导出备份</button><button className="button secondary" onClick={() => file.current?.click()}><ArrowUpFromLine size={16} />导入备份</button></div>
      {rawBackup && <button className="text-button" onClick={() => exportBackup(state, true)}>导出保留的原始数据</button>}
      <input type="file" accept=".json,application/json" ref={file} hidden onChange={async e => {
        const selected = e.target.files?.[0]; e.target.value = '';
        if (!selected) return;
        try {
          if (selected.size > 5000000) throw new Error('文件超过 5 MB。');
          const next = parseBackup(await selected.text()); setError(''); setPending(next);
        } catch (err) { setError(err instanceof Error ? err.message : '无法读取这个文件。'); }
      }} />
      {error && <p className="form-error" role="alert">{error}</p>}
      {pending && <div className="confirm-box"><p>备份含 {Object.keys(pending.progress).length} 个知识记录、{pending.history.length} 次练习。导入会替换当前进度。</p><div className="backup-actions"><button className="button secondary" onClick={() => setPending(undefined)}>取消</button><button className="button primary" onClick={() => { importState(pending); setPending(undefined); }}>确认替换</button></div></div>}
    </div>
    <div className="settings-section danger-zone"><h3>重置全部进度</h3>{confirmReset ? <div className="confirm-box"><p>两门课程的进度、练习记录和未完成练习都会被清除。建议先导出备份。</p><div className="backup-actions"><button className="button secondary" onClick={() => setConfirmReset(false)}>保留进度</button><button className="button danger" onClick={reset}>确认重置</button></div></div> : <button className="text-button danger-text" onClick={() => setConfirmReset(true)}><Trash2 size={15} />重置全部进度</button>}</div>
  </Modal>;
}
function Empty({ title, copy, icon }: { title: string; copy: string; icon: React.ReactNode }) {
  return <div className="empty-state"><span>{icon}</span><h3>{title}</h3><p>{copy}</p></div>;
}
