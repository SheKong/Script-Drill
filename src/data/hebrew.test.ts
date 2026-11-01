import { describe, expect, it } from 'vitest';
import { courses, itemMap } from '.';
import { advanceIntro, answerExercise, checkTyped, createSession, finishSession, mainComplete, makeExercise, makeMatch, normalizeAnswer, unitDone } from '../lib/engine';
import { initialState, parseBackup } from '../lib/storage';
import { rushPool } from '../lib/rush';
import type { AppState } from '../types';
import audit from '../../docs/HEBREW_WORD_AUDIT.json' with { type: 'json' };

const course = courses.hebrew;
const fresh = (): AppState => ({ ...initialState(), courseId: course.id });
describe('modern Hebrew course', () => {
  it('covers the complete basic alphabet, five finals, foreign consonants and modern vowel spellings', () => {
    expect(course.direction).toBe('rtl');
    expect(course.locale).toBe('he');
    expect(course.romanizationName).toBe('UNGEGN 2007');
    expect(course.units).toHaveLength(14);
    const letters = course.items.filter(item => item.group === '辅音与字形');
    expect(new Set(letters.flatMap(item => Array.from(item.glyph).filter(char => /[א-ת]/u.test(char)))).size).toBe(22);
    expect(course.items.filter(item => item.group === '五个词尾形').map(item => item.glyph)).toEqual(['ך', 'ם', 'ן', 'ף', 'ץ']);
    expect(course.items.filter(item => item.kind === 'vowel')).toHaveLength(13);
    expect(course.items.filter(item => item.kind === 'word' && !item.extra)).toHaveLength(24);
    expect(course.extraUnits![0].items).toHaveLength(10);
    expect(course.composition).toBeUndefined();
    expect(course.items.some(item => item.kind === 'number')).toBe(false);
  });
  it('makes soft consonants explicit without pretending an unpointed letter has a unique reading', () => {
    expect(itemMap['he-vet'].glyph).toBe('בֿ');
    expect(itemMap['he-kh'].glyph).toBe('כֿ');
    expect(itemMap['he-f'].glyph).toBe('פֿ');
    for (const id of ['vet', 'kh', 'f']) expect(itemMap[`he-${id}`].requires).toContain('he-rafe');
    expect(itemMap['he-word-avenues'].ipa).toBe('sdeˈʁot');
    expect(itemMap['he-word-avenues'].explanation).toContain('同形城市名');
    const match = makeMatch(['b', 'vet', 'v', 'k', 'kh', 'qof', 'p', 'f', 'alef', 'ayin'].map(id => itemMap[`he-${id}`]))!;
    const entries = match.pairs!.map(pair => itemMap[pair.id]);
    expect(new Set(entries.map(item => item.ipa)).size).toBe(entries.length);
  });
  it('covers every written letter and pointed vowel through real word prerequisites', () => {
    const prerequisites = (ids: string[], seen = new Set<string>()): Set<string> => {
      for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        prerequisites(itemMap[id].requires || [], seen);
      }
      return seen;
    };
    for (const item of course.items.filter(item => item.kind === 'word')) {
      const ids = prerequisites(item.requires || []);
      const taught = new Set([...ids].flatMap(id => {
        const prerequisite = itemMap[id];
        return ['consonant', 'vowel'].includes(prerequisite.kind) ? Array.from(prerequisite.glyph.normalize('NFD')) : [];
      }));
      const pointed = item.pronunciation!.speech!.text;
      // Rule examples are not evidence that their letters or vowel structures were taught.
      for (const char of Array.from(`${item.glyph}${pointed}`.normalize('NFD'))) {
        if (/[א-ת\u05b1-\u05bb\u05c1\u05c2\u05c7]/u.test(char)) {
          expect(taught.has(char), `${item.id}: missing ${char}`).toBe(true);
        }
      }
      if (pointed.includes('\u05b0')) expect(item.requires, item.id).toContain('he-sheva');
      if (pointed.includes('\u05bc')) expect(ids.has('he-rafe'), item.id).toBe(true);
      if (pointed.includes('וֹ')) expect(item.requires, item.id).toContain('he-holam-vav');
      if (pointed.includes('וּ')) expect(item.requires, item.id).toContain('he-shuruq');
    }
  });
  it('accepts ordinary keyboard forms and map names but never an empty apostrophe answer', () => {
    for (const [id, answers] of [
      ['he-word-street', ['reẖov', 'REHOV', 'rechov']],
      ['he-word-west', ["ma'arav", 'ma arav', 'MAARAV']],
      ['he-word-kibbutz', ['kibbuts', 'kibbutz']],
      ['he-word-haifa', ['ẖefa', 'hefa', 'Haifa']],
      ['he-word-akko', ['Akko', 'Acre']],
    ] as [string, string[]][]) {
      for (const answer of answers) expect(checkTyped(itemMap[id], answer), `${id}: ${answer}`).toBe(true);
    }
    for (const id of ['alef', 'ayin']) {
      const item = itemMap[`he-${id}`];
      expect(normalizeAnswer(item.roman)).toBe('');
      expect(makeExercise(item, 'type', course, {}).kind).toBe('read');
      expect(checkTyped(item, "'")).toBe(false);
    }
  });
  it('finishes every mainline unit and its review through actual sessions without unlocking cities early', () => {
    let state = fresh();
    state.settings.typing = true;
    for (const unit of course.units) {
      let count = 0;
      while (!unitDone(unit, state.progress, state.completedUnitReviews) && count++ < 30) {
        const session = createSession(state, 'learn', unit.id);
        expect(session, unit.id).toBeDefined();
        for (const question of session!.queue.filter(question => question.kind === 'type')) {
          expect(normalizeAnswer(itemMap[question.itemId].roman)).not.toBe('');
        }
        state = parseBackup(JSON.stringify({ ...state, session }));
        while (state.session && state.session.index < state.session.queue.length) {
          state = state.session.queue[state.session.index].kind === 'intro'
            ? advanceIntro(state) : answerExercise(state, true, false);
        }
        state = finishSession(state);
      }
      expect(unitDone(unit, state.progress, state.completedUnitReviews), unit.id).toBe(true);
    }
    expect(mainComplete(course, state)).toBe(true);
    expect(createSession(state, 'learn')).toBeUndefined();
    expect(course.items.filter(item => item.extra).every(item => !state.progress[item.id])).toBe(true);
    expect(createSession(state, 'extra', course.extraUnits![0].id)).toBeDefined();
    expect(parseBackup(JSON.stringify(state)).courseId).toBe('hebrew');
  });
  it('uses explicit whole-word Hebrew speech and playable Rush pools, not recorded or English substitutes', () => {
    for (const item of course.items) {
      expect(item.pronunciation?.recording).toBeUndefined();
      if (item.kind !== 'word') expect(item.pronunciation?.speech).toBeUndefined();
      else {
        expect(item.pronunciation?.speech?.lang).toBe('he');
        expect(item.pronunciation?.speech?.text).toMatch(/[א-ת]/u);
      }
    }
    for (const mode of ['simple', 'vocabulary'] as const) {
      const pool = rushPool(course, mode, fresh());
      expect(pool.length).toBeGreaterThan(5);
      expect(new Set(pool.map(entry => entry.glyph)).size).toBe(pool.length);
      expect(new Set(pool.map(entry => entry.reading)).size).toBe(pool.length);
      expect(pool.every(entry => !entry.item?.extra)).toBe(true);
    }
  });
  it('keeps a versioned evidence record for every published word without calling manual IPA native-reviewed', () => {
    const words = course.items.filter(item => item.kind === 'word');
    expect(audit.words).toHaveLength(words.length);
    for (const item of words) {
      const evidence = audit.words.find(entry => entry.id === item.id)!;
      expect(evidence.glyph).toBe(item.glyph);
      expect(evidence.roman).toBe(item.roman);
      expect(evidence.ipa).toBe(item.ipa);
      expect(evidence.pointed).toBe(item.pronunciation?.speech?.text);
      expect(evidence.requires).toEqual(item.requires);
      expect(evidence.revision, item.id).toBeGreaterThan(0);
      expect(evidence.independentNativeReview).toBe(false);
      expect(evidence.evidence).not.toMatch(/needs-manual-comparison|pending-lexical-evidence/);
    }
    expect(audit.words.filter(entry => entry.evidence === 'lexical-transcription-plus-manual-broad-IPA')).toHaveLength(6);
  });
});
