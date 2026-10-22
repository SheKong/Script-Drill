import { courses } from '../data';
import type { Knowledge } from '../types';

export function PlaceMap({ item, compact = false, anonymous = false }: { item?: Knowledge; compact?: boolean; anonymous?: boolean }) {
  if (!item?.place) return null;
  const map = courses[item.courseId].geography;
  if (!map) return null;
  const place = item.place;
  let point: [number, number] | undefined;
  if (place.type === 'city') {
    const [lon, lat] = place.coordinates;
    point = [
      map.projection.translate[0] + map.projection.scale * lon * Math.PI / 180,
      map.projection.translate[1] - map.projection.scale * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)),
    ];
  }
  return <figure className={`place-map ${compact ? 'compact-map' : ''}`}>
    <svg viewBox="0 0 180 260" role="img" aria-label={`${map.country}位置示意${anonymous ? '' : `：${item.meaning || item.title}`}`}>
      <path d={map.outline} fill="none" stroke="#89978f" strokeWidth="1" />
      {place.type === 'region' && <path data-map-region={place.regionId} d={map.regions[place.regionId]} fill="#d54747" fillOpacity=".86" />}
      {point && <circle data-map-city cx={point[0]} cy={point[1]} r="3.4" fill="#d54747" stroke="white" strokeWidth="1" />}
    </svg>
    {!compact && <figcaption>{map.country} · 位置示意</figcaption>}
  </figure>;
}
