import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const words = process.argv.slice(2);
if (!words.length) throw new Error('Pass the Bengali headwords to audit.');
await mkdir('.local/bengali-research', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
let previous = [];
try { previous = JSON.parse(await readFile('.local/bengali-research/lexicon.json', 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const results = new Map(previous.map(entry => [entry.word, entry]));
try {
  for (const word of words) {
    const url = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;
    const cache = `.local/bengali-research/${word}.html`;
    let html;
    try { html = await readFile(cache, 'utf8'); }
    catch {
      try {
        if (process.platform === 'win32') {
          execFileSync('pwsh', ['-NoProfile', '-File', 'scripts/fetch-reference.ps1', '-Uri', url, '-OutputFile', cache], { stdio: 'pipe' });
          html = await readFile(cache, 'utf8');
        } else {
          const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          html = await response.text();
          await writeFile(cache, html);
        }
      } catch (error) {
        results.set(word, { word, url, error: String(error).slice(0, 200) });
        console.error(`Unavailable: ${word}`);
        continue;
      }
    }
    const extracted = await page.evaluate(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const heading = doc.getElementById('Bengali')?.closest('.mw-heading');
      const container = doc.createElement('div');
      for (let node = heading?.nextElementSibling; node && !node.matches('.mw-heading2'); node = node.nextElementSibling) {
        container.append(node.cloneNode(true));
      }
      return {
        ipa: [...new Set([...container.querySelectorAll('.IPA')].map(node => node.textContent))],
        transcription: [...new Set([...container.querySelectorAll('.headword-tr')].map(node => node.textContent))],
        senses: [...container.querySelectorAll('ol > li')].filter(node => !node.closest('table'))
          .slice(0, 3).map(node => node.textContent.trim().slice(0, 200)),
      };
    }, html);
    const revision = Number(html.match(/"wgRevisionId":(\d+)/)?.[1]);
    const result = { word, url, revision, checked: '2026-10-22', ...extracted };
    results.set(word, result);
    console.log(JSON.stringify(result));
  }
  await writeFile('.local/bengali-research/lexicon.json', JSON.stringify([...results.values()], null, 2));
} finally {
  await browser.close();
}
