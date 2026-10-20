// Maintenance only. Runtime playback uses the checked-in MP3s and attribution manifest.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const catalog = {
  p: 'Voiceless bilabial plosive',
  b: 'Voiced bilabial plosive',
  m: 'Bilabial nasal',
  t: 'Voiceless alveolar plosive',
  d: 'Voiced alveolar plosive',
  n: 'Alveolar nasal',
  k: 'Voiceless velar plosive',
  g: 'Voiced velar plosive',
  ng: 'Velar nasal',
  f: 'Voiceless labiodental fricative',
  v: 'Voiced labiodental fricative',
  s: 'Voiceless alveolar sibilant',
  z: 'Voiced alveolar sibilant',
  h: 'Voiceless glottal fricative',
  sh: 'Voiceless palato-alveolar sibilant',
  j: 'Palatal approximant',
  w: 'Voiced labio-velar approximant',
  l: 'Alveolar lateral approximant',
  r: 'Alveolar trill',
  tap: 'Alveolar tap',
  ch: 'Voiceless alveolo-palatal affricate',
  'english-ch': 'Voiceless palato-alveolar affricate',
  a: 'Open front unrounded vowel',
  i: 'Close front unrounded vowel',
  u: 'Close back rounded vowel',
  ue: 'Close back unrounded vowel',
  e: 'Close-mid front unrounded vowel',
  ae: 'Open-mid front unrounded vowel',
  o: 'Close-mid back rounded vowel',
  aw: 'Open-mid back rounded vowel',
  oe: 'Close-mid back unrounded vowel',
  schwa: 'Mid-central vowel',
  theta: 'Voiceless dental fricative',
  eth: 'Voiced dental fricative',
  zh: 'Voiced palato-alveolar sibilant',
  x: 'Voiceless velar fricative',
  gh: 'Voiced velar fricative',
  q: 'Voiceless uvular plosive',
  'uvular-r': 'Voiced uvular fricative',
  'pharyngeal-h': 'Voiceless pharyngeal fricative',
  ayn: 'Voiced pharyngeal fricative',
  glottal: 'Glottal stop',
  'retro-t': 'Voiceless retroflex plosive',
  'retro-d': 'Voiced retroflex plosive',
  'retro-s': 'Voiceless retroflex sibilant',
  'retro-z': 'Voiced retroflex sibilant',
  'palatal-c': 'Voiceless palatal plosive',
  'palatal-g': 'Voiced palatal plosive',
  'palatal-n': 'Palatal nasal',
  ts: 'Voiceless alveolar affricate',
  dz: 'Voiced alveolar affricate',
  dzh: 'Voiced palato-alveolar affricate',
  'palatal-s': 'Voiceless alveolo-palatal sibilant',
  'rounded-y': 'Close front rounded vowel',
  'rounded-oe': 'Close-mid front rounded vowel',
  'rounded-open-oe': 'Open-mid front rounded vowel',
  'central-i': 'Close central unrounded vowel',
  'open-back-a': 'Open back unrounded vowel',
  'near-i': 'Near-close near-front unrounded vowel',
  'near-u': 'Near-close near-back rounded vowel',
};

await mkdir('public/audio/ipa', { recursive: true });
await mkdir('.local/audio-originals', { recursive: true });
const manifest = JSON.parse(await readFile('src/data/recordings.json', 'utf8').catch(() => '{}'));
const missing = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await fetch(url, { signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'ScriptDrill/1.0 (educational pronunciation assets)' } });
    if (result.status !== 429 && result.status < 500) return result;
    const retryAfter = Number(result.headers.get('retry-after') || 2 ** attempt);
    if (retryAfter > 5) return result;
    await delay(retryAfter * 1000);
  }
  throw new Error(`Request failed after retries: ${url}`);
}
for (const [id, title] of Object.entries(catalog)) {
  if (manifest[`ipa-${id}`]) continue;
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({
    action: 'query', format: 'json', redirects: '1', prop: 'imageinfo|revisions',
    iiprop: 'url|extmetadata', rvprop: 'content|ids', rvslots: 'main', titles: `File:${title}.ogg`,
  }).toString();
  const response = await request(api);
  if (!response.ok) { console.warn(`${id}: Commons API ${response.status}`); missing.push(id); continue; }
  const body = await response.json();
  const page = Object.values(body.query.pages)[0];
  const info = page.imageinfo?.[0];
  const metadata = info?.extmetadata;
  if (!info || !metadata.LicenseUrl?.value) { missing.push(id); continue; }
  const wikitext = page.revisions?.[0]?.slots.main['*'] || '';
  const credited = wikitext.match(/Recorded by \[\[(?:user|User):[^|\]]+\|([^\]]+)\]\]/);
  const author = credited?.[1] || metadata.Artist?.value.replace(/<[^>]*>/g, '').trim();
  if (!author) { missing.push(id); continue; }
  const license = metadata.LicenseShortName.value;
  if (!/^CC (BY|0)/.test(license)) throw new Error(`Review license manually: ${title}: ${license}`);
  const originalUrl = new URL(info.url);
  originalUrl.search = '';
  const input = `.local/audio-originals/${id}.ogg`;
  let original;
  try { original = await readFile(input); }
  catch {
    const download = await request(originalUrl).catch(error => {
      console.warn(`${id}: ${error.message}`);
      return null;
    });
    if (!download) { missing.push(id); continue; }
    if (!download.ok) { console.warn(`${id}: download ${download.status}`); missing.push(id); continue; }
    original = Buffer.from(await download.arrayBuffer());
    await writeFile(input, original);
    await delay(1500);
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-vn', '-codec:a', 'libmp3lame',
    '-q:a', '4', `public/audio/ipa/${id}.mp3`]);
  manifest[`ipa-${id}`] = {
    src: `/audio/ipa/${id}.mp3`, title,
    sourceUrl: info.descriptionurl, author, license,
    licenseUrl: metadata.LicenseUrl.value.replace(/^http:/, 'https:'),
    originalUrl: originalUrl.href,
    revision: page.revisions[0].revid,
    originalSha256: createHash('sha256').update(original).digest('hex'),
    change: 'Converted Ogg to MP3; no trimming, pitch or speed changes.',
  };
  await writeFile('src/data/recordings.json', `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${id}: ${author} (${license})`);
}
await writeFile('src/data/recordings.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Saved ${Object.keys(manifest).length} recordings. Missing: ${missing.join(', ')}`);
