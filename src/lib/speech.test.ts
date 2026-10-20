import { describe, expect, it } from 'vitest';
import { languageMatches, onlinePronunciation, selectVoice, voicePlatform } from './speech';

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
    const underscored = voice('TH_th', true);
    expect(selectVoice([remote, underscored], 'th-TH')).toBe(underscored);
  });
  it('uses explicit Thai text and correctly encodes both online alternatives', () => {
    for (const provider of ['google', 'bing'] as const) {
      const text = 'กอ ไก่ & #?';
      const url = new URL(onlinePronunciation(text, 'TH_th', provider)!);
      expect(url.protocol).toBe('https:');
      expect(url.searchParams.get('text')).toBe(text);
      expect(url.searchParams.get(provider === 'google' ? 'sl' : 'from')).toBe('th');
      expect(url.searchParams.size).toBe(provider === 'google' ? 4 : 3);
    }
    expect(onlinePronunciation('/pʰ/', 'ipa')).toBeUndefined();
    expect(onlinePronunciation('hello', 'en-US')).toBeUndefined();
  });
  it('chooses help by the actual OS, including Android UAs containing Linux', () => {
    expect(voicePlatform('Mozilla/5.0 (Linux; Android 14)')).toBe('android');
    expect(voicePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(voicePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18)')).toBe('apple');
    expect(voicePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('apple');
    expect(voicePlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('other');
  });
});
