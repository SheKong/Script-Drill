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
  it('uses explicit text and a configured language for online listening', () => {
    for (const [language, code] of [['TH_th', 'th'], ['ar', 'ar'], ['bn-BD', 'bn']]) {
      const text = 'กอ ไก่ & #?';
      const url = new URL(onlinePronunciation(text, language)!);
      expect(url.protocol).toBe('https:');
      expect(url.searchParams.get('text')).toBe(text);
      expect(url.searchParams.get('sl')).toBe(code);
      expect(url.searchParams.size).toBe(4);
    }
    expect(onlinePronunciation('/pʰ/', 'ipa')).toBeUndefined();
    expect(onlinePronunciation('hello', 'not a language')).toBeUndefined();
  });
  it('chooses help by the actual OS, including Android UAs containing Linux', () => {
    expect(voicePlatform('Mozilla/5.0 (Linux; Android 14)')).toBe('android');
    expect(voicePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(voicePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18)')).toBe('apple');
    expect(voicePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('apple');
    expect(voicePlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('other');
  });
});
