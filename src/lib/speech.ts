export function languageMatches(voiceLanguage: string, language: string): boolean {
  return voiceLanguage.toLowerCase().replaceAll('_', '-').split('-')[0]
    === language.toLowerCase().replaceAll('_', '-').split('-')[0];
}

export function selectVoice(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | undefined {
  const candidates = voices.filter(voice => languageMatches(voice.lang, language));
  const exact = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replaceAll('_', '-') === language.toLowerCase().replaceAll('_', '-');
  return candidates.find(voice => exact(voice) && voice.localService)
    || candidates.find(exact)
    || candidates.find(voice => voice.localService) || candidates[0];
}

export function onlinePronunciation(text: string, language: string, provider: 'google' | 'bing' = 'google'): string | undefined {
  if (!languageMatches(language, 'th')) return undefined;
  if (provider === 'bing') {
    const url = new URL('https://www.bing.com/translator');
    url.search = new URLSearchParams({ from: 'th', to: 'zh-Hans', text }).toString();
    return url.href;
  }
  const url = new URL('https://translate.google.com/');
  url.search = new URLSearchParams({ sl: 'th', tl: 'zh-CN', text, op: 'translate' }).toString();
  return url.href;
}

export type VoicePlatform = 'windows' | 'android' | 'apple' | 'other';
export function voicePlatform(userAgent: string): VoicePlatform {
  if (/android/i.test(userAgent)) return 'android';
  if (/windows/i.test(userAgent)) return 'windows';
  if (/macintosh|iphone|ipad|ipod/i.test(userAgent)) return 'apple';
  return 'other';
}
