import { describe, expect, it } from 'vitest';
import { allItems, courses, itemMap } from '../data';
import type { AppState, Session } from '../types';
import { initialState, parseBackup } from './storage';
import {
  advanceIntro, answerExercise, checkTyped, createSession, eligibleWords, finishSession,
  makeCombination, makeExercise, makeMatch, nextUnit, normalizeAnswer, streak, trained, unitDone, unitOpen,
} from './engine';

function learnedState(courseId: 'thai' | 'ipa' = 'thai'): AppState {
  const state = initialState();
  state.courseId = courseId;
  for (const item of courses[courseId].items.filter(i => i.kind !== 'word')) {
    state.progress[item.id] = { introduced: true, correct: 4, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString() };
  }
  return state;
}
function completePerfect(state: AppState): AppState {
  let next = state;
  while (next.session && next.session.index < next.session.queue.length) {
    const exercise = next.session.queue[next.session.index];
    next = exercise.kind === 'intro' ? advanceIntro(next) : answerExercise(next, true, false);
  }
  return finishSession(next);
}
describe('course content invariants', () => {
  it('has unique IDs and complete prerequisite/source graphs', () => {
    expect(new Set(allItems.map(i => i.id)).size).toBe(allItems.length);
    for (const course of Object.values(courses)) {
      expect(course.items.length).toBeGreaterThanOrEqual(4);
      expect(course.units.length).toBeGreaterThan(0);
      expect(course.sources.length).toBeGreaterThan(0);
      const owned = new Set(course.items.map(i => i.id));
      const references = new Set(course.sources.map(s => s.id));
      for (const item of course.items) {
        expect(item.courseId).toBe(course.id);
        expect(item.explanation.length).toBeGreaterThan(10);
        for (const ref of item.sources) expect(references.has(ref), `${item.id} source ${ref}`).toBe(true);
        for (const pre of item.requires) expect(owned.has(pre), `${item.id} prerequisite ${pre}`).toBe(true);
        if (item.kind === 'rule') {
          expect(item.rulePrompt).toBeTruthy();
          expect(item.ruleChoices).toHaveLength(3);
          expect(new Set([item.ruleAnswer, ...item.ruleChoices!]).size).toBe(4);
        }
      }
      const order = course.units.flatMap(u => u.items);
      expect(new Set(order).size).toBe(order.length);
      expect(order.length).toBe(course.items.filter(i => i.kind !== 'word').length);
      for (const id of order) {
        for (const pre of itemMap[id].requires) {
          expect(order.indexOf(pre), `${id} depends on future ${pre}`).toBeLessThan(order.indexOf(id));
        }
      }
      if (course.composition) {
        for (const id of course.composition.vowelIds) {
          expect(owned.has(id)).toBe(true);
          expect(itemMap[id].glyph.split('◌')).toHaveLength(2);
          expect(itemMap[id].kind).toBe('vowel');
        }
      }
    }
  });
  it('covers all 44 Thai consonants and ten distinct digits', () => {
    expect(courses.thai.items.filter(i => i.kind === 'consonant')).toHaveLength(44);
    expect(courses.thai.items.filter(i => i.kind === 'number')).toHaveLength(10);
  });
  it('keeps IPA independent of the Thai course', () => {
    for (const item of courses.ipa.items) expect(item.requires.every(id => id.startsWith('ipa-'))).toBe(true);
    expect(courses.ipa.units.map(u => u.note).join('')).not.toContain('泰');
    expect(courses.ipa.items.filter(i => i.kind === 'symbol').every(i => i.roman === i.title)).toBe(true);
  });
  it('covers every written consonant via letter or whole-vowel prerequisites', () => {
    for (const word of courses.thai.items.filter(i => i.kind === 'word')) {
      const covered = word.requires.map(id => itemMap[id].glyph).join('');
      for (const glyph of Array.from(word.glyph).filter(g => /[\u0e01-\u0e2e]/u.test(g))) {
        expect(covered.includes(glyph), `${word.glyph} missing ${glyph}`).toBe(true);
      }
    }
  });
});
describe('generative exercises', () => {
  it('generates four unambiguous options, with a single answer, in both directions', () => {
    for (const course of Object.values(courses)) {
      for (const item of course.items) {
        for (const kind of ['read', 'reverse'] as const) {
          for (let run = 0; run < 8; run++) {
            const q = makeExercise(item, kind, course, {});
            expect(q.options, `${item.id} ${kind}`).toHaveLength(4);
            expect(q.options.filter(o => o.id === q.answer)).toHaveLength(1);
            expect(new Set(q.options.map(o => o.label)).size).toBe(4);
            if (kind === 'reverse' && item.ipa && item.kind !== 'rule') {
              expect(q.options.filter(o => itemMap[o.id]?.ipa === item.ipa)).toHaveLength(1);
            }
          }
        }
      }
    }
  });
  it('does not pair homophones, duplicates, or word translations', () => {
    const cons = courses.thai.items.filter(i => i.kind === 'consonant');
    for (let run = 0; run < 100; run++) {
      const match = makeMatch([...cons, ...cons])!;
      expect(new Set(match.pairs!.map(p => p.id)).size).toBe(match.pairs!.length);
      expect(new Set(match.pairs!.map(p => itemMap[p.id].ipa)).size).toBe(match.pairs!.length);
    }
    expect(makeMatch([itemMap['th-k'], itemMap['th-word-na']])).toBeUndefined();
  });
  it('accepts case/space variants, teaching transcription and RTGS, not guesses', () => {
    expect(normalizeAnswer(' Chiang-Mai ')).toBe('chiangmai');
    expect(checkTyped(itemMap['th-word-chiangmai'], 'Chiang Mai')).toBe(true);
    expect(checkTyped(itemMap['th-j'], 'j')).toBe(true);
    expect(checkTyped(itemMap['th-j'], 'ch')).toBe(true);
    expect(checkTyped(itemMap['th-j'], 'dzh')).toBe(false);
  });
  it('generates novel syllable exercises from taught consonants and supported vowel patterns', () => {
    const known = [itemMap['th-k'], itemMap['th-ee']];
    const q = makeCombination(known, courses.thai)!;
    expect(q.display).toBe('เก');
    expect(q.combination).toEqual({ glyph: 'เก', roman: 'kee', ipa: 'keː', parts: ['th-k', 'th-ee'] });
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options.map(o => o.label)).size).toBe(4);
    expect(q.options.filter(o => o.id === q.answer)).toHaveLength(1);
    expect(makeCombination([itemMap['th-k']], courses.thai)).toBeUndefined();
    expect(makeCombination(courses.ipa.items, courses.ipa)).toBeUndefined();
  });
});
describe('progression and repetition', () => {
  it('does not count passive introduction as trained or unlock future units', () => {
    let state = initialState();
    state.session = createSession(state, 'learn');
    expect(state.session).toBeDefined();
    expect(unitOpen(courses.thai, 1, state.progress)).toBe(false);
    state = advanceIntro(state);
    expect(state.progress['th-k'].introduced).toBe(true);
    expect(trained('th-k', state.progress)).toBe(false);
    expect(createSession(state, 'learn', courses.thai.units[1].id)).toBeUndefined();
  });
  it('requires both directions and does not credit failed or hinted retrieval modes', () => {
    let state = initialState();
    state.session = createSession(state, 'learn')!;
    state = advanceIntro(state);
    state = answerExercise(state, false, false);
    expect(state.session?.outcomes['th-k'].modes).not.toContain('read');
    expect(trained('th-k', { 'th-k': { introduced: true, correct: 5, wrong: 0, modes: ['read'], lastSeen: new Date().toISOString() } })).toBe(false);
  });
  it('unlocks every unit without dead ends via real perfect sessions', () => {
    for (const course of Object.values(courses)) {
      let state = initialState(); state.courseId = course.id;
      for (let step = 0; step < 200 && nextUnit(course, state.progress); step++) {
        const session = createSession(state, 'learn');
        expect(session, `blocked at ${course.id} ${nextUnit(course, state.progress)?.id}`).toBeDefined();
        state = completePerfect({ ...state, session });
      }
      expect(course.units.every(u => unitDone(u, state.progress))).toBe(true);
    }
  });
  it('unlocks words only with all practiced prerequisites and introduces at most one new word', () => {
    const state = learnedState();
    expect(eligibleWords(courses.thai, state.progress)).toHaveLength(courses.thai.items.filter(i => i.kind === 'word').length);
    delete state.progress['th-leading-h'];
    expect(eligibleWords(courses.thai, state.progress).some(i => i.id === 'th-word-chiangmai')).toBe(false);
    const session = createSession(state, 'learn')!;
    expect(session.newIds.filter(id => itemMap[id].kind === 'word')).toHaveLength(1);
    expect(session.queue.some(q => q.kind === 'meaning' || q.kind === 'type')).toBe(false);
    expect(session.queue.some(q => q.kind === 'intro' && itemMap[q.itemId].kind === 'word')).toBe(false);
  });
  it('adds meaning/input only for previously introduced words', () => {
    const state = learnedState();
    state.progress['th-word-na'] = { introduced: true, correct: 3, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString() };
    const session = createSession(state, 'custom', undefined, ['th-word-na'])!;
    expect(session.queue.some(q => q.kind === 'meaning')).toBe(true);
    expect(session.queue.some(q => q.kind === 'type')).toBe(true);
  });
  it('repeats errors after a gap and caps repairs at two per item', () => {
    let state = initialState();
    state.session = createSession(state, 'learn')!;
    state = advanceIntro(state);
    const original = state.session!;
    state = answerExercise(state, false, false);
    expect(state.session!.queue.length).toBe(original.queue.length + 1);
    const repairs = state.session!.queue.filter(q => q.repair);
    expect(repairs).toHaveLength(1);
    expect(state.session!.queue.indexOf(repairs[0])).toBeGreaterThan(original.index + 1);
    while (state.session!.index < state.session!.queue.length) {
      state = state.session!.queue[state.session!.index].kind === 'intro' ? advanceIntro(state) : answerExercise(state, false, false);
    }
    expect(Object.values(state.session!.repairCount).every(n => n <= 2)).toBe(true);
  });
  it('schedules once per knowledge per lesson and persists dates losslessly', () => {
    const now = new Date('2026-10-19T08:00:00Z');
    let state = initialState();
    state.session = createSession(state, 'learn', undefined, undefined, now);
    state = completePerfect(state);
    for (const p of Object.values(state.progress)) if (p.card) expect(p.card.reps).toBe(1);
    const parsed = parseBackup(JSON.stringify(state));
    expect(parsed).toEqual(state);
    expect(finishSession(parsed)).toEqual(parsed);
  });
  it('does not award history or a streak for passive introduction only', () => {
    const state = initialState();
    state.session = createSession(state, 'learn');
    const result = finishSession(advanceIntro(state));
    expect(result.history).toHaveLength(0);
    expect(result.progress['th-k'].introduced).toBe(true);
    expect(result.progress['th-k'].card).toBeUndefined();
  });
  it('keeps pair errors and uses Again even if a later repair is correct', () => {
    const state = initialState();
    const session = createSession(state, 'learn')!;
    const matchIndex = session.queue.findIndex(q => q.kind === 'match');
    session.index = matchIndex;
    const id = session.queue[matchIndex].pairs![0].id;
    const next = answerExercise({ ...state, session }, false, false, { [id]: false });
    expect(next.session!.outcomes[id].wrong).toBe(1);
    const finished = finishSession(next, new Date('2026-10-19T08:00:00Z'));
    expect(Date.parse(finished.progress[id].card!.due)).toBeLessThan(Date.parse('2026-10-19T08:15:00Z'));
  });
  it('tracks streak by local calendar day with yesterday grace', () => {
    const state = initialState();
    const base = { id: 'x', courseId: 'thai' as const, answers: 1, correct: 1, newCount: 1, minutes: 1 };
    state.history = ['2026-10-18T12:00:00', '2026-10-17T12:00:00'].map(date => ({ ...base, date }));
    expect(streak(state, new Date('2026-10-19T23:00:00'))).toBe(2);
    expect(streak(state, new Date('2026-10-20T12:00:00'))).toBe(0);
  });
});
describe('untrusted backup boundary', () => {
  it('rejects invalid structures and impossible FSRS values', () => {
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup('{"version":2}')).toThrow();
    const state = initialState();
    state.progress['unknown-id'] = { introduced: true, correct: 1, wrong: 0, modes: [], lastSeen: new Date().toISOString() };
    expect(() => parseBackup(JSON.stringify(state))).toThrow();
    const learned = completePerfect({ ...initialState(), session: createSession(initialState(), 'learn') });
    Object.values(learned.progress)[0].card!.difficulty = 200;
    expect(() => parseBackup(JSON.stringify(learned))).toThrow();
  });
  it('validates unfinished session and course consistency', () => {
    const state = initialState();
    state.session = createSession(state, 'learn')!;
    expect(parseBackup(JSON.stringify(state)).session).toBeDefined();
    (state.session as Session).courseId = 'ipa';
    expect(() => parseBackup(JSON.stringify(state))).toThrow();
  });
  it('rejects prototype names, terminal sessions and unanswerable imported questions', () => {
    const poisoned = {
      ...initialState(),
      progress: { constructor: { introduced: true, correct: 0, wrong: 0, modes: [], lastSeen: new Date().toISOString() } },
    };
    expect(() => parseBackup(JSON.stringify(poisoned))).toThrow();
    const pending = initialState();
    pending.session = createSession(pending, 'learn')!;
    pending.session.index = pending.session.queue.length;
    expect(() => parseBackup(JSON.stringify(pending))).toThrow();
    pending.session.index = 0;
    const question = pending.session.queue.find(q => q.kind === 'read')!;
    question.options = [];
    expect(() => parseBackup(JSON.stringify(pending))).toThrow();
  });
  it('rejects oversized content and negative counters', () => {
    expect(() => parseBackup(' '.repeat(5000001))).toThrow();
    const state = learnedState();
    state.progress['th-k'].correct = -1;
    expect(() => parseBackup(JSON.stringify(state))).toThrow();
  });
});
