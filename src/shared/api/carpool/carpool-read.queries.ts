import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/client';

import type { CarpoolViewport, NearbyCarpoolsQuery } from './carpool-read.types';
import { getCarpoolPins } from './get-carpool-pins';
import { getNearbyCarpools } from './get-nearby-carpools';

type NearbyConditions = Omit<NearbyCarpoolsQuery, 'cursor'>;
function copyViewport(viewport: CarpoolViewport): CarpoolViewport {
  return {
    sw_lat: viewport.sw_lat,
    sw_lng: viewport.sw_lng,
    ne_lat: viewport.ne_lat,
    ne_lng: viewport.ne_lng,
  };
}
const readPolicy = {
  staleTime: 30_000,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: false,
  placeholderData: undefined,
  retryDelay: 1_000,
  retry: (failureCount: number, error: Error) => {
    if (error instanceof ApiError) {
      return error.status >= 500 && error.status < 600 && failureCount < 1;
    }
    return error instanceof TypeError && failureCount < 1;
  },
} as const;

export const carpoolQueries = {
  all: () => ['carpools'] as const,
  pins: (viewport: CarpoolViewport | null) => {
    const conditions = viewport ? copyViewport(viewport) : null;
    return queryOptions({
      ...readPolicy,
      gcTime: 120_000,
      queryKey: [...carpoolQueries.all(), 'pins', conditions] as const,
      enabled: conditions !== null,
      queryFn: ({ signal }) => {
        if (!conditions) {
          throw new Error('지도 조회 영역이 없습니다.');
        }
        return getCarpoolPins(conditions, signal);
      },
    });
  },
  nearby: (query: NearbyConditions | null) => {
    const conditions = query ? { ...copyViewport(query), lat: query.lat, lng: query.lng } : null;
    return infiniteQueryOptions({
      ...readPolicy,
      gcTime: 300_000,
      queryKey: [...carpoolQueries.all(), 'nearby', conditions] as const,
      enabled: conditions !== null,
      initialPageParam: undefined as string | undefined,
      queryFn: ({ signal, pageParam }) => {
        if (!conditions) {
          throw new Error('주변 카풀 조회 조건이 없습니다.');
        }
        return getNearbyCarpools({ ...conditions, cursor: pageParam }, signal);
      },
      getNextPageParam: (lastPage) => lastPage.data.next_cursor ?? undefined,
    });
  },
};
