export function languageMatches(voiceLanguage: string, language: string): boolean {
  return voiceLanguage.toLowerCase().replaceAll('_', '-').split('-')[0]
    === language.toLowerCase().replaceAll('_', '-').split('-')[0];
}

export function selectVoice(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | undefined {
  const candidates = voices.filter(voice => languageMatches(voice.lang, language));
  return candidates.find(voice => voice.lang.toLowerCase() === language.toLowerCase() && voice.localService)
    || candidates.find(voice => voice.lang.toLowerCase() === language.toLowerCase())
    || candidates.find(voice => voice.localService) || candidates[0];
}
