import { queryOptions } from '@tanstack/react-query';

import { carpoolRequestQueryKeys } from '@/entities/carpool-request';
import { getAccessTokenForViewer } from '@/entities/auth';
import { API_QUERY_RETRY_DELAY, shouldRetryApiQuery } from '@/shared/api/query-retry';

import { getCarpoolRequestDetail } from './carpool-request-review';

export type CarpoolRequestDetailQuery = {
  viewerId: number | null;
  carpoolId: number | null;
  requestId: number | null;
  enabled: boolean;
};

export const carpoolRequestReviewQueries = {
  detail: ({ viewerId, carpoolId, requestId, enabled }: CarpoolRequestDetailQuery) =>
    queryOptions({
      queryKey:
        viewerId !== null && carpoolId !== null && requestId !== null
          ? carpoolRequestQueryKeys.detail(viewerId, carpoolId, requestId)
          : [...carpoolRequestQueryKeys.all(), 'detail', 'disabled'],
      queryFn: async ({ signal }) => {
        if (viewerId === null || carpoolId === null || requestId === null) {
          throw new Error('요청 대상 정보가 없어 상세를 조회할 수 없습니다.');
        }

        return getCarpoolRequestDetail(
          await getAccessTokenForViewer(viewerId),
          carpoolId,
          requestId,
          signal,
        );
      },
      enabled: enabled && viewerId !== null && carpoolId !== null && requestId !== null,
      staleTime: 0,
      gcTime: 300_000,
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
      networkMode: 'always',
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: false,
      placeholderData: undefined,
      throwOnError: false,
    }),
};
