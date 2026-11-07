import { useLayoutEffect, useRef, useState } from 'react';
import { courses } from '../data';
import type { Knowledge } from '../types';

function useScreenMarker(compact: boolean, active: boolean) {
  const ref = useRef<SVGSVGElement>(null);
  const [marker, setMarker] = useState({ radius: 4, stroke: 1.5 });
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let resolution: MediaQueryList;
    const measure = () => {
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const scale = Math.hypot(matrix.a, matrix.b);
      const screenScale = window.devicePixelRatio * (window.visualViewport?.scale || 1);
      if (!scale || !screenScale) return;
      // CTM handles responsive/CSS scaling; DPR and visualViewport handle page/pinch zoom.
      const radius = (compact ? 2.5 : 4) / (scale * screenScale);
      const stroke = 1.5 / screenScale;
      setMarker(previous => previous.radius === radius && previous.stroke === stroke ? previous : { radius, stroke });
    };
    const watchResolution = () => {
      resolution?.removeEventListener('change', watchResolution);
      resolution = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener('change', watchResolution);
      measure();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    watchResolution();
    return () => {
      observer.disconnect();
      resolution.removeEventListener('change', watchResolution);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [compact, active]);
  return { ref, ...marker };
}

export function PlaceMap({ item, compact = false, anonymous = false }: { item?: Knowledge; compact?: boolean; anonymous?: boolean }) {
  const marker = useScreenMarker(compact, !!item?.place);
  if (!item?.place) return null;
  const course = courses[item.courseId];
  const map = item.place.mapId ? course.geographies?.[item.place.mapId] : course.geography;
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
    <svg ref={marker.ref} viewBox="0 0 180 260" role="img" aria-label={`${map.country}位置示意${anonymous ? '' : `：${item.meaning || item.title}`}`}>
      <path d={map.outline} fill="none" stroke="#89978f" strokeWidth="1" />
      {place.type === 'region' && <path data-map-region={place.regionId} d={map.regions[place.regionId]} fill="#d54747" fillOpacity=".86" />}
      {point && <circle data-map-city cx={point[0]} cy={point[1]} r={marker.radius}
        fill="#d54747" stroke="white" strokeWidth={marker.stroke} vectorEffect="non-scaling-stroke" />}
    </svg>
    {!compact && <figcaption>{map.country} · 位置示意</figcaption>}
  </figure>;
}
