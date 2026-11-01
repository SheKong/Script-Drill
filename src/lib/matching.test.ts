import { describe, expect, it } from 'vitest';
import { chooseMatch, type MatchSide } from './matching';

describe('two-way pairing', () => {
  for (const side of ['left', 'right'] as MatchSide[]) {
    it(`${side} can start a pair, switch within its column, or deselect`, () => {
      const first = chooseMatch(undefined, side, 'one');
      expect(first).toEqual({ selection: { side, id: 'one' } });
      expect(chooseMatch(first.selection, side, 'one')).toEqual({ selection: undefined });
      const second = chooseMatch(first.selection, side, 'two');
      expect(second).toEqual({ selection: { side, id: 'two' } });
      expect(second.pair).toBeUndefined();
      expect(chooseMatch(second.selection, side === 'left' ? 'right' : 'left', 'two'))
        .toEqual({ pair: { left: 'two', right: 'two' } });
    });
    it(`${side}-first errors keep the actual left target ID for progress tracking`, () => {
      expect(chooseMatch({ side, id: 'one' }, side === 'left' ? 'right' : 'left', 'two').pair)
        .toEqual(side === 'left' ? { left: 'one', right: 'two' } : { left: 'two', right: 'one' });
    });
  }
});
