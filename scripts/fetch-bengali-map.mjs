import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { geoArea, geoMercator, geoPath } from 'd3-geo';

const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson';
const cache = '.local/natural-earth-countries.geojson';
await mkdir('.local', { recursive: true });
let contents;
if (process.argv[2]) contents = await readFile(process.argv[2], 'utf8');
else {
  if (process.platform === 'win32') {
    execFileSync('pwsh', ['-NoProfile', '-File', 'scripts/fetch-reference.ps1', '-Uri', url, '-OutputFile', cache], { stdio: 'inherit' });
    contents = await readFile(cache, 'utf8');
  } else {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Map download: ${response.status}`);
    contents = await response.text();
  }
}
const collection = JSON.parse(contents);
const country = collection.features.find(feature => feature.properties.ADM0_A3 === 'BGD');
if (!country) throw new Error('Bangladesh outline missing');
const polygons = country.geometry.type === 'Polygon' ? [country.geometry.coordinates] : country.geometry.coordinates;
for (const polygon of polygons) {
  if (geoArea({ type: 'Polygon', coordinates: polygon }) > 2 * Math.PI) polygon.forEach(ring => ring.reverse());
}
const projection = geoMercator().fitExtent([[8, 8], [172, 252]], country);
const outline = geoPath(projection).digits(1)(country);
await mkdir('public/maps', { recursive: true });
await writeFile('public/maps/bangladesh.geojson', JSON.stringify(country));
await writeFile('src/data/bengali-map.json', JSON.stringify({
  country: '孟加拉国', outline, regions: { BD: outline },
  projection: { scale: projection.scale(), translate: projection.translate() },
  source: 'bn-boundaries',
}));
await writeFile('public/maps/BANGLADESH.txt', [
  'Bangladesh outline: Natural Earth v5.1.2, 1:50m Admin 0 Countries.',
  `Source: ${url}`,
  'Public domain: https://www.naturalearthdata.com/about/terms-of-use/',
  'Adaptation: Bangladesh feature selection, polygon winding normalization, Mercator fit to 180 x 260, SVG path rounding.',
  'The adapted GeoJSON is included as bangladesh.geojson. City points are approximate reference locations, not administrative boundaries.',
  'Learning illustration only, not navigation or a statement of legal boundaries.',
].join('\n'));
console.log(`Bangladesh outline: ${outline.length} path characters`);
