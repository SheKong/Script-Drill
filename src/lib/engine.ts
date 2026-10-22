import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs';
import { courses, itemMap } from '../data';
import { learningPolicy } from '../data/template';
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
  if (!p?.introduced || p.correct < (itemMap[id]?.kind === 'rule' ? 1 : 2)) return false;
  return itemMap[id]?.kind === 'rule' ? p.modes.includes('read') : (p.modes.includes('read') && p.modes.includes('reverse'));
};
export const eligibleWords = (course: Course, progress: AppState['progress']) =>
  course.items.filter(i => i.kind === 'word' && !i.extra && i.requires.every(id => trained(id, progress)));
export const unitLearned = (unit: Unit, progress: AppState['progress']) => unit.items.every(id => trained(id, progress));
export const unitDone = (unit: Unit, progress: AppState['progress'], reviews: AppState['completedUnitReviews'] = {}) =>
  unitLearned(unit, progress) && !!reviews[unit.id];
export const unitOpen = (course: Course, index: number, progress: AppState['progress'], reviews?: AppState['completedUnitReviews']) =>
  index === 0 || course.units.slice(0, index).every(u => unitDone(u, progress, reviews));
export const nextUnit = (course: Course, progress: AppState['progress'], reviews?: AppState['completedUnitReviews']) =>
  course.units.find(u => !unitDone(u, progress, reviews));
export const mainComplete = (course: Course, state: AppState) =>
  !nextUnit(course, state.progress, state.completedUnitReviews);
export const extrasOpen = (course: Course, state: AppState) =>
  mainComplete(course, state) || !!state.earlyExtraUnlocks?.[course.id];
const ruleReviewReady = (item: Knowledge, progress: AppState['progress'], now: Date) =>
  item.kind !== 'rule' || !trained(item.id, progress)
  || now.getTime() - Date.parse(progress[item.id].lastSeen) >= learningPolicy.ruleReviewGapDays * 86400000;
export const reviewDueAt = (item: Knowledge, progress: AppState['progress']) => {
  const saved = progress[item.id];
  if (!saved?.card) return Infinity;
  return Math.max(Date.parse(saved.card.due), item.kind === 'rule' && trained(item.id, progress)
    ? Date.parse(saved.lastSeen) + learningPolicy.ruleReviewGapDays * 86400000 : 0);
};
export const dueItems = (course: Course, progress: AppState['progress'], now = new Date()) =>
  course.items.filter(i => reviewDueAt(i, progress) <= now.getTime())
    .sort((a, b) => reviewDueAt(a, progress) - reviewDueAt(b, progress));
export const weakItems = (course: Course, progress: AppState['progress'], now = new Date()) =>
  course.items.filter(i => progress[i.id]?.wrong > 0 && (
    progress[i.id].card?.state === 3 || progress[i.id].wrong >= progress[i.id].correct / 3
  ) && ruleReviewReady(i, progress, now)).sort((a, b) => progress[b.id].wrong - progress[a.id].wrong);

function equivalence(item: Knowledge): string {
  if (item.kind === 'rule') return item.ruleAnswer || item.title;
  // Same sound must never compete as unique reverse answers, even if romanizations differ.
  return item.ipa || item.roman;
}
function poolFor(item: Knowledge, course: Course, progress: AppState['progress']): Knowledge[] {
  const peers = course.items.filter(i => i.kind === item.kind && i.id !== item.id && !i.obsolete
    && (!i.extra || item.extra || introduced(i.id, progress)));
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
  if (kind === 'mark' && course.recognition) {
    const mark = course.recognition.marks.find(character => item.glyph.includes(character))!;
    const choices = [mark, ...shuffle(course.recognition.distractors).slice(0, 3)];
    return { ...base, prompt: course.recognition.prompt, answer: mark,
      options: shuffle(choices).map(character => ({ id: character, label: `◌${character}` })) };
  }
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
export function makeMatch(items: Knowledge[], fillers: Knowledge[] = []): Exercise | undefined {
  const used = new Set<string>();
  const glyphs = new Set<string>();
  const ids = new Set<string>();
  const candidates = [...shuffle(items), ...shuffle(fillers)].filter(i => i.kind !== 'rule')
    .filter(i => {
      const key = equivalence(i);
      if (used.has(key) || glyphs.has(i.glyph) || ids.has(i.id)) return false;
      used.add(key); glyphs.add(i.glyph); ids.add(i.id); return true;
    }).slice(0, 5);
  if (candidates.length < 2) return undefined;
  return {
    id: uid(), kind: 'match', itemId: candidates[0].id,
    prompt: '文字与读音配对', display: '', options: [], answer: '',
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
function limitRules(items: Knowledge[]): Knowledge[] {
  let rules = 0;
  return items.filter(item => item.kind !== 'rule' || rules++ < learningPolicy.ruleReviewLimit);
}

export function makeUnitReview(unit: Unit, course: Course, state: AppState, now: Date): Exercise[] {
  const allTargets = unit.items.map(id => itemMap[id]);
  const familiar = course.items.filter(item => trained(item.id, state.progress) && item.kind !== 'rule');
  const rules = limitRules(allTargets.filter(item => item.kind === 'rule' && ruleReviewReady(item, state.progress, now)));
  const targets = allTargets.filter(item => item.kind !== 'rule');
  const due = limitRules(dueItems(course, state.progress, now).filter(item => !allTargets.includes(item))).slice(0, 16);
  const duePractical = due.filter(item => item.kind !== 'rule');
  const queue: Exercise[] = [];
  const budget = learningPolicy.unitReviewMax - learningPolicy.unitReviewRepairReserve;
  // Cover the entire unit before spending the remaining budget on varied retrieval.
  for (let offset = 0; offset < targets.length; offset += 5) {
    const group = targets.slice(offset, offset + 5);
    const match = makeMatch(group, familiar);
    if (match) queue.push(match);
    for (const item of group) {
      if (!match?.pairs?.some(pair => pair.id === item.id)) queue.push(makeExercise(item, 'read', course, state.progress));
    }
  }
  for (const item of [...rules, ...duePractical]) {
    if (queue.length >= budget) break;
    queue.push(makeExercise(item, 'read', course, state.progress));
  }
  const practice = [...targets, ...duePractical, ...shuffle(familiar.filter(item => !targets.includes(item) && !duePractical.includes(item)))];
  const contextual = practice.filter(item => item.kind === 'word' && course.recognition?.marks.some(mark => item.glyph.includes(mark)));
  for (const item of shuffle(contextual).slice(0, 2)) {
    if (queue.length < budget) queue.push(makeExercise(item, 'mark', course, state.progress));
  }
  const combination = targets.some(item => ['consonant', 'vowel'].includes(item.kind))
    ? makeCombination([...targets, ...familiar], course) : undefined;
  if (combination && queue.length < budget) queue.push(combination);
  if (!practice.length && !queue.length) {
    // An introductory rules-only unit gets a short check, never thirty copies.
    for (const item of limitRules(allTargets)) queue.push(makeExercise(item, 'read', course, state.progress));
  }
  for (let round = 0; practice.length && queue.length < learningPolicy.unitReviewTarget; round++) {
    for (const [index, item] of practice.entries()) {
      if (queue.length >= learningPolicy.unitReviewTarget || queue.length >= budget) break;
      const kinds: ExerciseKind[] = ['read', 'reverse'];
      if (state.settings.typing && course.type === 'script' && item.roman) kinds.push('type');
      if (item.kind === 'word') kinds.push('meaning');
      queue.push(makeExercise(item, kinds[(round + index) % kinds.length], course, state.progress));
    }
  }
  return queue;
}
export function createSession(
  state: AppState, mode: Session['mode'], unitId?: string, customIds?: string[], now = new Date(),
): Session | undefined {
  const course = courses[state.courseId];
  const units = mode === 'extra' ? course.extraUnits || [] : course.units;
  const unit = units.find(u => u.id === unitId) || (mode === 'extra'
    ? units.find(u => !unitDone(u, state.progress, state.completedUnitReviews))
    : nextUnit(course, state.progress, state.completedUnitReviews));
  const unitIndex = unit ? course.units.indexOf(unit) : -1;
  if (mode === 'learn' && (!unit || !unitOpen(course, unitIndex, state.progress, state.completedUnitReviews))) return undefined;
  if (mode === 'extra' && (!unit || !extrasOpen(course, state))) return undefined;
  const learning = mode === 'learn' || mode === 'extra';
  const unitReview = learning && unit && unitLearned(unit, state.progress);
  let targets: Knowledge[];
  if (mode === 'custom') targets = (customIds || []).map(id => itemMap[id]).filter(i => i?.courseId === course.id && introduced(i.id, state.progress));
  else if (mode === 'review') targets = limitRules(dueItems(course, state.progress, now)).slice(0, 8);
  else if (mode === 'mistakes') targets = limitRules(weakItems(course, state.progress, now)).slice(0, 6);
  else if (unitReview) {
    targets = unit.items.map(id => itemMap[id]);
  } else {
    const available = unit?.items.map(id => itemMap[id]).filter(i => !trained(i.id, state.progress)) || [];
    const selected: Knowledge[] = [];
    const availableKnowledge = new Set(Object.keys(state.progress).filter(id => trained(id, state.progress)));
    for (const item of available) {
      if (mode !== 'extra' && !item.requires.every(id => availableKnowledge.has(id))) continue;
      selected.push(item);
      // Earlier units may have prerequisites within the same unit. Those are deliberately
      // deferred until the next lesson, when their prerequisite has actually been practiced.
      if (selected.length >= (unit?.supplementary || mode === 'extra' ? Math.max(6, state.settings.newPerLesson) : state.settings.newPerLesson)) break;
    }
    targets = selected;
    const readyWord = !unit?.supplementary && mode !== 'extra'
      ? eligibleWords(course, state.progress).find(i => !introduced(i.id, state.progress) && !targets.includes(i)) : undefined;
    if (readyWord) targets = [...targets, readyWord];
  }
  if (!targets.length) return undefined;
  if (unitReview) return {
    id: uid(), courseId: course.id, mode, unitId: unit.id, stage: 'unit-review',
    queue: makeUnitReview(unit, course, state, now), index: 0, outcomes: {}, introduced: [],
    answers: 0, correct: 0, startedAt: now.toISOString(), activeSeconds: 0, repairCount: {}, newIds: [],
  };
  const queue: Exercise[] = [];
  const newIds = targets.filter(i => !introduced(i.id, state.progress)).map(i => i.id);
  const due = learning ? limitRules(dueItems(course, state.progress, now).filter(i => !targets.includes(i))).slice(0, 4) : [];
  for (let n = 0; n < targets.length; n++) {
    const item = targets[n];
    appendTraining(queue, item, course, state, newIds.includes(item.id));
    if (n > 0 && targets[n - 1].kind !== 'rule') queue.push(makeExercise(targets[n - 1], 'reverse', course, state.progress));
    if (!unitReview && due[n]) queue.push(makeExercise(due[n], 'read', course, state.progress));
  }
  if (targets[targets.length - 1].kind !== 'rule') queue.push(makeExercise(targets[targets.length - 1], 'reverse', course, state.progress));
  // A second, separated retrieval is required for progression, not passive introduction.
  for (const item of targets) {
    if (item.kind === 'word' && !newIds.includes(item.id)) {
      queue.push(makeExercise(item, 'meaning', course, state.progress));
    }
    if (state.settings.typing && course.type === 'script' && item.kind !== 'rule' && item.roman
      && (!newIds.includes(item.id) || item.kind !== 'word')) queue.push(makeExercise(item, 'type', course, state.progress));
    if (item.kind === 'word' && course.recognition?.marks.some(mark => item.glyph.includes(mark))) {
      queue.push(makeExercise(item, 'mark', course, state.progress));
    }
  }
  const familiar = course.items.filter(i => trained(i.id, state.progress));
  const matching = targets.filter(i => i.kind !== 'rule');
  for (let offset = 0; offset < Math.max(1, matching.length); offset += 5) {
    const match = makeMatch(matching.slice(offset, offset + 5), [...matching, ...due, ...familiar]);
    if (match) queue.push(match);
  }
  const combination = learning && targets.some(i => ['consonant', 'vowel'].includes(i.kind))
    ? makeCombination([...targets, ...course.items.filter(i => trained(i.id, state.progress))], course) : undefined;
  if (combination) queue.push(combination);
  return {
    id: uid(), courseId: course.id, mode, unitId: learning ? unit?.id : undefined,
    stage: unitReview ? 'unit-review' : undefined,
    queue, index: 0, outcomes: {}, introduced: [], answers: 0, correct: 0,
    startedAt: now.toISOString(), activeSeconds: 0, repairCount: {}, newIds,
  };
}
export const checkTyped = (item: Knowledge, answer: string) =>
  [item.roman, item.officialRoman, ...(item.aliases || []), ...(item.conventionalNames || [])].filter((v): v is string => !!v)
    .some(v => normalizeAnswer(v) === normalizeAnswer(answer));

// Saved sessions keep their order and answers, but follow corrected course notation.
export function refreshSessionNotation(session: Session): Session {
  if (session.stage === 'unit-review' && session.queue.length > learningPolicy.unitReviewMax) {
    // Retain confirmed outcomes; an already over-budget legacy review needs only its current question.
    session = session.index < learningPolicy.unitReviewMax
      ? { ...session, queue: session.queue.slice(0, learningPolicy.unitReviewMax) }
      : { ...session, queue: [session.queue[session.index]], index: 0 };
  }
  const course = courses[session.courseId];
  return { ...session, queue: session.queue.map(exercise => {
    const item = itemMap[exercise.itemId];
    if (exercise.kind === 'read' && item.kind === 'rule') {
      let distractor = 0;
      return { ...exercise, prompt: item.rulePrompt!, display: item.glyph,
        options: exercise.options.map(option => ({
          ...option, label: option.id === exercise.answer ? item.ruleAnswer! : item.ruleChoices![distractor++],
        })) };
    }
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
    if (!ok && (repairCount[id] || 0) < (itemMap[id].kind === 'rule' ? 1 : 2)
      && (session.stage !== 'unit-review' || queue.length < learningPolicy.unitReviewMax)) {
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
    completedUnitReviews: session.stage === 'unit-review' && session.unitId
      && session.index >= session.queue.length
      ? { ...state.completedUnitReviews, [session.unitId]: true } : state.completedUnitReviews,
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
