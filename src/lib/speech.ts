function canonicalLocale(language: string): string {
  const normalized = language.replaceAll('_', '-');
  try { return Intl.getCanonicalLocales(normalized)[0]?.toLowerCase() || ''; }
  catch { return normalized.toLowerCase(); }
}
export function languageMatches(voiceLanguage: string, language: string): boolean {
  return canonicalLocale(voiceLanguage).split('-')[0] === canonicalLocale(language).split('-')[0];
}

export function selectVoice(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | undefined {
  const candidates = voices.filter(voice => languageMatches(voice.lang, language));
  const exact = (voice: SpeechSynthesisVoice) => canonicalLocale(voice.lang) === canonicalLocale(language);
  return candidates.find(voice => exact(voice) && voice.localService)
    || candidates.find(exact)
    || candidates.find(voice => voice.localService) || candidates[0];
}

export function onlinePronunciation(text: string, language: string): string | undefined {
  if (!/^[a-z]{2,3}(?:[-_][a-z0-9]{2,8})*$/i.test(language) || language === 'ipa') return undefined;
  const url = new URL('https://translate.google.com/');
  url.search = new URLSearchParams({ sl: language.toLowerCase().replaceAll('_', '-').split('-')[0], tl: 'zh-CN', text, op: 'translate' }).toString();
  return url.href;
}

export type VoicePlatform = 'windows' | 'android' | 'apple' | 'other';
export function voicePlatform(userAgent: string): VoicePlatform {
  if (/android/i.test(userAgent)) return 'android';
  if (/windows/i.test(userAgent)) return 'windows';
  if (/macintosh|iphone|ipad|ipod/i.test(userAgent)) return 'apple';
  return 'other';
}
