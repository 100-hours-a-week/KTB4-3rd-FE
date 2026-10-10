import { useQuery } from '@tanstack/react-query';

import { mapPinsQueries } from '@/entities/map-pin';
import type { MapViewport } from '@/shared/ui/map';

function toMapPinsQuery(viewport: MapViewport) {
  return {
    sw_lat: viewport.southWest.lat,
    sw_lng: viewport.southWest.lng,
    ne_lat: viewport.northEast.lat,
    ne_lng: viewport.northEast.lng,
  };
}

export function useMapPinsQuery(viewport: MapViewport | null) {
  const query = viewport ? toMapPinsQuery(viewport) : null;

  return useQuery({
    ...mapPinsQueries.list(query),
    enabled: query !== null,
  });
}
