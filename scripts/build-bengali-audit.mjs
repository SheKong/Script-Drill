import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const lexicon = JSON.parse(await readFile('.local/bengali-research/lexicon.json', 'utf8'));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { courses } = await server.ssrLoadModule('/src/data/index.ts');
  const course = courses.bengali;
  // Only documented notational differences are normalized, never guessed sounds.
  const canonical = value => value.replace(/[\/\[\]\s.ˈˌˑ()͡]/gu, '').replaceAll('r', 'ɾ');
  const words = course.items.filter(item => item.kind === 'word').map(item => {
    const entry = lexicon.find(entry => entry.word.normalize('NFC') === item.glyph.normalize('NFC'));
    if (!entry?.revision || !entry.transcription?.length) throw new Error(`Missing lexical source: ${item.glyph}`);
    const matches = entry.ipa.some(value => canonical(value) === canonical(item.ipa));
    if (entry.ipa.length && !matches) throw new Error(`IPA needs manual review: ${item.glyph} /${item.ipa}/ vs ${entry.ipa.join(', ')}`);
    return {
      id: item.id, glyph: item.glyph, meaning: item.meaning, roman: item.roman, ipa: item.ipa,
      url: `${entry.url}?oldid=${entry.revision}`, revision: entry.revision, checked: '2026-10-22',
      sourceTranscription: entry.transcription, sourceIPA: entry.ipa,
      evidence: matches ? 'listed-IPA-with-documented-notation-normalization' : 'lexical-transcription-plus-standard-segment-values',
      independentNativeReview: false,
      readingNote: item.explanation,
      requires: item.requires, segments: item.segments,
      conventionalNames: item.conventionalNames || [], place: item.place,
    };
  });
  const audit = {
    checked: '2026-10-22', courseId: course.id,
    scope: 'Written standard Bengali for street-sign recognition; traditional broad IPA with regional limitations stated explicitly.',
    normalization: 'For comparison only: remove delimiters, stress, syllable separators, tie bars and half-length; write source r as course ɾ. Parenthesized ho in Mymensingh selects the explicitly listed full variant. Consonant length and vowel quality are preserved.',
    independentNativeReview: false,
    counts: {
      units: course.units.length, knowledge: course.items.filter(item => item.kind !== 'word').length,
      mainWords: words.filter(word => !word.place || word.place.type === 'region').length,
      extraCities: course.items.filter(item => item.extra).length,
      listedIPA: words.filter(word => word.evidence.startsWith('listed-IPA')).length,
      lexicalTranscriptionOnly: words.filter(word => !word.evidence.startsWith('listed-IPA')).length,
    },
    sources: course.sources,
    words,
  };
  await writeFile('docs/BENGALI_WORD_AUDIT.json', `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify(audit.counts));
} finally {
  await server.close();
}
