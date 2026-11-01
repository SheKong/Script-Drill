import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { geoArea, geoMercator, geoPath } from 'd3-geo';

const dataset = '.local/natural-earth-countries.geojson';
let collection;
try {
  collection = JSON.parse(await readFile(dataset, 'utf8'));
} catch {
  const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson');
  if (!response.ok) throw new Error(`Natural Earth: HTTP ${response.status}`);
  collection = await response.json();
  await mkdir('.local', { recursive: true });
  await writeFile(dataset, JSON.stringify(collection));
}
const country = collection.features.find(feature => feature.properties.ADM0_A3 === 'ISR');
if (!country) throw new Error('Israel outline missing');
const polygons = country.geometry.type === 'Polygon' ? [country.geometry.coordinates] : country.geometry.coordinates;
for (const polygon of polygons) {
  if (geoArea({ type: 'Polygon', coordinates: polygon }) > 2 * Math.PI) polygon.forEach(ring => ring.reverse());
}
const projection = geoMercator().fitExtent([[8, 8], [172, 252]], country);
const outline = geoPath(projection).digits(1)(country);
await writeFile('public/maps/israel.geojson', JSON.stringify(country));
await writeFile('src/data/hebrew-map.json', JSON.stringify({
  country: '以色列及周边位置示意', outline, regions: { IL: outline },
  projection: { scale: projection.scale(), translate: projection.translate() },
  source: 'he-boundaries',
}));
await writeFile('public/maps/ISRAEL.txt', [
  'Outline: Natural Earth v5.1.2, 1:50m Admin 0 Countries, ISR feature. Public domain.',
  'Source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson',
  'Terms: https://www.naturalearthdata.com/about/terms-of-use/',
  'Adaptation: feature selection, winding normalization, Mercator fit to 180 x 260, SVG path rounding.',
  'Adapted data: israel.geojson. City dots are approximate locations, not administrative boundaries.',
  'Learning illustration only. Dataset lines do not express a position on disputed boundaries or sovereignty.',
].join('\n'));
console.log(`Hebrew course map: ${outline.length} path characters`);
