import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const directory = '.local/hebrew-research';
const selections = {
  'he-word-west': ['/ma(ʔ)aˈʁav/', 'maʔaˈʁav', 'Select the explicitly optional glottal stop.'],
  'he-word-city': ['/(ʔ)iʁ/', 'ˈiʁ', 'Select zero initial glottal stop and mark the sole syllable.'],
  'he-word-israel': ['/(j)is.ʁaˈ(ʔ)el/', 'jisʁaˈʔel', 'Select both explicitly optional consonants.'],
  'he-word-tel-aviv': ['/tel (ʔ)a.ˈviv/', 'tel aˈviv', 'Select zero initial glottal stop in Aviv.'],
  'he-word-beer-sheva': ['/ˌbe(ʔ)eʁ ˈʃeva(ʕ)/', 'ˌbeʔeʁ ˈʃeva', 'Select the optional alef and omit the optional final pharyngeal; retain secondary stress.'],
  'he-word-ashdod': ['/(ʔ)aʃˈdod/', 'aʃˈdod', 'Select zero initial glottal stop.'],
  'he-word-ashkelon': ['/(ʔ)aʃkeˈlon/', 'aʃkeˈlon', 'Select zero initial glottal stop.'],
};
await mkdir(directory, { recursive: true });
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const browser = await chromium.launch();
try {
  const { courses } = await server.ssrLoadModule('/src/data/index.ts');
  const page = await browser.newPage();
  const words = [];
  for (const item of courses.hebrew.items.filter(item => item.kind === 'word')) {
    const url = `https://en.wiktionary.org/wiki/${encodeURIComponent(item.glyph.replaceAll(' ', '_'))}`;
    const cache = `${directory}/${item.id}.html`;
    let html;
    let error;
    try {
      try { html = await readFile(cache, 'utf8'); }
      catch {
        if (process.platform === 'win32') {
          execFileSync('pwsh', ['-NoProfile', '-File', 'scripts/fetch-reference.ps1', '-Uri', url, '-OutputFile', cache], { stdio: 'pipe' });
          html = await readFile(cache, 'utf8');
        } else {
          const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          html = await response.text();
          await writeFile(cache, html);
        }
      }
    } catch (failure) { error = String(failure).slice(0, 150); }
    const entry = html ? await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const heading = doc.getElementById('Hebrew')?.closest('.mw-heading');
      const container = doc.createElement('div');
      for (let node = heading?.nextElementSibling; node && !node.matches('.mw-heading2'); node = node.nextElementSibling) {
        container.append(node.cloneNode(true));
      }
      const values = selector => [...new Set([...container.querySelectorAll(selector)].map(node => node.textContent.trim()))];
      const revision = html.match(/"wgRevisionId":(\d+)/)?.[1];
      return { revision: revision ? Number(revision) : null,
        sourceIPA: values('.IPA'), sourceTranscription: values('.headword-tr'),
        headwords: values('.headword[lang=he]') };
    }, html) : { revision: null, sourceIPA: [], sourceTranscription: [], headwords: [] };
    // Only notation changes: do not silently merge different vowels or stress.
    const canonical = value => {
      const text = value.replace(/[\/\[\].\s͡]/gu, '').replaceAll('r', 'ʁ').replaceAll('ɡ', 'g');
      return (text.match(/[aeiou]/gu) || []).length === 1 ? text.replaceAll('ˈ', '') : text;
    };
    const matched = entry.sourceIPA.some(value => canonical(value) === canonical(item.ipa));
    const selection = selections[item.id];
    if (selection && (!entry.sourceIPA.includes(selection[0]) || canonical(selection[1]) !== canonical(item.ipa))) {
      throw new Error(`${item.id}: manual selection no longer agrees with the source and course.`);
    }
    words.push({
      id: item.id, glyph: item.glyph, roman: item.roman, ipa: item.ipa, meaning: item.meaning,
      pointed: item.pronunciation?.speech?.text,
      requires: item.requires,
      url: entry.revision ? `${url}?oldid=${entry.revision}` : url,
      checked: '2026-11-01', ...entry, error,
      manualSelection: selection ? { sourceIPA: selection[0], selectedIPA: selection[1], note: selection[2] } : undefined,
      evidence: matched ? 'listed-IPA-with-notation-normalization'
        : selection ? 'listed-IPA-with-explicit-variant-selection'
        : entry.sourceIPA.length ? 'listed-IPA-needs-manual-comparison'
          : entry.sourceTranscription.length ? 'lexical-transcription-plus-manual-broad-IPA' : 'manual-broad-IPA-pending-lexical-evidence',
      independentNativeReview: false,
      conventionalNames: item.conventionalNames || [],
    });
    console.log(`${item.id}: ${words.at(-1).evidence} ${entry.sourceIPA.join(' ')}`);
  }
  await writeFile('docs/HEBREW_WORD_AUDIT.json', `${JSON.stringify({
    checked: '2026-11-01', courseId: 'hebrew', independentNativeReview: false,
    normalization: 'Remove IPA delimiters, syllable separators, tie bars and spaces; r -> ʁ and ɡ -> g. Omit redundant primary stress only for monosyllables. Never change polysyllabic stress, vowel quality or consonant length. Optional sounds require per-word explicit manual selections.',
    words,
  }, null, 2)}\n`);
} finally {
  await browser.close();
  await server.close();
}
