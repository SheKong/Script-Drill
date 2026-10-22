import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ts from 'typescript';
import { chromium } from '@playwright/test';

const exec = promisify(execFile);
const source = ts.createSourceFile('places.ts', await readFile('src/data/thai-places.ts', 'utf8'), ts.ScriptTarget.Latest, true);
const rows = [];
for (const statement of source.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (!['provinces', 'cities'].includes(declaration.name.getText(source))) continue;
    rows.push(...declaration.initializer.elements.map(row => row.elements.slice(0, 5).map(value => value.text)));
  }
}
await mkdir('.local/lexicon', { recursive: true });
const pending = [...rows];
const results = [];
const fallbackArticles = {
  laemchabang: 'Laem_Chabang', pakkret: 'Pak_Kret', rangsit: 'Rangsit', maesot: 'Mae_Sot',
  aranyaprathet: 'Aranyaprathet', sattahip: 'Sattahip', chaam: 'Cha-am',
};
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let row = pending.shift(); row; row = pending.shift()) {
    const [id, glyph, , ipa] = row;
    const path = `.local/lexicon/${id}.html`;
    try {
      try { await access(path); } catch {
        await exec('pwsh', ['-NoProfile', '-File', 'scripts/fetch-reference.ps1',
          '-Uri', `https://en.wiktionary.org/wiki/${encodeURIComponent(glyph)}`, '-OutputFile', path]);
      }
      results.push({ id, glyph, ipa, path, url: `https://en.wiktionary.org/wiki/${encodeURIComponent(glyph)}` });
    } catch {
      const thaiPath = `.local/lexicon/${id}-thai-wiktionary.html`;
      const thaiUrl = `https://th.wiktionary.org/wiki/${encodeURIComponent(glyph)}`;
      try {
        try { await access(thaiPath); } catch {
          await exec('pwsh', ['-NoProfile', '-File', 'scripts/fetch-reference.ps1',
            '-Uri', thaiUrl, '-OutputFile', thaiPath]);
        }
        results.push({ id, glyph, ipa, path: thaiPath, url: thaiUrl, secondaryReference: true });
        continue;
      } catch {
      const article = fallbackArticles[id];
      if (!article) { results.push({ id, glyph, ipa, unavailable: true }); continue; }
      const path = `.local/lexicon/${id}-encyclopedia.html`;
      const url = `https://en.wikipedia.org/wiki/${article}`;
      try {
        await exec('pwsh', ['-NoProfile', '-File', 'scripts/fetch-reference.ps1', '-Uri', url, '-OutputFile', path]);
        results.push({ id, glyph, ipa, path, url, secondaryReference: true });
      } catch { results.push({ id, glyph, ipa, unavailable: true }); }
      }
    }
  }
}));
const browser = await chromium.launch();
const page = await browser.newPage();
for (const result of results) {
  if (result.unavailable) continue;
  const html = await readFile(result.path, 'utf8');
  result.references = await page.evaluate(html => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    return [...document.querySelectorAll('.IPA')].map(node => node.textContent);
  }, html);
}
await browser.close();
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f˥˦˧˨˩/[\].\sˈˌ]/gu, '');
for (const result of results) {
  result.matches = result.references?.some(value => normalize(value) === normalize(result.ipa)) || false;
}
await writeFile('.local/thai-lexicon-audit.json', JSON.stringify(results, null, 2));
await writeFile('docs/THAI_PLACE_AUDIT.json', JSON.stringify({
  checked: '2026-10-22', convention: 'Broad IPA omits tones, tie bars, non-syllabic and unreleased marks. Separators may differ.',
  entries: results.map(({ path, ...entry }) => entry),
}, null, 2));
console.log(JSON.stringify(results.filter(result => !result.matches), null, 2));
