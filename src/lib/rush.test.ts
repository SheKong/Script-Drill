import { describe, expect, it } from 'vitest';
import { courses, itemMap } from '../data';
import { createSession, finishSession, makeExercise, makeMatch, mainComplete } from './engine';
import { refillRush, rushPool, startRush } from './rush';
import { initialState, parseBackup } from './storage';
import type { AppState } from '../types';

function completed(): AppState {
  const state = initialState();
  state.completedUnitReviews = {};
  for (const unit of courses.thai.units) {
    state.completedUnitReviews[unit.id] = true;
    for (const id of unit.items) state.progress[id] = {
      introduced: true, correct: 5, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString(),
    };
  }
  return state;
}

describe('Rush and course extensions', () => {
  it('keeps five unique, solvable pairs and never refills the two cleared cells with a pair', () => {
    let seed = 57;
    const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (const mode of ['simple', 'vocabulary'] as const) {
      const pool = rushPool(courses.thai, mode, completed());
      expect(pool.length).toBeGreaterThan(50);
      let board = startRush(pool, rng);
      for (let step = 0; step < 1000; step++) {
        const left = Math.floor(rng() * 5);
        const right = board.right.findIndex(entry => entry.id === board.left[left].id);
        const next = refillRush(board, pool, left, right, rng);
        expect(next.left[left].id).not.toBe(next.right[right].id);
        expect(next.left[left].id).not.toBe(board.left[left].id);
        expect(new Set(next.left.map(entry => entry.glyph)).size).toBe(5);
        expect(new Set(next.right.map(entry => entry.reading)).size).toBe(5);
        expect(next.left.map(entry => entry.id).sort()).toEqual(next.right.map(entry => entry.id).sort());
        expect(next.revision).toBe(step + 1);
        board = next;
      }
    }
  });
  it('supports a minimal six-entry pool without a dead end and ignores mismatches', () => {
    const pool = rushPool(courses.thai, 'simple', initialState()).slice(0, 6);
    let board = startRush(pool, () => .1);
    const wrong = board.right.findIndex(entry => entry.id !== board.left[0].id);
    expect(refillRush(board, pool, 0, wrong)).toBe(board);
    for (let step = 0; step < 100; step++) {
      const right = board.right.findIndex(entry => entry.id === board.left[0].id);
      board = refillRush(board, pool, 0, right, () => .3);
      expect(board.left[0].id).not.toBe(board.right[right].id);
    }
  });
  it('unlocks all province and city words only after mainline completion', () => {
    const state = completed();
    expect(mainComplete(courses.thai, state)).toBe(true);
    const locked = rushPool(courses.thai, 'vocabulary', initialState());
    const unlocked = rushPool(courses.thai, 'vocabulary', state);
    expect(locked.every(entry => !entry.item?.extra)).toBe(true);
    const regions = courses.thai.items.filter(item => item.place?.type === 'region');
    expect(regions).toHaveLength(77);
    expect(new Set(regions.map(item => item.place?.type === 'region' && item.place.regionId)).size).toBe(77);
    expect(courses.thai.items.filter(item => item.place?.type === 'city').length).toBeGreaterThanOrEqual(14);
    for (const region of regions) {
      expect(unlocked.some(entry => entry.id === region.id)).toBe(true);
      if (region.place?.type === 'region') expect(courses.thai.geography!.regions[region.place.regionId]).toMatch(/^M/);
    }
    expect(createSession(initialState(), 'extra')).toBeUndefined();
    expect(createSession(state, 'extra')).toBeDefined();
  });
  it('places foundational explanations first and tests recognition, not tone calculation', () => {
    const order = courses.thai.units.flatMap(unit => unit.items);
    expect(order.slice(0, 2)).toEqual(['th-tone-overview', 'th-class-foundation']);
    for (const item of courses.thai.items.filter(item => item.kind === 'consonant')) {
      expect(item.requires).toContain('th-class-foundation');
    }
    for (let n = 1; n <= 4; n++) {
      expect(itemMap[`th-tone${n}`].rulePrompt).toContain('哪个是声调符号');
    }
    const exercise = makeExercise(itemMap['th-word-ban'], 'mark', courses.thai, {});
    expect(exercise.answer).toBe('้');
    expect(exercise.options).toHaveLength(4);
    expect(exercise.options.filter(option => courses.thai.recognition!.marks.includes(option.id))).toHaveLength(1);
  });
  it('requires a completed unit review, produces dozens of questions and does not finish on pause', () => {
    const state = completed();
    const unit = courses.thai.units[0];
    delete state.completedUnitReviews![unit.id];
    state.session = createSession(state, 'learn')!;
    expect(state.session.stage).toBe('unit-review');
    expect(state.session.queue.length).toBeGreaterThanOrEqual(30);
    expect(state.session.queue.some(exercise => exercise.kind === 'type')).toBe(true);
    expect(state.session.queue.filter(exercise => exercise.kind === 'match').every(exercise => exercise.pairs?.length === 5)).toBe(true);
    state.session.answers = 1;
    expect(finishSession(state).completedUnitReviews?.[unit.id]).toBeUndefined();
    state.session.index = state.session.queue.length;
    expect(finishSession(state).completedUnitReviews?.[unit.id]).toBe(true);
  });
  it('persists five-pair exercises, recognition, unit reviews and Rush scores, including old backups', () => {
    const state = completed();
    state.session = createSession(state, 'extra')!;
    state.session.queue.push(makeMatch(courses.thai.items.filter(item => item.kind === 'word'))!);
    state.session.queue.push(makeExercise(itemMap['th-word-ban'], 'mark', courses.thai, state.progress));
    state.rushBest = { 'thai:simple': 53, 'thai:vocabulary': 26 };
    expect(parseBackup(JSON.stringify(state))).toEqual(state);
    expect(parseBackup(JSON.stringify(initialState())).rushBest).toBeUndefined();
    state.rushBest['thai:simple'] = -1;
    expect(() => parseBackup(JSON.stringify(state))).toThrow();
  });
});
