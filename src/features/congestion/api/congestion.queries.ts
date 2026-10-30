import { queryOptions } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import {
  getCongestionSpotDetail,
  getCongestionSpots,
  type CongestionViewport,
} from '@/entities/congestion';
import { API_QUERY_RETRY_DELAY, shouldRetryApiQuery } from '@/shared/api/query-retry';

const readPolicy = {
  staleTime: 30_000,
  gcTime: 120_000,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: false,
  placeholderData: undefined,
  retryDelay: API_QUERY_RETRY_DELAY,
  retry: shouldRetryApiQuery,
} as const;

function copyViewport(viewport: CongestionViewport): CongestionViewport {
  return {
    sw_lat: viewport.sw_lat,
    sw_lng: viewport.sw_lng,
    ne_lat: viewport.ne_lat,
    ne_lng: viewport.ne_lng,
  };
}

export const congestionQueries = {
  all: () => ['congestion'] as const,
  spots: (viewport: CongestionViewport | null, enabled = true) => {
    const conditions = viewport ? copyViewport(viewport) : null;

    return queryOptions({
      ...readPolicy,
      enabled: enabled && conditions !== null,
      queryKey: [...congestionQueries.all(), 'spots', conditions] as const,
      queryFn: async ({ signal }) => {
        if (!conditions) {
          throw new Error('혼잡도 조회 영역이 없습니다.');
        }

        return getCongestionSpots(conditions, await getAccessToken(), signal);
      },
    });
  },
  detail: (spotId: number | null, enabled = true) =>
    queryOptions({
      ...readPolicy,
      enabled: enabled && spotId !== null,
      queryKey: [...congestionQueries.all(), 'detail', spotId] as const,
      queryFn: async ({ signal }) => {
        if (spotId === null) {
          throw new Error('혼잡도 지점이 없어 상세를 조회할 수 없습니다.');
        }

        return getCongestionSpotDetail(spotId, await getAccessToken(), signal);
      },
    }),
};
