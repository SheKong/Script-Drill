import { z } from 'zod';
import { courses, itemMap } from '../data';
import type { AppState } from '../types';
import { refreshSessionNotation } from './engine';

export const STORAGE_KEY = 'script-drill:v1';
const count = z.number().int().min(0).max(10000000);
const text = z.string().max(3000);
const date = z.string().refine(s => /^\d{4}-\d{2}-\d{2}T/.test(s) && Number.isFinite(Date.parse(s)), '无效日期');
const itemId = z.string().refine(s => Object.hasOwn(itemMap, s), '未知知识 ID');
const courseId = z.string().refine(s => Object.hasOwn(courses, s), '未知课程 ID');
const card = z.object({
  due: date, stability: z.number().min(0).max(100000),
  difficulty: z.number().min(0).max(10),
  elapsed_days: count, scheduled_days: count, reps: count, lapses: count,
  state: z.number().int().min(0).max(3), learning_steps: count,
  last_review: date.optional(),
}).refine(c => c.state === 0 || (c.stability > 0 && c.reps > 0 && !!c.last_review), '不完整的记忆卡')
  .refine(c => c.lapses <= c.reps, '遗忘次数不能大于复习次数');
const progress = z.object({
  introduced: z.boolean(), correct: count, wrong: count,
  modes: z.array(z.string().max(30)).max(10), lastSeen: date, card: card.optional(),
});
const exercise = z.object({
  id: z.string().max(100), kind: z.enum(['intro', 'read', 'reverse', 'match', 'type', 'meaning', 'combine', 'mark']),
  itemId, prompt: text, display: text, answer: text,
  options: z.array(z.object({ id: text, label: text, sublabel: text.optional() })).max(6),
  pairs: z.array(z.object({ id: itemId, left: text, right: text })).max(5).optional(),
  combination: z.object({ glyph: text, roman: text, ipa: text, parts: z.array(itemId).length(2) }).optional(),
  repair: z.boolean().optional(),
}).refine(q => {
  if (q.kind === 'combine' && !q.combination) return false;
  if (['read', 'reverse', 'meaning', 'combine', 'mark'].includes(q.kind)) {
    return q.options.length === 4 && new Set(q.options.map(o => o.id)).size === 4
      && q.options.filter(o => o.id === q.answer).length === 1;
  }
  if (q.kind === 'match') return !!q.pairs && q.pairs.length >= 2
    && new Set(q.pairs.map(p => p.id)).size === q.pairs.length;
  return true;
}, '不完整的练习题');
export const stateSchema = z.object({
  version: z.literal(1), courseId,
  progress: z.record(itemId, progress),
  history: z.array(z.object({
    id: text, courseId, date,
    answers: count, correct: count, newCount: count, minutes: count,
  }).refine(h => h.correct <= h.answers, '正确题数超过总题数')).max(1000),
  settings: z.object({
    dailyGoal: z.number().int().refine(n => [10, 20, 30, 50].includes(n)),
    newPerLesson: z.number().int().min(1).max(5), typing: z.boolean(),
  }),
  completedUnitReviews: z.record(z.string().max(100), z.boolean()).optional(),
  rushBest: z.record(z.string().max(100), count).optional(),
  session: z.object({
    id: text, courseId, mode: z.enum(['learn', 'review', 'mistakes', 'custom', 'extra']),
    stage: z.literal('unit-review').optional(),
    unitId: text.optional(), queue: z.array(exercise).min(1).max(500),
    index: count, answers: count, correct: count, startedAt: date, activeSeconds: count.default(0),
    introduced: z.array(itemId).max(500), newIds: z.array(itemId).max(20),
    repairCount: z.record(itemId, z.number().int().min(0).max(2)),
    outcomes: z.record(itemId, z.object({
      correct: count, wrong: count, hinted: z.boolean(), modes: z.array(text).max(10),
    })),
  }).refine(s => s.index < s.queue.length && s.correct <= s.answers && s.queue.every(q =>
    itemMap[q.itemId].courseId === s.courseId && (q.pairs || []).every(p => itemMap[p.id].courseId === s.courseId)
      && (q.combination?.parts || []).every(id => itemMap[id].courseId === s.courseId),
  ), '课程会话不一致').optional(),
});
export const initialState = (): AppState => ({
  version: 1, courseId: 'thai', progress: {}, history: [],
  settings: { dailyGoal: 20, newPerLesson: 3, typing: true },
});
export function parseBackup(raw: string): AppState {
  if (raw.length > 5000000) throw new Error('备份文件超过 5 MB，请检查文件。');
  const result = stateSchema.safeParse(JSON.parse(raw));
  if (!result.success) throw new Error('备份格式不正确，或包含当前版本不支持的数据。原有进度未改变。');
  const state = result.data as AppState;
  return state.session ? { ...state, session: refreshSessionNotation(state.session) } : state;
}
export function loadState(): { state: AppState; warning?: string; writeBlocked?: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: initialState() };
    try { return { state: parseBackup(raw) }; }
    catch {
      return {
        state: initialState(), writeBlocked: true,
        warning: '检测到无法读取的旧进度，已保留原始数据且暂停写入。请先在设置中导出原始备份，再确认重置。',
      };
    }
  } catch {
    return { state: initialState(), warning: '浏览器阻止了本地存储。当前进度仅留在本次页面中，请使用导出备份。' };
  }
}
export function saveState(state: AppState): string | undefined {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { return '进度未能保存到浏览器，请在离开前导出备份。'; }
}
export function exportBackup(state: AppState, raw = false) {
  const contents = raw ? localStorage.getItem(STORAGE_KEY) || JSON.stringify(state) : JSON.stringify(state, null, 2);
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `script-drill-${new Date().toISOString().slice(0, 10)}${raw ? '-original' : ''}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
