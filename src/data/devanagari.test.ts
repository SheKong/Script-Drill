import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { geoContains } from 'd3-geo';
import { courses, itemMap } from '.';
import audit from '../../docs/DEVANAGARI_WORD_AUDIT.json';
import { advanceIntro, answerExercise, checkTyped, createSession, finishSession, mainComplete, makeExercise, makeMatch, unitDone } from '../lib/engine';
import { contrastLanguageLabel, itemLanguageIds, matchesLanguages } from '../lib/languages';
import { initialState, parseBackup } from '../lib/storage';
import { rushPool } from '../lib/rush';
import type { AppState } from '../types';

const course = courses.devanagari;
const fresh = (): AppState => ({ ...initialState(), courseId: course.id });
function finish(state: AppState): AppState {
  while (state.session && state.session.index < state.session.queue.length) {
    state = state.session.queue[state.session.index].kind === 'intro'
      ? advanceIntro(state) : answerExercise(state, true, false);
  }
  return finishSession(state);
}
describe('Devanagari course and language boundaries', () => {
  it('covers basic consonants, independent/dependent vowels, digits and two same-script branches', () => {
    expect(course.units).toHaveLength(16);
    expect(course.items.filter(item => item.group === '辅音成分')).toHaveLength(33);
    expect(course.items.filter(item => item.group === '独立元音')).toHaveLength(11);
    expect(course.items.filter(item => item.group === '元音附标')).toHaveLength(10);
    expect(course.items.filter(item => item.kind === 'number').map(item => item.glyph).join('')).toBe('०१२३४५६७८९');
    expect(course.items.filter(item => item.kind === 'word' && !item.extra && !item.branchId)).toHaveLength(24);
    expect(course.branches?.map(branch => branch.languageId)).toEqual(['ne', 'mr']);
    expect(course.languages?.map(language => language.romanizationSource)).toEqual(['hi-ungegn', 'ne-ungegn', 'mr-loc']);
    expect(course.composition).toBeUndefined();
  });
  it('distinguishes spelling from sounds and shares only applicable knowledge', () => {
    expect(itemMap['dv-i'].ipa).toBe('ɪ');
    expect(itemMap['dv-ne-i'].ipa).toBe('i');
    expect(itemMap['dv-ne-ii'].ipa).toBe('i');
    expect(itemMap['dv-ch'].roman).toBe('ch');
    expect(itemMap['dv-mr-ch'].roman).toBe('c');
    expect(itemMap['dv-mr-lla'].ipa).toBe('ɭ');
    expect(itemLanguageIds(course, itemMap['dv-v'])).toEqual(['hi', 'mr']);
    expect(contrastLanguageLabel(course, itemMap['dv-k'])).toBe('');
    expect(contrastLanguageLabel(course, itemMap['dv-i'])).toBe('印地语');
    expect(itemMap['dv-ne-word-biratnagar'].requires).toContain('dv-ne-v');
    const match = makeMatch(['dv-ch', 'dv-ne-ch', 'dv-mr-ch', 'dv-i', 'dv-ne-i', 'dv-ne-ii'].map(id => itemMap[id]))!;
    const targets = match.pairs!.map(pair => itemMap[pair.id]);
    expect(new Set(targets.map(item => item.ipa)).size).toBe(targets.length);
    expect(new Set(targets.map(item => item.glyph)).size).toBe(targets.length);
  });
  it('teaches all written letters/marks and real contextual rules before each word', () => {
    const closure = (ids: string[], found = new Set<string>()): Set<string> => {
      for (const id of ids) if (!found.has(id)) { found.add(id); closure(itemMap[id].requires, found); }
      return found;
    };
    for (const word of course.items.filter(item => item.kind === 'word')) {
      const ids = closure(word.requires);
      const covered = [...ids].map(id => itemMap[id].glyph).join('').normalize('NFD');
      for (const character of word.glyph.normalize('NFD')) {
        if (/[\u0900-\u097f]/u.test(character)) expect(covered.includes(character), `${word.id}: ${character}`).toBe(true);
      }
      expect(word.pronunciation?.speech?.lang).toBe(word.languageIds![0]);
      expect(word.pronunciation?.speech?.text).toBe(word.glyph);
      expect(word.pronunciation?.recording).toBeUndefined();
      if (word.languageIds![0] === 'hi') expect(ids.has('dv-schwa')).toBe(true);
      if (word.languageIds![0] === 'ne') expect(ids.has('dv-ne-context')).toBe(true);
      if (word.languageIds![0] === 'mr') expect(ids.has('dv-mr-nasal')).toBe(true);
    }
  });
  it('keeps all 70 published words aligned with their evidence without claiming native review', () => {
    const words = course.items.filter(item => item.kind === 'word');
    expect(audit.words).toHaveLength(70);
    expect(audit.words.map(word => word.id).sort()).toEqual(words.map(word => word.id).sort());
    expect(audit.independentNativeReview).toBe(false);
    const canonical = (value: string) => value.normalize('NFD').replace(/[\/\[\].\s͡ˈˌ]/gu, '').replaceAll('g', 'ɡ');
    for (const word of audit.words) {
      const item = itemMap[word.id];
      expect([word.glyph, word.roman, word.ipa, word.meaning, word.requires, word.conventionalNames])
        .toEqual([item.glyph, item.roman, item.ipa, item.meaning, item.requires, item.conventionalNames || []]);
      expect(word.independentNativeReview).toBe(false);
      expect(word.evidence).not.toBe('missing-language-entry');
      if (word.evidence === 'listed-IPA-with-notation-normalization') {
        expect(word.sourceIPA.some(value => canonical(value) === canonical(word.ipa))).toBe(true);
      }
      if (word.evidence === 'government-orthography-manual-broad-IPA') {
        expect(word.spellingEvidence.length).toBeGreaterThan(0);
        for (const evidence of word.spellingEvidence) {
          expect(item.sources).toContain(evidence.sourceId);
          expect(course.sources.find(source => source.id === evidence.sourceId)?.url).toBe(evidence.url);
          expect(evidence.matchedGlyph).toBe(true);
          expect(evidence.sha256).toMatch(/^[a-f0-9]{64}$/u);
          expect(evidence.scope).toContain('no IPA verification');
        }
      } else expect(word.languageSection).toBe(true);
    }
  });
  it('finishes all mainline units through actual sessions and keeps extras outside graduation', () => {
    let state = fresh();
    state.settings.typing = true;
    for (const unit of course.units) {
      for (let batch = 0; !unitDone(unit, state.progress, state.completedUnitReviews) && batch < 35; batch++) {
        const session = createSession(state, 'learn', unit.id);
        expect(session, unit.id).toBeDefined();
        if (session!.stage === 'unit-review') expect(session!.queue.length).toBeLessThanOrEqual(50);
        state = finish(parseBackup(JSON.stringify({ ...state, session })));
      }
      expect(unitDone(unit, state.progress, state.completedUnitReviews), unit.id).toBe(true);
    }
    expect(mainComplete(course, state)).toBe(true);
    expect(Object.keys(state.progress).every(id => !itemMap[id].extra && !itemMap[id].branchId)).toBe(true);
    expect(createSession(state, 'extra', course.extraUnits![0].id)).toBeDefined();
  });
  for (const branch of course.branches!) {
    it(`finishes ${branch.title} independently without fabricating mainline progress`, () => {
      let state = fresh();
      for (const unit of branch.units) {
        for (let batch = 0; !unitDone(unit, state.progress, state.completedUnitReviews) && batch < 35; batch++) {
          const session = createSession(state, 'branch', unit.id);
          expect(session, unit.id).toBeDefined();
          state = finish(parseBackup(JSON.stringify({ ...state, session })));
        }
        expect(unitDone(unit, state.progress, state.completedUnitReviews), unit.id).toBe(true);
      }
      expect(mainComplete(course, state)).toBe(false);
      expect(Object.keys(state.progress).every(id => itemMap[id].branchId === branch.id)).toBe(true);
      expect(state.earlyExtraUnlocks).toBeUndefined();
    });
  }
  for (const selection of [[], ['hi'], ['ne'], ['mr'], ['hi', 'ne'], ['hi', 'mr'], ['ne', 'mr'], ['hi', 'ne', 'mr']]) {
    it(`keeps both Rush modes and library scoped to ${selection.join('+') || 'empty'}`, () => {
      const state = { ...fresh(), languageSelections: { devanagari: selection } };
      const visible = course.items.filter(item => matchesLanguages(course, item, selection));
      expect(new Set(visible.map(item => item.id)).size).toBe(visible.length);
      for (const mode of ['simple', 'vocabulary'] as const) {
        const pool = rushPool(course, mode, state);
        expect(pool.length > 5).toBe(!!selection.length);
        expect(pool.every(entry => itemLanguageIds(course, entry.item!).some(id => selection.includes(id)))).toBe(true);
        expect(pool.every(entry => !entry.item?.extra)).toBe(true);
      }
      expect(parseBackup(JSON.stringify(state)).languageSelections?.devanagari).toEqual(selection);
    });
  }
  it('accepts plain keyboards and old/new map names with no invented transcription', () => {
    for (const [id, answers] of [
      ['dv-word-kanpur', ['kānapur', 'kanapur', 'KANPUR', 'Cawnpore']],
      ['dv-word-prayagraj', ['Prayagraj', 'Allahabad']],
      ['dv-ne-word-kathmandu', ['Kathmandu', 'Katmandu']],
      ['dv-mr-word-mumbai', ['Mumbai', 'Bombay', 'mumbai']],
      ['dv-mr-word-nashik', ['nasika', 'Nashik', 'Nasik']],
    ] as [string, string[]][]) {
      for (const answer of answers) expect(checkTyped(itemMap[id], answer), `${id}/${answer}`).toBe(true);
    }
    for (const item of course.items) {
      if (item.kind !== 'word') expect(item.pronunciation).toBeUndefined();
      for (const direction of ['read', 'reverse'] as const) {
        const question = makeExercise(item, direction, course, {});
        expect(question.options).toHaveLength(4);
        expect(new Set(question.options.map(option => option.label)).size).toBe(4);
      }
    }
  });
});

describe('local boundary display conventions', () => {
  it('uses the explicit China POV India layer, not the default de-facto outline', () => {
    const india = JSON.parse(readFileSync(new URL('../../public/maps/india.geojson', import.meta.url), 'utf8'));
    expect(india.properties.perspective).toBe('Natural Earth China POV');
    expect(geoContains(india, [91.86, 27.59])).toBe(false);
    expect(geoContains(india, [79.5, 35.2])).toBe(false);
    expect(geoContains(india, [77.2, 28.6])).toBe(true);
    expect(course.geographies?.india.outline).toBe(courses.bengali.geographies?.india.outline);
    expect(course.geographies?.india.requiresDisclaimer).toBe(true);
    expect(course.items.filter(item => item.place?.mapId === 'nepal')).toHaveLength(10);
    expect(course.items.filter(item => item.place?.mapId === 'india')).toHaveLength(20);
  });
  it('marks only courses with potentially disputed maps for the shared homepage declaration', () => {
    const markedCourses = Object.values(courses).filter(value =>
      [value.geography, ...Object.values(value.geographies || {})].some(map => map?.requiresDisclaimer));
    expect(markedCourses.map(value => value.id).sort()).toEqual(['bengali', 'devanagari', 'hebrew']);
    expect(courses.hebrew.geography?.requiresDisclaimer).toBe(true);
    expect(courses.thai.geography?.requiresDisclaimer).not.toBe(true);
    expect(course.geographies?.nepal.requiresDisclaimer).not.toBe(true);
  });
});
