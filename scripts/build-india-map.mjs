import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { geoArea, geoContains, geoMercator, geoPath } from 'd3-geo';
import { topology } from 'topojson-server';
import { presimplify, simplify } from 'topojson-simplify';
import { feature } from 'topojson-client';

// This is the China POV dataset, not the default de-facto country layer.
const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries_chn.geojson';
const cache = '.local/ne-chn.geojson';
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
const collection = JSON.parse(contents);
const sourceHash = createHash('sha256').update(contents).digest('hex');
if (sourceHash !== 'a13bf5f310fde87bc0a5f994f8ce9bd706cc198d8ee37d221e61c2546b945372') {
  throw new Error('China POV source checksum changed; review the pinned input before regenerating.');
}
const selected = collection.features.find(value => value.properties.ADM0_A3_CN === 'IND');
if (!selected) throw new Error('China POV India outline missing');
const topo = simplify(presimplify(topology({ india: selected })), 0.0002);
const country = feature(topo, topo.objects.india);
country.properties = { name: 'India', perspective: 'Natural Earth China POV', version: '5.1.2' };
const polygons = country.geometry.type === 'Polygon' ? [country.geometry.coordinates] : country.geometry.coordinates;
for (const polygon of polygons) {
  if (geoArea({ type: 'Polygon', coordinates: polygon }) > 2 * Math.PI) polygon.forEach(ring => ring.reverse());
}
if (geoContains(country, [91.86, 27.59]) || geoContains(country, [79.5, 35.2])
  || !geoContains(country, [77.2, 28.6])) {
  throw new Error('China POV regression: check eastern/western disputed areas and Delhi.');
}
const projection = geoMercator().fitExtent([[8, 8], [172, 252]], country);
const outline = geoPath(projection).digits(1)(country);
await writeFile('public/maps/india.geojson', JSON.stringify(country));
await writeFile('src/data/india-map.json', JSON.stringify({
  country: '印度', outline, regions: { IN: outline },
  projection: { scale: projection.scale(), translate: projection.translate() },
  source: 'bn-india-boundaries',
  requiresDisclaimer: true,
}));
await writeFile('public/maps/INDIA.txt', [
  'India outline: Natural Earth v5.1.2, 1:10m Admin 0 Countries, CHINA point of view. Public domain.',
  `Source: ${url}`,
  `Source SHA-256: ${sourceHash}`,
  'Terms: https://www.naturalearthdata.com/about/terms-of-use/',
  'Selection: ADM0_A3_CN=IND. Not the default de-facto layer or the India POV layer.',
  'Adaptation: topology simplification (planar area 0.0002), winding normalization, Mercator fit to 180 x 260, SVG path rounding.',
  'Adapted data: india.geojson. City dots are approximate, not administrative boundaries.',
  'Learning illustration only, not navigation or a statement of legal boundaries.',
  'China POV is an explicitly chosen display convention, not a government-reviewed or surveying-grade map.',
  'See docs/MAP_POLICY.md. Courses teach language/geography only and express no political position. May the world be at peace.',
].join('\n'));
console.log(`India outline: ${outline.length} path characters`);
