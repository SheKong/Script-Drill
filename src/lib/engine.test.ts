import { describe, expect, it } from 'vitest';
import { allItems, courses, itemMap } from '../data';
import recordingManifest from '../data/recordings.json' with { type: 'json' };
import type { AppState, Session } from '../types';
import { existsSync, statSync } from 'node:fs';
import { initialState, parseBackup } from './storage';
import {
  advanceIntro, answerExercise, checkTyped, createSession, eligibleWords, finishSession,
  makeCombination, makeExercise, makeMatch, nextUnit, normalizeAnswer, reading, refreshSessionNotation,
  mainComplete, streak, trained, unitDone, unitOpen,
} from './engine';

function learnedState(courseId: 'thai' | 'ipa' = 'thai'): AppState {
  const state = initialState();
  state.courseId = courseId;
  state.completedUnitReviews = Object.fromEntries(courses[courseId].units.filter(unit => !unit.supplementary).map(unit => [unit.id, true]));
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
      expect(order.length).toBe(course.items.filter(i => !i.extra).length);
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
  it('uses RTGS as the Thai primary notation and keeps phonetic contrasts in IPA', () => {
    expect(courses.thai.romanizationName).toBe('RTGS');
    expect(itemMap['th-j'].roman).toBe('ch');
    expect(itemMap['th-ch'].roman).toBe('ch');
    expect(reading(itemMap['th-j'])).not.toBe(reading(itemMap['th-ch']));
    expect(itemMap['th-aa'].roman).toBe('a');
    expect(itemMap['th-a'].roman).toBe('a');
    expect(reading(itemMap['th-aa'])).not.toBe(reading(itemMap['th-a']));
    expect(reading(itemMap['th-o'])).toBe('不写 /ʔ/');
    expect(itemMap['th-word-na'].roman).toBe('na');
    expect(itemMap['th-word-changwat'].roman).toBe('changwat');
    expect(itemMap['th-word-bangkok'].conventionalNames).toContain('Bangkok');
    expect(itemMap['th-word-khonkaen'].segments?.[0].reading).toBe('khon');
    expect(courses.thai.items.every(item => !item.officialRoman)).toBe(true);
  });
  it('declares script variants and speech only where the course explicitly supplies them', () => {
    expect(courses.thai.scriptVariants?.map(v => v.className)).toEqual(['thai', 'thai-modern']);
    expect(courses.ipa.scriptVariants).toBeUndefined();
    expect(courses.ipa.items.every(i => !i.pronunciation?.speech)).toBe(true);
    for (const item of courses.thai.items) {
      const speech = item.pronunciation?.speech;
      if (!speech) continue;
      expect(speech.text).toBeTruthy();
      expect(speech.label).toBeTruthy();
      expect(speech.text).not.toContain('◌');
      expect(speech.text).toMatch(/[\u0e01-\u0e5b]/u);
      if (item.kind === 'consonant') expect(speech.text.length).toBeGreaterThan(1);
    }
  });
  it('ships every advertised recording with source, author and license', () => {
    const recordings = allItems.flatMap(i => i.pronunciation?.recording ? [i.pronunciation.recording] : []);
    expect(recordings.length).toBeGreaterThanOrEqual(30);
    for (const recording of recordings) {
      const file = new URL(`../../public${recording.src}`, import.meta.url);
      expect(existsSync(file), recording.src).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(500);
      expect(recording.author).toBeTruthy();
      expect(recording.license).toMatch(/^(CC(?: |0)|Public domain$)/);
      expect(recording.sourceUrl).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
      expect(recording.licenseUrl).toMatch(/^https:\/\/(creativecommons.org\/|commons.wikimedia.org\/wiki\/Template:PD-user-en$)/);
    }
  });
  it('covers IPA sounds without substituting an unaspirated recording for the remaining aspirated velar', () => {
    const symbols = courses.ipa.items.filter(item => item.kind === 'symbol');
    expect(symbols.filter(item => item.pronunciation?.recording).length).toBeGreaterThanOrEqual(63);
    expect(symbols.filter(item => !item.pronunciation?.recording).every(item => item.id === 'ipa-kh')).toBe(true);
    for (const [aspirated, plain] of [['ph', 'p'], ['th', 't'], ['chh', 'ch']]) {
      expect(itemMap[`ipa-${aspirated}`].pronunciation?.recording?.src)
        .not.toBe(itemMap[`ipa-${plain}`].pronunciation?.recording?.src);
    }
  });
  it('keeps downloaded recordings traceable and attached to an actual knowledge item', () => {
    for (const [id, recording] of Object.entries(recordingManifest)) {
      expect(itemMap[id]?.pronunciation?.recording?.src, id).toBe(recording.src);
      expect(recording.originalSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(recording.originalUrl).toMatch(/^https:\/\/upload.wikimedia.org\//);
      expect(recording.revision).toBeGreaterThan(0);
      expect(recording.change).toContain('MP3');
    }
  });
  it('binds Thai recordings to the same explicit text as synthesis and online listening', () => {
    const recorded = courses.thai.items.filter(item => item.pronunciation?.recording);
    expect(recorded.length).toBeGreaterThanOrEqual(15);
    for (const item of recorded) {
      expect(item.pronunciation!.recording!.spokenText, item.id).toBe(item.pronunciation!.speech?.text);
    }
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
  it('fills five pairs without homophones or duplicates, including word readings', () => {
    const cons = courses.thai.items.filter(i => i.kind === 'consonant');
    for (let run = 0; run < 100; run++) {
      const match = makeMatch([...cons, ...cons])!;
      expect(match.pairs).toHaveLength(5);
      expect(new Set(match.pairs!.map(p => p.id)).size).toBe(match.pairs!.length);
      expect(new Set(match.pairs!.map(p => itemMap[p.id].ipa)).size).toBe(match.pairs!.length);
    }
    expect(makeMatch([itemMap['th-k'], itemMap['th-word-na']])?.pairs?.[1].right).not.toContain('田地');
    expect(makeMatch([itemMap['th-word-na']], cons)?.pairs).toHaveLength(5);
  });
  it('accepts RTGS, declared conventional names and legacy input aliases, not guesses', () => {
    expect(normalizeAnswer(' Chiang-Mai ')).toBe('chiangmai');
    expect(checkTyped(itemMap['th-word-chiangmai'], 'Chiang Mai')).toBe(true);
    expect(checkTyped(itemMap['th-j'], 'j')).toBe(true);
    expect(checkTyped(itemMap['th-j'], 'ch')).toBe(true);
    expect(checkTyped(itemMap['th-j'], 'dzh')).toBe(false);
    expect(checkTyped(itemMap['th-word-na'], 'naa')).toBe(true);
    expect(checkTyped(itemMap['th-word-na'], 'na')).toBe(true);
    expect(checkTyped(itemMap['th-word-bangkok'], 'Bangkok')).toBe(true);
    expect(checkTyped(itemMap['th-word-ko'], 'Koh')).toBe(true);
    expect(checkTyped(itemMap['th-word-ko'], 'koa')).toBe(false);
    expect(makeExercise(itemMap['th-word-na'], 'type', courses.thai, {}).prompt).toBe('写出RTGS');
    expect(makeExercise(itemMap['th-word-na'], 'type', { ...courses.thai, romanizationName: '另一方案' }, {}).prompt).toBe('写出另一方案');
  });
  it('generates novel syllable exercises from taught consonants and supported vowel patterns', () => {
    const known = [itemMap['th-k'], itemMap['th-ee']];
    const q = makeCombination(known, courses.thai)!;
    expect(q.display).toBe('เก');
    expect(q.combination).toEqual({ glyph: 'เก', roman: 'ke', ipa: 'keː', parts: ['th-k', 'th-ee'] });
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
    expect(state.progress['th-tone-overview'].introduced).toBe(true);
    expect(trained('th-tone-overview', state.progress)).toBe(false);
    expect(createSession(state, 'learn', courses.thai.units[1].id)).toBeUndefined();
  });
  it('requires both directions and does not credit failed or hinted retrieval modes', () => {
    let state = initialState();
    state.session = createSession(state, 'learn')!;
    state = advanceIntro(state);
    state = answerExercise(state, false, false);
    expect(state.session?.outcomes['th-tone-overview'].modes).not.toContain('read');
    expect(trained('th-k', { 'th-k': { introduced: true, correct: 5, wrong: 0, modes: ['read'], lastSeen: new Date().toISOString() } })).toBe(false);
  });
  it('unlocks every unit without dead ends via real perfect sessions', () => {
    for (const course of Object.values(courses)) {
      let state = initialState(); state.courseId = course.id;
      for (let step = 0; step < 200 && nextUnit(course, state.progress, state.completedUnitReviews); step++) {
        const session = createSession(state, 'learn');
        expect(session, `blocked at ${course.id} ${nextUnit(course, state.progress)?.id}`).toBeDefined();
        state = completePerfect({ ...state, session });
      }
      expect(course.units.every(u => unitDone(u, state.progress, state.completedUnitReviews))).toBe(true);
      expect(mainComplete(course, state)).toBe(true);
      expect(createSession(state, 'learn')).toBeUndefined();
      for (const unit of course.extraUnits || []) {
        for (let step = 0; step < 20 && !unitDone(unit, state.progress, state.completedUnitReviews); step++) {
          const session = createSession(state, 'extra', unit.id);
          expect(session, unit.id).toBeDefined();
          expect(() => parseBackup(JSON.stringify({ ...state, session }))).not.toThrow();
          state = completePerfect({ ...state, session });
        }
        expect(unitDone(unit, state.progress, state.completedUnitReviews)).toBe(true);
      }
    }
  });
  it('batches remaining main words into an explicit supplement and keeps extra words locked', () => {
    const state = learnedState();
    expect(eligibleWords(courses.thai, state.progress)).toHaveLength(courses.thai.items.filter(i => i.kind === 'word' && !i.extra).length);
    delete state.progress['th-leading-h'];
    expect(eligibleWords(courses.thai, state.progress).some(i => i.id === 'th-word-chiangmai')).toBe(false);
    const session = createSession(learnedState(), 'learn')!;
    expect(session.unitId).toBe('thai-supplement');
    expect(session.newIds.filter(id => itemMap[id].kind === 'word').length).toBeGreaterThanOrEqual(6);
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
    expect(result.progress['th-tone-overview'].introduced).toBe(true);
    expect(result.progress['th-tone-overview'].card).toBeUndefined();
  });
  it('keeps pair errors and uses Again even if a later repair is correct', () => {
    const state = initialState();
    const session = createSession(state, 'learn')!;
    session.queue.push(makeMatch([itemMap['th-k'], itemMap['th-n']])!);
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
  it('updates an old rule question to its current teaching goal without changing answer IDs', () => {
    const state = learnedState();
    state.session = createSession(state, 'custom', undefined, ['th-tone1'])!;
    const question = state.session.queue[0];
    question.prompt = '低类声母配第一调号通常得到什么声调？';
    question.options = question.options.map(option => ({ ...option, label: option.id === question.answer ? '降调' : '旧声调选项' }));
    const restored = parseBackup(JSON.stringify(state)).session!.queue[0];
    expect(restored.prompt).toBe('ท่า 中哪个是声调符号？');
    expect(restored.options.map(option => option.id)).toEqual(question.options.map(option => option.id));
    expect(restored.options.find(option => option.id === restored.answer)?.label).toBe('◌่');
  });
  it('refreshes old session notation without losing IDs, ordering or progress', () => {
    const state = learnedState();
    state.progress['th-word-na'] = { introduced: true, correct: 3, wrong: 1, modes: ['read', 'reverse'], lastSeen: new Date().toISOString() };
    const session = createSession(state, 'custom', undefined, ['th-word-na'])!;
    const question = session.queue.find(q => q.kind === 'read')!;
    question.prompt = '选择正确的教学转写与 IPA';
    question.options.find(o => o.id === question.answer)!.label = 'naa /naː/';
    const typed = session.queue.find(q => q.kind === 'type')!;
    typed.answer = 'naa';
    const combination = makeCombination([itemMap['th-k'], itemMap['th-ee']], courses.thai)!;
    combination.combination!.roman = 'kee';
    combination.options.find(o => o.id === combination.answer)!.label = 'kee /keː/';
    session.queue.push(combination);
    state.session = session;
    const parsed = parseBackup(JSON.stringify(state));
    expect(parsed.progress).toEqual(state.progress);
    expect(parsed.session!.queue.map(q => q.id)).toEqual(session.queue.map(q => q.id));
    expect(parsed.session!.queue.find(q => q.id === question.id)!.options.find(o => o.id === question.answer)!.label).toBe('na /naː/');
    expect(parsed.session!.queue.find(q => q.id === typed.id)!.answer).toBe('na');
    expect(parsed.session!.queue.at(-1)!.combination!.roman).toBe('ke');
    expect(parsed.session!.queue.at(-1)!.options.find(o => o.id === combination.answer)!.label).toBe('ke /keː/');
    expect(refreshSessionNotation(parsed.session!)).toEqual(parsed.session);
  });
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
