import { describe, expect, it } from 'vitest';
import { courses, itemMap } from './index';
import { checkTyped, createSession, makeCombination, makeExercise, makeMatch, trained } from '../lib/engine';
import { initialState, parseBackup } from '../lib/storage';
import { rushPool } from '../lib/rush';
import audit from '../../docs/BENGALI_WORD_AUDIT.json' with { type: 'json' };

const course = courses.bengali;
const closure = (id: string, found = new Set<string>()): Set<string> => {
  for (const pre of itemMap[id].requires) if (!found.has(pre)) {
    found.add(pre); closure(pre, found);
  }
  return found;
};

describe('Bengali curriculum', () => {
  it('covers modern letters, both vowel forms, common conjuncts, ten digits and explicit destinations', () => {
    expect(course.locale).toBe('bn');
    expect(course.composition).toBeUndefined();
    expect(course.voiceHelp).toBeUndefined();
    expect(course.items.filter(item => item.group === '常见合字')).toHaveLength(17);
    expect(course.items.filter(item => item.kind === 'vowel')).toHaveLength(22);
    expect(course.items.filter(item => item.kind === 'number')).toHaveLength(10);
    expect(course.extraUnits).toHaveLength(4);
    expect(course.items.filter(item => item.extra)).toHaveLength(12);
    expect(course.units.at(-1)?.supplementary).toBe(true);
    expect(makeCombination(course.items, course)).toBeUndefined();
    const letters = new Set(course.items.filter(item => item.kind === 'consonant').map(item => item.glyph.normalize('NFC')));
    for (const glyph of Array.from('কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ')) expect(letters.has(glyph)).toBe(true);
    for (const glyph of ['ড়', 'ঢ়', 'য়', 'ৎ']) expect(letters.has(glyph.normalize('NFC'))).toBe(true);
  });
  it('retains modern mergers and excludes homophones from unique-answer reverse exercises and matching', () => {
    for (const [a, b] of [['i', 'ii'], ['i', 'i-sign'], ['u', 'uu'], ['s', 'sh'], ['n', 'retro-n'], ['j', 'y']]) {
      expect(itemMap[`bn-${a}`].ipa).toBe(itemMap[`bn-${b}`].ipa);
      for (let run = 0; run < 15; run++) {
        const exercise = makeExercise(itemMap[`bn-${a}`], 'reverse', course, {});
        expect(exercise.options.some(option => option.id === `bn-${b}`)).toBe(false);
      }
    }
    for (let run = 0; run < 20; run++) {
      const match = makeMatch(course.items)!;
      expect(match.pairs).toHaveLength(5);
      expect(new Set(match.pairs!.map(pair => itemMap[pair.id].ipa || itemMap[pair.id].roman)).size).toBe(5);
    }
    expect(itemMap['bn-retro-t'].ipa).not.toBe(itemMap['bn-t'].ipa);
    expect(itemMap['bn-retro-tt'].ipa).not.toBe(itemMap['bn-tt'].ipa);
  });
  it('preserves whole written segments and covers every base letter and sign through real prerequisites', () => {
    for (const word of course.items.filter(item => item.kind === 'word')) {
      expect(word.segments?.map(segment => segment.text).join(''), word.id).toBe(word.glyph);
      expect(word.segments?.map(segment => segment.reading).join(''), word.id).toBe(word.roman);
      expect(word.roman.includes('ô'), word.id).toBe(word.ipa.includes('ɔ'));
      const all = closure(word.id);
      const written = [...all].map(id => itemMap[id].glyph.normalize('NFD')).join('');
      for (const glyph of Array.from(word.glyph.normalize('NFD')).filter(glyph => /\p{Script=Bengali}/u.test(glyph))) {
        expect(written.includes(glyph), `${word.id} missing ${glyph}`).toBe(true);
      }
      if (word.glyph.includes('্')) expect(all.has('bn-hasanta'), word.id).toBe(true);
      if (word.extra) expect(word.place?.type).toBe('city');
    }
    expect(closure('bn-word-dokkhin').has('bn-ksh')).toBe(true);
    expect(closure('bn-word-poshchim').has('bn-shch')).toBe(true);
    expect(closure('bn-word-purbo').has('bn-rb')).toBe(true);
    expect(closure('bn-word-bus').has('bn-loan')).toBe(true);
  });
  it('keeps accessible input aliases separate from official romanization and accepts actual map names', () => {
    expect(checkTyped(itemMap['bn-a'], 'aw')).toBe(true);
    expect(checkTyped(itemMap['bn-a'], 'o')).toBe(false);
    expect(checkTyped(itemMap['bn-word-nogor'], 'nawgor')).toBe(true);
    expect(checkTyped(itemMap['bn-word-purbo'], 'purbo')).toBe(true);
    expect(checkTyped(itemMap['bn-word-purbo'], 'purbaw')).toBe(false);
    expect(checkTyped(itemMap['bn-word-chattogram'], 'Chittagong')).toBe(true);
    expect(checkTyped(itemMap['bn-word-coxs-bazar'], "Cox's Bazar")).toBe(true);
    expect(checkTyped(itemMap['bn-word-cumilla'], 'Comilla')).toBe(true);
    expect(course.officialRomanizationName).toBeUndefined();
  });
  it('has a traceable audit for every word and does not invent native review or recordings', () => {
    expect(audit.words).toHaveLength(course.items.filter(item => item.kind === 'word').length);
    for (const item of course.items.filter(item => item.kind === 'word')) {
      const record = audit.words.find(word => word.id === item.id)!;
      expect(record?.glyph).toBe(item.glyph);
      expect(record.ipa).toBe(item.ipa);
      expect(record.roman).toBe(item.roman);
      expect(record.url).toContain('oldid=');
      expect(record.sourceTranscription.length).toBeGreaterThan(0);
      expect(record.independentNativeReview).toBe(false);
      expect(item.pronunciation?.recording).toBeUndefined();
      expect(item.pronunciation?.speech?.text).toBe(item.glyph);
    }
    expect(audit.counts.lexicalTranscriptionOnly).toBe(5);
    expect(course.items.filter(item => item.kind !== 'word').every(item => !item.pronunciation?.speech)).toBe(true);
  });
  it('makes both Rush modes usable, and early city access does not train their missing prerequisites', () => {
    const state = { ...initialState(), courseId: course.id };
    expect(rushPool(course, 'simple', state).length).toBeGreaterThanOrEqual(6);
    const words = rushPool(course, 'vocabulary', state);
    expect(words.length).toBeGreaterThanOrEqual(6);
    expect(words.every(word => !word.item?.extra)).toBe(true);
    const unlocked = { ...state, earlyExtraUnlocks: { bengali: true } };
    expect(rushPool(course, 'vocabulary', unlocked).some(word => word.item?.extra)).toBe(true);
    const session = createSession(unlocked, 'extra', course.extraUnits![0].id)!;
    expect(session.newIds).toHaveLength(3);
    expect(trained('bn-retro-dh', unlocked.progress)).toBe(false);
    expect(() => parseBackup(JSON.stringify({ ...unlocked, session }))).not.toThrow();
  });
});
