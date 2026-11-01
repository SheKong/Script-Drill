import { readFile, writeFile } from 'node:fs/promises';
import { geoArea, geoMercator, geoPath } from 'd3-geo';

// Reuse the pinned Natural Earth dataset downloaded by fetch-bengali-map.mjs.
const collection = JSON.parse(await readFile('.local/natural-earth-countries.geojson', 'utf8'));
const country = collection.features.find(feature => feature.properties.ADM0_A3 === 'IND');
if (!country) throw new Error('India outline missing');
const polygons = country.geometry.type === 'Polygon' ? [country.geometry.coordinates] : country.geometry.coordinates;
for (const polygon of polygons) {
  if (geoArea({ type: 'Polygon', coordinates: polygon }) > 2 * Math.PI) polygon.forEach(ring => ring.reverse());
}
const projection = geoMercator().fitExtent([[8, 8], [172, 252]], country);
const outline = geoPath(projection).digits(1)(country);
await writeFile('public/maps/india.geojson', JSON.stringify(country));
await writeFile('src/data/india-map.json', JSON.stringify({
  country: '印度', outline, regions: { IN: outline },
  projection: { scale: projection.scale(), translate: projection.translate() },
  source: 'bn-india-boundaries',
}));
await writeFile('public/maps/INDIA.txt', [
  'India outline: Natural Earth v5.1.2, 1:50m Admin 0 Countries. Public domain.',
  'Source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson',
  'Terms: https://www.naturalearthdata.com/about/terms-of-use/',
  'Adaptation: feature selection, winding normalization, Mercator fit to 180 x 260, SVG path rounding.',
  'Adapted data: india.geojson. City dots are approximate, not administrative boundaries.',
  'Learning illustration only, not navigation or a statement of legal boundaries.',
].join('\n'));
console.log(`India outline: ${outline.length} path characters`);
