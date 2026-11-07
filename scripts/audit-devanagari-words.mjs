import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const directory = '.local/devanagari-research';
const checked = new Date().toISOString().slice(0, 10);
const spellingCaches = {
  'ne-lalitpur-official': '.local/ne-lalitpur-official.html',
  'mr-pwd-official': '.local/mr-highway-official.html',
  'mr-satara-official': '.local/mr-satara-official.html',
  'mr-sangli-official': '.local/mr-sangli-official.html',
  'mr-ratnagiri-official': '.local/mr-ratnagiri-official.html',
};
async function reference(url, cache) {
  try { return await readFile(cache, 'utf8'); }
  catch {
    if (process.platform === 'win32') {
      execFileSync('pwsh', ['-NoProfile', '-File', 'scripts/fetch-reference.ps1', '-Uri', url, '-OutputFile', cache], { stdio: 'pipe' });
      return readFile(cache, 'utf8');
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    await writeFile(cache, html);
    return html;
  }
}
await mkdir(directory, { recursive: true });
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const browser = await chromium.launch();
try {
  const { courses } = await server.ssrLoadModule('/src/data/index.ts');
  const page = await browser.newPage();
  const words = [];
  for (const item of courses.devanagari.items.filter(item => item.kind === 'word')) {
    const language = item.languageIds[0];
    const heading = { hi: 'Hindi', ne: 'Nepali', mr: 'Marathi' }[language];
    const url = `https://en.wiktionary.org/wiki/${encodeURIComponent(item.glyph.replaceAll(' ', '_'))}`;
    const cache = `${directory}/${item.id}.html`;
    let html, error;
    try {
      html = await reference(url, cache);
    } catch (failure) { error = String(failure).slice(0, 250); }
    const entry = html ? await page.evaluate(({ html, heading, language }) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const start = doc.getElementById(heading)?.closest('.mw-heading');
      const section = doc.createElement('div');
      for (let node = start?.nextElementSibling; node && !node.matches('.mw-heading2'); node = node.nextElementSibling) {
        section.append(node.cloneNode(true));
      }
      const values = selector => [...new Set([...section.querySelectorAll(selector)].map(node => node.textContent.trim()))];
      const revision = html.match(/"wgRevisionId":(\d+)/)?.[1];
      return { languageSection: !!start, revision: revision ? Number(revision) : null,
        sourceIPA: values('.IPA'), sourceTranscription: values('.headword-tr'),
        headwords: values(`.headword[lang="${language}"]`) };
    }, { html, heading, language }) : { languageSection: false, revision: null, sourceIPA: [], sourceTranscription: [], headwords: [] };
    const canonical = value => value.normalize('NFD').replace(/[\/\[\].\s͡ˈˌ]/gu, '').replaceAll('g', 'ɡ');
    const matched = entry.sourceIPA.some(value => canonical(value) === canonical(item.ipa));
    const spellingEvidence = [];
    for (const sourceId of item.sources.filter(id => spellingCaches[id])) {
      const source = courses.devanagari.sources.find(source => source.id === sourceId);
      const original = await reference(source.url, spellingCaches[sourceId]);
      const evidence = await page.evaluate(({ original, glyph }) => {
        const doc = new DOMParser().parseFromString(original, 'text/html');
        doc.querySelectorAll('script, style').forEach(node => node.remove());
        return { title: doc.title.trim(), matchedGlyph: (doc.body?.textContent || '').normalize('NFC').includes(glyph.normalize('NFC')) };
      }, { original, glyph: item.glyph });
      if (!evidence.matchedGlyph) throw new Error(`${item.id}: official source no longer confirms spelling`);
      spellingEvidence.push({ sourceId, url: source.url, checked, ...evidence,
        sha256: createHash('sha256').update(original).digest('hex'),
        scope: 'Official spelling and geographic context only; no IPA verification.' });
    }
    words.push({
      id: item.id, language, glyph: item.glyph, roman: item.roman, ipa: item.ipa, meaning: item.meaning,
      requires: item.requires, conventionalNames: item.conventionalNames || [],
      url: entry.revision ? `${url}?oldid=${entry.revision}` : url, checked, ...entry, error,
      spellingEvidence,
      evidence: matched ? 'listed-IPA-with-notation-normalization'
        : entry.languageSection ? 'lexical-evidence-manual-broad-IPA'
          : spellingEvidence.length ? 'government-orthography-manual-broad-IPA' : 'missing-language-entry',
      independentNativeReview: false,
    });
    console.log(`${item.id}: ${words.at(-1).evidence} ${entry.sourceIPA.join(' ')}`);
  }
  await writeFile('docs/DEVANAGARI_WORD_AUDIT.json', `${JSON.stringify({
    checked, courseId: 'devanagari', independentNativeReview: false,
    normalization: 'NFD, omit IPA delimiters, syllable boundaries, spaces, tie bars and stress (course intentionally omits stress); Latin g -> IPA ɡ. Never change vowel quality, length or consonants to manufacture a match.',
    scope: 'The evidence status checks lexical documentation, not native review or correctness of the course romanization. UNGEGN Hindi/Nepali and ALA-LC Marathi are checked separately against their own tables.',
    words,
  }, null, 2)}\n`);
} finally {
  await browser.close();
  await server.close();
}
