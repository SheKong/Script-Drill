import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { geoArea, geoMercator, geoPath } from 'd3-geo';

// The pinned input is also used by fetch-bengali-map.mjs.
const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson';
const cache = '.local/nepal-natural-earth-countries.geojson';
await mkdir('.local', { recursive: true });
let contents;
try { contents = await readFile(cache, 'utf8'); }
catch {
  if (process.platform === 'win32') {
    execFileSync('pwsh', ['-NoProfile', '-File', 'scripts/fetch-reference.ps1', '-Uri', url, '-OutputFile', cache], { stdio: 'inherit' });
    contents = await readFile(cache, 'utf8');
  } else {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Map download: ${response.status}`);
    contents = await response.text();
    await writeFile(cache, contents);
  }
}
const sourceHash = createHash('sha256').update(contents).digest('hex');
if (sourceHash !== '3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb') {
  throw new Error('Nepal source checksum changed; review the pinned input before regenerating.');
}
const collection = JSON.parse(contents);
const country = collection.features.find(value => value.properties.ADM0_A3 === 'NPL');
if (!country) throw new Error('Nepal outline missing');
const polygons = country.geometry.type === 'Polygon' ? [country.geometry.coordinates] : country.geometry.coordinates;
for (const polygon of polygons) {
  if (geoArea({ type: 'Polygon', coordinates: polygon }) > 2 * Math.PI) polygon.forEach(ring => ring.reverse());
}
const projection = geoMercator().fitExtent([[8, 8], [172, 252]], country);
const outline = geoPath(projection).digits(1)(country);
await writeFile('public/maps/nepal.geojson', JSON.stringify(country));
await writeFile('src/data/nepal-map.json', JSON.stringify({
  country: '尼泊尔', outline, regions: {}, source: 'deva-nepal-boundaries',
  projection: { scale: projection.scale(), translate: projection.translate() },
}));
await writeFile('public/maps/NEPAL.txt', [
  'Nepal outline: Natural Earth v5.1.2, 1:50m Admin 0 Countries. Public domain.',
  `Source: ${url}`,
  `Source SHA-256: ${sourceHash}`,
  'Terms: https://www.naturalearthdata.com/about/terms-of-use/',
  'Adaptation: feature selection, winding normalization, Mercator fit to 180 x 260, SVG path rounding.',
  'Adapted GeoJSON: nepal.geojson. Approximate urban points, not navigation or a statement of territorial sovereignty.',
  'See docs/MAP_POLICY.md. May the world be at peace.',
].join('\n'));
console.log(`Nepal outline: ${outline.length} path characters`);
