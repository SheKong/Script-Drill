import type { AppState, Course, Knowledge } from '../types';
import { extrasOpen, reading, shuffle } from './engine';

export type RushMode = 'simple' | 'vocabulary';
export interface RushEntry { id: string; glyph: string; reading: string; item?: Knowledge }
export interface RushBoard { left: RushEntry[]; right: RushEntry[]; recent: string[]; revision: number }

export function rushPool(course: Course, mode: RushMode, state: AppState): RushEntry[] {
  const complete = extrasOpen(course, state);
  const items = course.items.filter(item => mode === 'vocabulary'
    ? item.kind === 'word' && (!item.extra || complete)
    : ['consonant', 'vowel', 'symbol'].includes(item.kind) && !item.obsolete);
  const entries: RushEntry[] = items.map(item => ({ id: item.id, glyph: item.glyph, reading: reading(item), item }));
  if (mode === 'simple' && course.composition) {
    const consonants = items.filter(item => item.kind === 'consonant' && !course.composition!.excludedConsonantIds.includes(item.id));
    const vowels = items.filter(item => course.composition!.vowelIds.includes(item.id));
    for (const consonant of consonants) for (const vowel of vowels) {
      entries.push({
        id: `${consonant.id}:${vowel.id}`, glyph: vowel.glyph.replace('◌', consonant.glyph),
        reading: `${consonant.roman}${vowel.roman} /${consonant.ipa}${vowel.ipa}/`,
      });
    }
  }
  const glyphs = new Set<string>(), sounds = new Set<string>();
  return entries.filter(entry => {
    if (glyphs.has(entry.glyph) || sounds.has(entry.reading)) return false;
    glyphs.add(entry.glyph); sounds.add(entry.reading); return true;
  });
}
export function startRush(pool: RushEntry[], rng = Math.random): RushBoard {
  if (pool.length < 6) throw new Error('Rush requires six unambiguous entries');
  const left = shuffle(pool, rng).slice(0, 5);
  return { left, right: shuffle(left, rng), recent: left.map(entry => entry.id), revision: 0 };
}
export function refillRush(board: RushBoard, pool: RushEntry[], leftIndex: number, rightIndex: number, rng = Math.random): RushBoard {
  if (board.left[leftIndex].id !== board.right[rightIndex].id) return board;
  const visible = new Set(board.left.map(entry => entry.id));
  const available = shuffle(pool.filter(entry => !visible.has(entry.id)), rng);
  // A short cooldown gives broad coverage; fallback keeps small courses playable.
  const next = available.find(entry => !board.recent.includes(entry.id)) || available[0];
  if (!next) return board;
  const others = board.right.map((_, index) => index).filter(index => index !== rightIndex);
  const swapIndex = others[Math.floor(rng() * others.length)];
  const left = [...board.left], right = [...board.right];
  left[leftIndex] = next;
  // The two emptied cells never receive each other's answer. Rotate a third cell
  // so all five pairs remain present, unique and solvable after every replacement.
  right[rightIndex] = right[swapIndex];
  right[swapIndex] = next;
  return { left, right, recent: [...board.recent, next.id].slice(-Math.min(20, pool.length - 5)), revision: board.revision + 1 };
}
