import { useQuery } from '@tanstack/react-query';

import type { MapCoordinate } from '@/shared/types/common';
import type { MapViewport } from '@/shared/ui/map';

import { nearbyPostsQueries } from './nearby-posts.query';

function toNearbyPostsQuery(location: MapCoordinate, viewport: MapViewport) {
  return {
    lat: location.lat,
    lng: location.lng,
    sw_lat: viewport.southWest.lat,
    sw_lng: viewport.southWest.lng,
    ne_lat: viewport.northEast.lat,
    ne_lng: viewport.northEast.lng,
  };
}

export function useNearbyPostsQuery(location: MapCoordinate | null, viewport: MapViewport | null) {
  const query = location && viewport ? toNearbyPostsQuery(location, viewport) : null;

  return useQuery({
    ...nearbyPostsQueries.list(query),
    enabled: query !== null,
  });
}
