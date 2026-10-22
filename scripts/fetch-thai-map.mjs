import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { geoArea, geoMercator, geoPath } from 'd3-geo';
import { topology } from 'topojson-server';
import { feature, merge } from 'topojson-client';
import { presimplify, quantile, simplify } from 'topojson-simplify';

// Pin the source revision so a future upstream boundary change is deliberate.
const url = 'https://raw.githubusercontent.com/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/THA/ADM1/geoBoundaries-THA-ADM1_simplified.geojson';
const collection = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : await (async () => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Map download: ${response.status}`);
  return response.json();
})();
for (const feature of collection.features) {
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  for (const polygon of polygons) {
    if (geoArea({ type: 'Polygon', coordinates: polygon }) > 2 * Math.PI) {
      polygon.forEach(ring => ring.reverse());
    }
  }
}
const weighted = presimplify(topology({ provinces: collection }, 1e5));
const topo = simplify(weighted, quantile(weighted, .06));
const simplified = feature(topo, topo.objects.provinces);
const country = merge(topo, topo.objects.provinces.geometries);
const projection = geoMercator().fitExtent([[8, 8], [172, 252]], country);
const path = geoPath(projection).digits(1);
const regions = Object.fromEntries(simplified.features.map(feature => [feature.properties.shapeName, path(feature)]));
if (Object.keys(regions).length !== 77) throw new Error('Expected 76 provinces and Bangkok');
await mkdir('public/maps', { recursive: true });
await writeFile('public/maps/thailand-adm1.geojson', JSON.stringify(collection));
await writeFile('src/data/thai-map.json', JSON.stringify({
  country: '泰国', outline: path(country), regions,
  projection: { scale: projection.scale(), translate: projection.translate() },
  source: 'thai-boundaries',
}));
await writeFile('public/maps/README.txt', [
  'Thailand ADM1 boundaries, 76 provinces + Bangkok. Approximate learning maps, not navigation or a statement of legal boundaries.',
  `Source: ${url}`,
  'geoBoundaries THA-ADM1-36821470; boundary year 2017; build December 12, 2023.',
  'Original contributors: OpenStreetMap contributors / Wambacher. https://www.openstreetmap.org/copyright',
  'License: Open Database License 1.0 (ODbL): https://opendatacommons.org/licenses/odbl/1-0/',
  'Adaptation: winding normalization, quantization, shared-topology simplification (6% vertices retained), merged country outline, Mercator projection, rounded SVG paths.',
  'The adapted source database is included alongside this file as thailand-adm1.geojson under the same ODbL license.',
].join('\n'));
console.log(Object.keys(regions).join('\n'));
