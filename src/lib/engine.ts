import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs';
import { courses, itemMap } from '../data';
import type {
  AppState, Course, Exercise, ExerciseKind, ItemProgress, Knowledge,
  Option, Outcome, Session, StoredCard, Unit,
} from '../types';

export const scheduler = fsrs({ request_retention: 0.9, enable_fuzz: false, maximum_interval: 365 });
export const uid = () => globalThis.crypto.randomUUID();
export const shuffle = <T,>(items: T[], rng: () => number = Math.random): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
export const normalizeAnswer = (s: string) => s.normalize('NFC').toLowerCase().replace(/[\s\-'.]/g, '').trim();
export const reading = (item: Knowledge) => courses[item.courseId].type === 'phonetics'
  ? item.title
  : `${item.roman || '不写'}${item.ipa ? ` /${item.ipa}/` : ''}`;
export const introduced = (id: string, progress: AppState['progress']) => !!progress[id]?.introduced;
export const trained = (id: string, progress: AppState['progress']) => {
  const p = progress[id];
  if (!p?.introduced || p.correct < 2) return false;
  return itemMap[id]?.kind === 'rule' ? p.modes.includes('read') : (p.modes.includes('read') && p.modes.includes('reverse'));
};
export const eligibleWords = (course: Course, progress: AppState['progress']) =>
  course.items.filter(i => i.kind === 'word' && i.requires.every(id => trained(id, progress)));
export const unitDone = (unit: Unit, progress: AppState['progress']) => unit.items.every(id => trained(id, progress));
export const unitOpen = (course: Course, index: number, progress: AppState['progress']) =>
  index === 0 || course.units.slice(0, index).every(u => unitDone(u, progress));
export const nextUnit = (course: Course, progress: AppState['progress']) =>
  course.units.find(u => !unitDone(u, progress));
export const dueItems = (course: Course, progress: AppState['progress'], now = new Date()) =>
  course.items.filter(i => progress[i.id]?.card && new Date(progress[i.id].card!.due) <= now)
    .sort((a, b) => Date.parse(progress[a.id].card!.due) - Date.parse(progress[b.id].card!.due));
export const weakItems = (course: Course, progress: AppState['progress']) =>
  course.items.filter(i => progress[i.id]?.wrong > 0 && (
    progress[i.id].card?.state === 3 || progress[i.id].wrong >= progress[i.id].correct / 3
  )).sort((a, b) => progress[b.id].wrong - progress[a.id].wrong);

function equivalence(item: Knowledge): string {
  if (item.kind === 'rule') return item.ruleAnswer || item.title;
  // Same sound must never compete as unique reverse answers, even if romanizations differ.
  return item.ipa || item.roman;
}
function poolFor(item: Knowledge, course: Course, progress: AppState['progress']): Knowledge[] {
  const peers = course.items.filter(i => i.kind === item.kind && i.id !== item.id && !i.obsolete);
  return [...shuffle(peers.filter(i => introduced(i.id, progress))), ...shuffle(peers.filter(i => !introduced(i.id, progress)))];
}
export function makeExercise(
  item: Knowledge, kind: ExerciseKind, course: Course, progress: AppState['progress'],
): Exercise {
  const base: Exercise = {
    id: uid(), kind, itemId: item.id, options: [], answer: item.id,
    prompt: '', display: item.glyph,
  };
  if (kind === 'intro') return { ...base, prompt: item.kind === 'word' ? '你现在可以读懂这个词了' : '认识一个新知识' };
  if (item.kind === 'rule') {
    return {
      ...base, kind: 'read', prompt: item.rulePrompt!, display: item.glyph,
      options: shuffle([item.ruleAnswer!, ...item.ruleChoices!]).map((label, n) => ({
        id: label === item.ruleAnswer ? item.id : `${item.id}-d${n}`, label,
      })),
    };
  }
  if (kind === 'type') {
    return { ...base, prompt: `写出${course.romanizationName || '转写'}`, answer: item.roman };
  }
  const peers = poolFor(item, course, progress);
  const key = (i: Knowledge) => kind === 'meaning' ? i.meaning || i.title
    : kind === 'reverse' ? equivalence(i) : reading(i);
  const seen = new Set([key(item)]);
  const distractors: Knowledge[] = [];
  for (const candidate of peers) {
    if (seen.has(key(candidate))) continue;
    seen.add(key(candidate));
    distractors.push(candidate);
    if (distractors.length === 3) break;
  }
  const option = (i: Knowledge): Option => ({
    id: i.id, label: kind === 'read' ? reading(i) : i.glyph,
  });
  if (kind === 'meaning') {
    return {
      ...base, prompt: `选择对应的${course.scriptName}词`, display: item.meaning || item.title,
      options: shuffle([item, ...distractors]).map(option),
    };
  }
  if (kind === 'reverse') {
    return {
      ...base,
      prompt: course.type === 'phonetics' ? '选择符合这些发音特征的音标' : item.kind === 'number' ? `选择对应的${course.scriptName}数字` : `选择对应的${course.scriptName}结构`,
      display: reading(item), options: shuffle([item, ...distractors]).map(option),
    };
  }
  return {
    ...base, prompt: course.type === 'phonetics' ? '这个音标描述什么声音？' : item.kind === 'number' ? '这个数字是多少？' : `选择正确的${course.romanizationName || '转写'}与 IPA`,
    options: shuffle([item, ...distractors]).map(option),
  };
}
export function makeMatch(items: Knowledge[]): Exercise | undefined {
  const used = new Set<string>();
  const candidates = shuffle(items.filter(i => i.kind !== 'rule' && i.kind !== 'word'))
    .filter(i => {
      const key = equivalence(i);
      if (used.has(key)) return false;
      used.add(key); return true;
    }).slice(0, 4);
  if (candidates.length < 2) return undefined;
  return {
    id: uid(), kind: 'match', itemId: candidates[0].id,
    prompt: '把左边的符号与右边的读音配对', display: '', options: [], answer: '',
    pairs: candidates.map(i => ({ id: i.id, left: i.glyph, right: reading(i) })),
  };
}
export function makeCombination(items: Knowledge[], course: Course): Exercise | undefined {
  if (!course.composition) return undefined;
  const simplePatterns = new Set(course.composition.vowelIds);
  const excluded = new Set(course.composition.excludedConsonantIds);
  const consonants = items.filter(i => i.kind === 'consonant' && !i.obsolete && !excluded.has(i.id));
  const vowels = items.filter(i => simplePatterns.has(i.id));
  if (!consonants.length || !vowels.length) return undefined;
  const consonant = shuffle(consonants)[0], vowel = shuffle(vowels)[0];
  const compose = (c: Knowledge, v: Knowledge) => ({
    glyph: v.glyph.replace('◌', c.glyph), roman: c.roman + v.roman,
    ipa: c.ipa + v.ipa, parts: [c.id, v.id],
  });
  const answer = compose(consonant, vowel);
  const alternatives = shuffle(course.items.filter(i => i.kind === 'consonant' && !i.obsolete && !excluded.has(i.id)))
    .map(c => compose(c, vowel));
  const seen = new Set([answer.ipa]);
  const distractors = alternatives.filter(c => {
    if (seen.has(c.ipa)) return false;
    seen.add(c.ipa); return true;
  }).slice(0, 3);
  return {
    id: uid(), kind: 'combine', itemId: vowel.id, prompt: '把声母和元音拼起来，选择读音',
    display: answer.glyph, answer: 'combination', combination: answer,
    options: shuffle([
      { id: 'combination', label: `${answer.roman} /${answer.ipa}/` },
      ...distractors.map((c, n) => ({ id: `combination-${n}`, label: `${c.roman} /${c.ipa}/` })),
    ]),
  };
}
function appendTraining(queue: Exercise[], item: Knowledge, course: Course, state: AppState, isNew: boolean) {
  if (isNew && item.kind !== 'word') queue.push(makeExercise(item, 'intro', course, state.progress));
  queue.push(makeExercise(item, 'read', course, state.progress));
}
export function createSession(
  state: AppState, mode: Session['mode'], unitId?: string, customIds?: string[], now = new Date(),
): Session | undefined {
  const course = courses[state.courseId];
  const unit = course.units.find(u => u.id === unitId) || nextUnit(course, state.progress);
  const unitIndex = unit ? course.units.indexOf(unit) : -1;
  if (mode === 'learn' && unit && !unitOpen(course, unitIndex, state.progress)) return undefined;
  let targets: Knowledge[];
  if (mode === 'custom') targets = (customIds || []).map(id => itemMap[id]).filter(i => i?.courseId === course.id && introduced(i.id, state.progress));
  else if (mode === 'review') targets = dueItems(course, state.progress, now).slice(0, 8);
  else if (mode === 'mistakes') targets = weakItems(course, state.progress).slice(0, 6);
  else {
    const available = unit?.items.map(id => itemMap[id]).filter(i => !trained(i.id, state.progress)) || [];
    const selected: Knowledge[] = [];
    const availableKnowledge = new Set(Object.keys(state.progress).filter(id => trained(id, state.progress)));
    for (const item of available) {
      if (!item.requires.every(id => availableKnowledge.has(id))) continue;
      selected.push(item);
      // Earlier units may have prerequisites within the same unit. Those are deliberately
      // deferred until the next lesson, when their prerequisite has actually been practiced.
      if (selected.length >= state.settings.newPerLesson) break;
    }
    targets = selected;
    const readyWord = eligibleWords(course, state.progress).find(i => !introduced(i.id, state.progress));
    if (readyWord) targets = [...targets, readyWord];
  }
  if (!targets.length) return undefined;
  const queue: Exercise[] = [];
  const newIds = targets.filter(i => !introduced(i.id, state.progress)).map(i => i.id);
  const due = mode === 'learn' ? dueItems(course, state.progress, now).filter(i => !targets.includes(i)).slice(0, 2) : [];
  for (let n = 0; n < targets.length; n++) {
    const item = targets[n];
    appendTraining(queue, item, course, state, newIds.includes(item.id));
    if (n > 0) queue.push(makeExercise(targets[n - 1], 'reverse', course, state.progress));
    if (due[n]) queue.push(makeExercise(due[n], 'read', course, state.progress));
  }
  queue.push(makeExercise(targets[targets.length - 1], 'reverse', course, state.progress));
  // A second, separated retrieval is required for progression, not passive introduction.
  for (const item of targets) {
    if (item.kind === 'rule') queue.push(makeExercise(item, 'read', course, state.progress));
    if (item.kind === 'word' && !newIds.includes(item.id)) {
      queue.push(makeExercise(item, 'meaning', course, state.progress));
      if (state.settings.typing) queue.push(makeExercise(item, 'type', course, state.progress));
    }
  }
  const match = makeMatch([...targets, ...due]);
  if (match) queue.push(match);
  const combination = mode === 'learn' && targets.some(i => ['consonant', 'vowel'].includes(i.kind))
    ? makeCombination([...targets, ...course.items.filter(i => trained(i.id, state.progress))], course) : undefined;
  if (combination) queue.push(combination);
  return {
    id: uid(), courseId: course.id, mode, unitId: mode === 'learn' ? unit?.id : undefined,
    queue, index: 0, outcomes: {}, introduced: [], answers: 0, correct: 0,
    startedAt: now.toISOString(), activeSeconds: 0, repairCount: {}, newIds,
  };
}
export const checkTyped = (item: Knowledge, answer: string) =>
  [item.roman, item.officialRoman, ...(item.aliases || []), ...(item.conventionalNames || [])].filter((v): v is string => !!v)
    .some(v => normalizeAnswer(v) === normalizeAnswer(answer));

// Saved sessions keep their order and answers, but follow corrected course notation.
export function refreshSessionNotation(session: Session): Session {
  const course = courses[session.courseId];
  return { ...session, queue: session.queue.map(exercise => {
    const item = itemMap[exercise.itemId];
    if (exercise.kind === 'read' && item.kind !== 'rule') {
      const prompt = course.type === 'phonetics' ? '这个音标描述什么声音？'
        : item.kind === 'number' ? '这个数字是多少？' : `选择正确的${course.romanizationName || '转写'}与 IPA`;
      return { ...exercise, prompt, options: exercise.options.map(option => ({
        ...option, label: Object.hasOwn(itemMap, option.id) ? reading(itemMap[option.id]) : option.label,
      })) };
    }
    if (exercise.kind === 'reverse') return { ...exercise, display: reading(item) };
    if (exercise.kind === 'type') return {
      ...exercise, prompt: `写出${course.romanizationName || '转写'}`, answer: item.roman,
    };
    if (exercise.kind === 'match') return {
      ...exercise, pairs: exercise.pairs?.map(pair => ({ ...pair, right: reading(itemMap[pair.id]) })),
    };
    if (exercise.combination) {
      const [consonant, vowel] = exercise.combination.parts.map(id => itemMap[id]);
      const roman = consonant.roman + vowel.roman;
      return {
        ...exercise, combination: { ...exercise.combination, roman },
        options: exercise.options.map(option => {
          const candidate = course.items.find(i => i.kind === 'consonant'
            && option.label.endsWith(` /${i.ipa + vowel.ipa}/`));
          return candidate ? { ...option, label: `${candidate.roman + vowel.roman} /${candidate.ipa + vowel.ipa}/` } : option;
        }),
      };
    }
    return exercise;
  }) };
}

export function advanceIntro(state: AppState): AppState {
  const session = state.session!;
  const itemId = session.queue[session.index].itemId;
  const old = state.progress[itemId];
  return {
    ...state,
    progress: {
      ...state.progress, [itemId]: old ? { ...old, introduced: true } : {
        introduced: true, correct: 0, wrong: 0, modes: [], lastSeen: new Date().toISOString(),
      },
    },
    session: { ...session, index: session.index + 1, introduced: [...new Set([...session.introduced, itemId])] },
  };
}
export function answerExercise(
  state: AppState, correct: boolean, hinted: boolean, pairResults?: Record<string, boolean>,
): AppState {
  const session = state.session!;
  const exercise = session.queue[session.index];
  const outcomes = { ...session.outcomes };
  const ids = exercise.kind === 'match' ? (exercise.pairs || []).map(p => p.id)
    : exercise.kind === 'combine' ? exercise.combination!.parts : [exercise.itemId];
  let queue = [...session.queue];
  const repairCount = { ...session.repairCount };
  for (const id of ids) {
    const ok = exercise.kind === 'match' ? pairResults?.[id] !== false : correct;
    const old: Outcome = outcomes[id] || { correct: 0, wrong: 0, hinted: false, modes: [] };
    outcomes[id] = {
      correct: old.correct + Number(ok), wrong: old.wrong + Number(!ok),
      hinted: old.hinted || hinted,
      modes: ok && !hinted ? [...new Set([...old.modes, exercise.kind])] : old.modes,
    };
    if (!ok && (repairCount[id] || 0) < 2) {
      const repair = makeExercise(itemMap[id], exercise.kind === 'reverse' ? 'read' : 'reverse', courses[session.courseId], state.progress);
      repair.repair = true;
      const insertAt = Math.min(queue.length, session.index + 4);
      queue.splice(insertAt, 0, repair);
      repairCount[id] = (repairCount[id] || 0) + 1;
    }
  }
  return {
    ...state, session: {
      ...session, queue, repairCount, outcomes, answers: session.answers + 1,
      correct: session.correct + Number(correct), index: session.index + 1,
    },
  };
}
function deserialize(card: StoredCard): Card {
  return {
    ...card, due: new Date(card.due), last_review: card.last_review ? new Date(card.last_review) : undefined,
  } as Card;
}
function serialize(card: Card): StoredCard {
  return {
    ...card, due: card.due.toISOString(),
    last_review: card.last_review?.toISOString(),
  };
}
export function finishSession(state: AppState, now = new Date()): AppState {
  const session = state.session;
  if (!session) return state;
  if (!session.answers) return { ...state, session: undefined };
  const progress = { ...state.progress };
  for (const [id, outcome] of Object.entries(session.outcomes)) {
    const old: ItemProgress = progress[id] || {
      introduced: true, correct: 0, wrong: 0, modes: [], lastSeen: now.toISOString(),
    };
    const card = old.card ? deserialize(old.card) : createEmptyCard(now);
    const rating = outcome.wrong > 0 ? Rating.Again : outcome.hinted ? Rating.Hard : Rating.Good;
    const scheduled = scheduler.next(card, now, rating);
    progress[id] = {
      introduced: true, correct: old.correct + outcome.correct, wrong: old.wrong + outcome.wrong,
      modes: [...new Set([...old.modes, ...outcome.modes])],
      lastSeen: now.toISOString(), card: serialize(scheduled.card),
    };
  }
  return {
    ...state, progress, session: undefined,
    history: [...state.history, {
      id: session.id, courseId: session.courseId, date: now.toISOString(),
      answers: session.answers, correct: session.correct, newCount: session.newIds.filter(id => !!session.outcomes[id]).length,
      minutes: Math.max(1, Math.round(session.activeSeconds / 60)),
    }].slice(-1000),
  };
}
export function localDay(date: Date | string = new Date()): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function streak(state: AppState, now = new Date()): number {
  const days = new Set(state.history.map(h => localDay(h.date)));
  const cursor = new Date(now);
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(localDay(cursor))) { count++; cursor.setDate(cursor.getDate() - 1); }
  return count;
}
export function cardStatus(p?: ItemProgress): 'new' | 'learning' | 'review' {
  if (!p?.introduced) return 'new';
  return p.card?.state === 2 && p.card.reps >= 2 ? 'review' : 'learning';
}
