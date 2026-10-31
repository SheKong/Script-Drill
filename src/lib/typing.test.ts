import { describe, expect, it } from 'vitest';
import { courses, itemMap } from '../data';
import { acceptedTypedAnswers, checkTyped, createSession, makeExercise, normalizeAnswer, refreshSessionNotation } from './engine';
import { initialState } from './storage';

const scriptCourses = Object.values(courses).filter(course => course.type === 'script');
const typable = scriptCourses.flatMap(course => course.items.filter(item => item.kind !== 'rule' && !!item.roman));

describe('keyboard-friendly transcription', () => {
  it.each([
    ['bn-anusvara', 'ṁ', 'm'],
    ['bn-ng', 'ṅ', 'n'],
    ['bn-y', 'j̱', 'j'],
    ['bn-ny', 'ñ', 'n'],
    ['bn-retro-th', 'ṭh', 'th'],
    ['bn-retro-dh', 'ḍh', 'dh'],
    ['bn-retro-n', 'ṇ', 'n'],
    ['bn-flap', 'ṙ', 'r'],
    ['bn-ss', 'ṣh', 'sh'],
    ['bn-ri', 'ṛ', 'r'],
    ['bn-aa', 'ā', 'a'],
    ['bn-ii', 'ī', 'i'],
    ['bn-uu', 'ū', 'u'],
    ['bn-word-bangla', 'bāṁlā', 'bamla'],
    ['bn-word-dhaka', 'ḍhākā', 'dhaka'],
    ['bn-word-jashore', 'j̱ashora', 'jashora'],
    ['bn-ksh', 'kṣh', 'ksh'],
    ['bn-jny', 'jñ', 'jn'],
  ])('accepts %s as both %s and %s', (id, notation, plain) => {
    const item = itemMap[id];
    expect(item.roman).toBe(notation);
    expect(acceptedTypedAnswers(item)).toContain(notation);
    expect(acceptedTypedAnswers(item)).toContain(plain);
    for (const answer of [notation, notation.normalize('NFD'), plain, plain.toUpperCase()]) {
      expect(checkTyped(item, answer), `${id}: ${answer}`).toBe(true);
    }
  });

  it.each(typable)('audits every current typed item: $id', item => {
    const answers = acceptedTypedAnswers(item);
    const declared = [item.roman, item.officialRoman, ...(item.aliases || []), ...(item.conventionalNames || [])]
      .filter((value): value is string => !!value);
    expect(answers.length).toBeGreaterThan(0);
    expect(new Set(answers.map(answer => answer.toLowerCase())).size).toBe(answers.length);
    for (const value of declared) {
      // Independently remove the combining marks used by all current courses.
      const plain = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s\-'.]/g, '').toLowerCase();
      // Some historical aliases include Chinese labels; the standard must never require them.
      if (value === item.roman) expect(plain, `${item.id}: ${value}`).toMatch(/^[a-z0-9]+$/);
      expect(checkTyped(item, value)).toBe(true);
      expect(checkTyped(item, value.normalize('NFD'))).toBe(true);
      expect(checkTyped(item, plain), `${item.id}: ${plain}`).toBe(true);
      expect(answers.some(answer => normalizeAnswer(answer) === plain)).toBe(true);
      const spaced = ` ${plain.toUpperCase().split('').join(' - ')} `;
      expect(checkTyped(item, spaced), `${item.id}: ${spaced}`).toBe(true);
    }
    for (const shown of answers) expect(checkTyped(item, shown), `${item.id}: ${shown}`).toBe(true);
    for (const wrong of ['', ' ', '.', "'- .", '\u0307', 'not-a-declared-answer', `${item.roman}x`, `${item.roman}/`]) {
      expect(checkTyped(item, wrong), `${item.id}: ${wrong}`).toBe(false);
    }
    expect(makeExercise(item, 'type', courses[item.courseId], {}).answer).toBe(item.roman);
  });

  it('covers supplementary and extra place units, while IPA never generates typing questions', () => {
    for (const course of scriptCourses) {
      for (const unit of [...course.units, ...(course.extraUnits || [])]) {
        for (const id of unit.items) {
          const item = itemMap[id];
          if (item.kind !== 'rule' && item.roman) expect(typable).toContain(item);
        }
      }
    }
    const state = { ...initialState(), courseId: 'ipa' };
    expect(createSession(state, 'learn')!.queue.every(question => question.kind !== 'type')).toBe(true);
  });

  it('preserves map names, legacy alternatives and numerical answers', () => {
    expect(acceptedTypedAnswers(itemMap['bn-anusvara'])).toEqual(['ṁ', 'm', 'ng']);
    expect(checkTyped(itemMap['bn-anusvara'], 'ng')).toBe(true);
    expect(checkTyped(itemMap['bn-word-coxs-bazar'], 'Cox’s Bazar')).toBe(true);
    expect(checkTyped(itemMap['bn-word-coxs-bazar'], 'Coxs-Bazar')).toBe(true);
    expect(checkTyped(itemMap['bn-word-coxs-bazar'], 'Coxs‑Bazar')).toBe(true);
    expect(checkTyped(itemMap['th-word-chiangmai'], 'Chiang Mai')).toBe(true);
    expect(checkTyped(itemMap['th-word-ko'], 'Koh')).toBe(true);
    for (const course of scriptCourses) {
      for (let number = 0; number < 10; number++) {
        const item = course.items.find(item => item.kind === 'number' && item.roman === String(number))!;
        expect(checkTyped(item, String(number))).toBe(true);
        expect(checkTyped(item, String((number + 1) % 10))).toBe(false);
      }
    }
    expect(checkTyped(itemMap['th-o'], '')).toBe(false);
    expect(checkTyped(itemMap['th-j'], 'dzh')).toBe(false);
    expect(checkTyped(itemMap['th-word-ko'], 'koa')).toBe(false);
  });

  it('refreshes saved typed exercises without changing standard notation or session identity', () => {
    const state = { ...initialState(), courseId: 'bengali', earlyExtraUnlocks: { bengali: true } };
    const session = createSession(state, 'extra', courses.bengali.extraUnits![0].id)!;
    const question = makeExercise(itemMap['bn-anusvara'], 'type', courses.bengali, {});
    session.queue = [question];
    const refreshed = refreshSessionNotation(session);
    expect(refreshed.id).toBe(session.id);
    expect(refreshed.queue[0].id).toBe(question.id);
    expect(refreshed.queue[0].answer).toBe('ṁ');
    expect(checkTyped(itemMap[refreshed.queue[0].itemId], 'm')).toBe(true);
  });
});
