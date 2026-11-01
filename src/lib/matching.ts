export type MatchSide = 'left' | 'right';
export interface MatchSelection { side: MatchSide; id: string }

// One selection can belong to either column; a same-column click only replaces it.
export function chooseMatch(selection: MatchSelection | undefined, side: MatchSide, id: string): {
  selection?: MatchSelection; pair?: { left: string; right: string };
} {
  if (!selection || selection.side === side) {
    return { selection: selection?.id === id && selection.side === side ? undefined : { side, id } };
  }
  return { pair: side === 'left' ? { left: id, right: selection.id } : { left: selection.id, right: id } };
}
