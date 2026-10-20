import { describe, expect, it } from 'vitest';
import { languageMatches, selectVoice } from './speech';

const voice = (lang: string, localService = false) => ({ lang, localService }) as SpeechSynthesisVoice;
describe('speech language selection', () => {
  it('matches locale variants but never uses another language as fallback', () => {
    expect(languageMatches('TH_th', 'th-TH')).toBe(true);
    expect(languageMatches('en-US', 'th-TH')).toBe(false);
    expect(selectVoice([voice('en-US')], 'th-TH')).toBeUndefined();
    expect(selectVoice([], 'th-TH')).toBeUndefined();
  });
  it('prefers matching local voices and handles delayed or base-language voice lists', () => {
    const remote = voice('th-TH');
    const local = voice('th-TH', true);
    expect(selectVoice([remote, local], 'th-TH')).toBe(local);
    expect(selectVoice([voice('en-US'), remote], 'th-TH')).toBe(remote);
    const base = voice('th');
    expect(selectVoice([base], 'th-TH')).toBe(base);
  });
});
