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
  'retro-t': 'Voiceless retroflex stop.oga',
  'retro-d': 'Voiced retroflex stop.oga',
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
  ph: 'Aspirated voiceless bilabial stop',
  th: 'Aspirated voiceless alveolar stop',
  chh: 'Voiceless alveolo-palatal affricate (aspirated)',
};

// Explicit, reviewed filenames: a title-only .ogg guess misses .oga and renamed assets.
const thaiCatalog = {
  'th-k': ['Th-gaw-gai.ogg', 'กอ ไก่'],
  'th-word-chiangmai': ['Th-Chiang Mai.ogg', 'เชียงใหม่'],
  'th-word-bangkok': ['Th-Krung Thep.ogg', 'กรุงเทพ'],
  'th-word-chonburi': ['Th-chonburi.ogg', 'ชลบุรี'],
  'th-word-phuket': ['Th-Phuket.ogg', 'ภูเก็ต'],
  'th-word-mueang': ['Mueang (TH).opus', 'เมือง'],
  'th-word-sukhothai': ['Sukhothai Pronunciation (TH).ogg', 'สุโขทัย'],
  'th-word-nuea': ['Th-nuea5.ogg', 'เหนือ'],
  'th-word-tha': ['Th-thaa3.ogg', 'ท่า'],
  'th-ue': ['Th-fuek2.ogg', 'ฝึก'],
  'th-word-ban': ['LL-Q9217 (tha)-Patsagorn Y.-บ้าน.wav', 'บ้าน'],
  'th-word-pak': ['LL-Q9217 (tha)-Patsagorn Y.-ปาก.wav', 'ปาก'],
  'th-word-ko': ['LL-Q9217 (tha)-Patsagorn Y.-เกาะ.wav', 'เกาะ'],
  'th-word-khon': ['LL-Q9217 (tha)-Thas (Thas Tayapongsak)-คน.wav', 'คน'],
  'th-word-khao': ['LL-Q9217 (tha)-咽頭べさ-เขา.wav', 'เขา'],
};
const entries = [
  ...Object.entries(thaiCatalog).map(([id, [file, title]]) => ({ id, title, file, folder: 'thai' })),
  ...Object.entries(catalog).map(([id, title]) => ({ id: `ipa-${id}`, title,
    file: /\.(ogg|oga|opus|wav|mp3)$/i.test(title) ? title : `${title}.ogg`, folder: 'ipa' })),
];

await mkdir('.local/audio-originals', { recursive: true });
const manifest = JSON.parse(await readFile('src/data/recordings.json', 'utf8').catch(() => '{}'));
const missing = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let result;
    try {
      result = await fetch(url, { signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'ScriptDrill/1.0 (educational pronunciation assets)' } });
    } catch (error) {
      if (attempt === 3) throw error;
      await delay(2000 * (attempt + 1));
      continue;
    }
    if (result.status !== 429 && result.status < 500) return result;
    const retryAfter = Number(result.headers.get('retry-after') || 2 ** (attempt + 1));
    console.warn(`HTTP ${result.status}; respecting Retry-After: ${retryAfter}s`);
    await delay(retryAfter * 1000);
  }
  throw new Error(`Request failed after retries: ${url}`);
}
for (const { id, title, file, folder } of entries) {
  if (manifest[id]) continue;
  await mkdir(`public/audio/${folder}`, { recursive: true });
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({
    action: 'query', format: 'json', redirects: '1', prop: 'imageinfo|revisions',
    iiprop: 'url|extmetadata', rvprop: 'content|ids', rvslots: 'main', titles: `File:${file}`,
  }).toString();
  const response = await request(api).catch(error => {
    console.warn(`${id}: ${error.message}`);
    return null;
  });
  if (!response) { missing.push(id); continue; }
  if (!response.ok) { console.warn(`${id}: Commons API ${response.status}`); missing.push(id); continue; }
  const body = await response.json();
  const page = Object.values(body.query.pages)[0];
  const info = page.imageinfo?.[0];
  const metadata = info?.extmetadata;
  if (!info) { missing.push(id); continue; }
  const wikitext = page.revisions?.[0]?.slots.main['*'] || '';
  const credited = wikitext.match(/(?:Recorded|Created) by:? \[\[User:([^|\]]+)(?:\|([^\]]+))?\]\]/i);
  const templated = wikitext.match(/Recorded by \{\{u\|([^}]+)\}\}/i);
  const author = credited?.[2] || credited?.[1] || templated?.[1] || metadata.Artist?.value.replace(/<[^>]*>/g, '').trim();
  if (!author) { missing.push(id); continue; }
  const license = metadata.LicenseShortName?.value;
  const publicDomain = license === 'Public domain' && /\{\{PD-user-en\|Octane\}\}/i.test(wikitext);
  if (!/^(?:CC BY(?:-SA)? \d\.\d|CC0(?: 1\.0)?)$/.test(license || '') && !publicDomain) {
    throw new Error(`Review license manually: ${title}: ${license}`);
  }
  const licenseUrl = metadata.LicenseUrl?.value || (publicDomain ? 'https://commons.wikimedia.org/wiki/Template:PD-user-en' : undefined);
  if (!licenseUrl) { missing.push(id); continue; }
  const originalUrl = new URL(info.url);
  originalUrl.search = '';
  const input = `.local/audio-originals/${id}.${file.split('.').at(-1)}`;
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
  const basename = folder === 'ipa' ? id.slice(4) : id;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-vn', '-codec:a', 'libmp3lame',
    '-q:a', '4', `public/audio/${folder}/${basename}.mp3`]);
  manifest[id] = {
    src: `/audio/${folder}/${basename}.mp3`, title,
    sourceUrl: info.descriptionurl, author, license,
    licenseUrl: licenseUrl.replace(/^http:/, 'https:'),
    originalUrl: originalUrl.href,
    revision: page.revisions[0].revid,
    originalSha256: createHash('sha256').update(original).digest('hex'),
    change: `Converted ${file.split('.').at(-1).toUpperCase()} to MP3; no trimming, pitch or speed changes.`,
    ...(folder === 'thai' ? { spokenText: title } : {}),
  };
  await writeFile('src/data/recordings.json', `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${id}: ${author} (${license})`);
  await delay(7000);
}
await writeFile('src/data/recordings.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Saved ${Object.keys(manifest).length} recordings. Unavailable catalog files: ${missing.join(', ') || 'none'}`);
if (!manifest['ipa-kh']) console.log('Known course gap: ipa-kh; no reviewed reusable isolated recording in the catalog.');
