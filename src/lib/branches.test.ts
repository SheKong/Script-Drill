import { describe, expect, it } from 'vitest';
import { courses, itemMap } from '../data';
import { prepareCourse } from '../data/template';
import { advanceIntro, answerExercise, branchUnitOpen, createSession, eligibleWords, finishSession, mainComplete, trained, unitDone } from './engine';
import { contrastLanguageLabel, itemLanguage, itemLanguageIds, matchesLanguages, rushScoreKey, selectedLanguages } from './languages';
import { initialState, parseBackup } from './storage';
import { rushPool } from './rush';
import type { AppState } from '../types';

const course = courses.bengali;
const branch = course.branches![0];
const fresh = (): AppState => ({ ...initialState(), courseId: course.id });
const complete = (state: AppState) => {
  let next = state;
  while (next.session && next.session.index < next.session.queue.length) {
    next = next.session.queue[next.session.index].kind === 'intro'
      ? advanceIntro(next) : answerExercise(next, true, false);
  }
  return finishSession(next);
};

describe('parallel language branches', () => {
  it('opens its first unit before mainline or extras; later units use only branch progress', () => {
    const state = fresh();
    expect(branchUnitOpen(course, branch.units[0].id, state)).toBe(true);
    expect(branchUnitOpen(course, branch.units[1].id, state)).toBe(false);
    expect(createSession(state, 'branch', branch.units[0].id)).toBeDefined();
    expect(createSession(state, 'branch', branch.units[1].id)).toBeUndefined();
    expect(createSession(state, 'extra', course.extraUnits![0].id)).toBeUndefined();
    expect(createSession(state, 'learn', branch.units[0].id)?.unitId).not.toBe(branch.units[0].id);
    expect(eligibleWords(course, Object.fromEntries(course.items.map(item => [item.id, {
      introduced: true, correct: 10, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString(),
    }]))).every(item => !item.branchId)).toBe(true);
  });
  it('finishes every branch unit through real sessions without writing mainline knowledge or reviews', () => {
    let state = fresh();
    for (const unit of branch.units) {
      let count = 0;
      while (!unitDone(unit, state.progress, state.completedUnitReviews) && count++ < 30) {
        const session = createSession(state, 'branch', unit.id);
        expect(session, unit.id).toBeDefined();
        const saved = parseBackup(JSON.stringify({ ...state, session }));
        expect(saved.session?.mode).toBe('branch');
        state = complete(saved);
      }
      expect(unitDone(unit, state.progress, state.completedUnitReviews), unit.id).toBe(true);
    }
    expect(mainComplete(course, state)).toBe(false);
    expect(state.earlyExtraUnlocks).toBeUndefined();
    expect(trained('bn-inherent', state.progress)).toBe(false);
    expect(Object.keys(state.progress).every(id => itemMap[id].branchId === branch.id)).toBe(true);
    expect(Object.keys(state.completedUnitReviews || {}).sort()).toEqual(branch.units.map(unit => unit.id).sort());
  });
  it('keeps all place lessons around ten names, each on an appropriate local map', () => {
    for (const value of Object.values(courses)) {
      for (const unit of [...value.extraUnits || [], ...value.branches?.flatMap(branch => branch.units).filter(unit => unit.placeLesson) || []]) {
        expect(unit.items.length, unit.id).toBeGreaterThanOrEqual(8);
        expect(unit.items.length, unit.id).toBeLessThanOrEqual(12);
        for (const id of unit.items) {
          const item = itemMap[id];
          const map = item.place?.mapId ? value.geographies?.[item.place.mapId] : value.geography;
          expect(map, id).toBeDefined();
          expect(item.place, id).toBeDefined();
          if (item.place?.type !== 'city') continue;
          const [lon, lat] = item.place.coordinates;
          const x = map!.projection.translate[0] + map!.projection.scale * lon * Math.PI / 180;
          const y = map!.projection.translate[1] - map!.projection.scale * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
          expect(x, id).toBeGreaterThan(0); expect(x, id).toBeLessThan(180);
          expect(y, id).toBeGreaterThan(0); expect(y, id).toBeLessThan(260);
        }
      }
    }
    expect(() => prepareCourse({ ...course, extraUnits: [{ ...course.extraUnits![0], items: course.extraUnits![0].items.slice(0, 3) }] })).toThrow('8-12');
  });
  it('rejects invalid language IDs, branch membership and future branch prerequisites', () => {
    expect(() => prepareCourse({ ...course, items: course.items.map(item => item.id === 'as-r' ? { ...item, languageIds: ['missing'] } : item) })).toThrow('language membership');
    expect(() => prepareCourse({ ...course, items: course.items.map(item => item.id === 'as-r' ? { ...item, requires: ['as-word-guwahati'] } : item) })).toThrow('precede');
  });
});

describe('language-aware library and Rush data', () => {
  it('omits badges for genuinely shared content, not for language-specific readings', () => {
    for (const id of ['bn-k', 'bn-aa-sign', 'bn-num-0', 'bn-candrabindu']) {
      expect(contrastLanguageLabel(course, itemMap[id]), id).toBe('');
    }
    for (const id of ['bn-r', 'bn-e', 'bn-e-sign', 'bn-o', 'bn-o-sign']) {
      expect(contrastLanguageLabel(course, itemMap[id]), id).toBe('孟加拉语');
    }
    for (const id of ['as-r', 'as-e', 'as-e-sign', 'as-o', 'as-o-sign']) {
      expect(contrastLanguageLabel(course, itemMap[id]), id).toBe('阿萨姆语');
    }
    expect(contrastLanguageLabel(courses.thai, itemMap['th-k'])).toBe('');
    const extended = { ...course, languages: [...course.languages!, { ...course.languages![0], id: 'third', label: '第三语言' }] };
    expect(contrastLanguageLabel(extended, itemMap['bn-k'])).toBe('孟加拉语 · 阿萨姆语');
    expect(contrastLanguageLabel(extended, { ...itemMap['bn-k'], languageIds: ['as', 'third', 'bn'] })).toBe('');
  });
  it('keeps Assamese vowel values independent of the Bengali primary cards', () => {
    for (const [main, branch, value] of [
      ['bn-e', 'as-e', 'ɛ'], ['bn-e-sign', 'as-e-sign', 'ɛ'],
      ['bn-o', 'as-o', 'ʊ'], ['bn-o-sign', 'as-o-sign', 'ʊ'],
    ]) {
      expect(itemLanguageIds(course, itemMap[main])).toEqual(['bn']);
      expect(itemMap[branch].ipa).toBe(value);
      expect(itemMap[branch].sources).toContain('as-lsp');
      expect(matchesLanguages(course, itemMap[main], ['as'])).toBe(false);
    }
    expect(itemMap['as-word-tezpur'].requires).toContain('as-e-sign');
    expect(itemMap['as-word-jorhat'].requires).toContain('as-o-sign');
    expect(itemMap['bn-glide'].explanation).toContain('阿萨姆语 /j/ 多见于英语借词');
  });
  for (const selection of [[], ['bn'], ['as'], ['as', 'bn']]) {
    it(`uses union semantics without duplicating shared entries for ${selection.join('+') || 'none'}`, () => {
      const state = { ...fresh(), earlyExtraUnlocks: { bengali: true }, languageSelections: { bengali: selection } };
      expect(selectedLanguages(course, state)).toEqual(selection);
      const visible = course.items.filter(item => matchesLanguages(course, item, selection));
      expect(new Set(visible.map(item => item.id)).size).toBe(visible.length);
      expect(visible.some(item => item.id === 'bn-k')).toBe(!!selection.length);
      expect(visible.some(item => item.id === 'bn-r')).toBe(selection.includes('bn'));
      expect(visible.some(item => item.id === 'as-r')).toBe(selection.includes('as'));
      for (const mode of ['simple', 'vocabulary'] as const) {
        const pool = rushPool(course, mode, state);
        expect(pool.every(entry => entry.item && itemLanguageIds(course, entry.item).some(id => selection.includes(id)))).toBe(true);
        expect(new Set(pool.map(entry => entry.glyph)).size).toBe(pool.length);
        expect(pool.length > 5).toBe(!!selection.length);
      }
      expect(parseBackup(JSON.stringify(state)).languageSelections).toEqual(state.languageSelections);
    });
  }
  it('defaults to all languages, preserves old records, and separates subset Rush scores', () => {
    expect(selectedLanguages(course, fresh())).toEqual(['bn', 'as']);
    expect(parseBackup(JSON.stringify(fresh())).languageSelections).toBeUndefined();
    expect(rushScoreKey(course, 'simple', ['as', 'bn'])).toBe('bengali:simple');
    expect(rushScoreKey(course, 'simple', ['as'])).toBe('bengali:simple:as');
    expect(rushScoreKey(course, 'simple', ['bn'])).toBe('bengali:simple:bn');
    expect(rushScoreKey(courses.thai, 'simple', [])).toBe('thai:simple');
    expect(itemLanguage(course, itemMap['as-word-guwahati'])?.locale).toBe('as');
    expect(() => parseBackup(JSON.stringify({ ...fresh(), languageSelections: { bengali: ['not-a-language'] } }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ ...fresh(), languageSelections: { bengali: ['bn', 'bn'] } }))).toThrow();
  });
  it('preserves legacy place progress and reviews across regrouped units', () => {
    const state = fresh();
    state.completedUnitReviews = { 'bengali-extra-1': true, 'thai-cities': true };
    state.rushBest = { 'bengali:simple': 35, 'thai:vocabulary': 22 };
    state.progress['bn-word-dhaka'] = {
      introduced: true, correct: 6, wrong: 1, modes: ['read', 'reverse'], lastSeen: new Date().toISOString(),
    };
    const restored = parseBackup(JSON.stringify(state));
    expect(restored.progress).toEqual(state.progress);
    expect(restored.completedUnitReviews).toEqual(state.completedUnitReviews);
    expect(restored.rushBest).toEqual(state.rushBest);
    expect(unitDone(course.extraUnits![0], restored.progress, restored.completedUnitReviews)).toBe(false);
    expect(trained('bn-word-dhaka', restored.progress)).toBe(true);
  });
});
