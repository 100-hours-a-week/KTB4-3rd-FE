import { infiniteQueryOptions } from '@tanstack/react-query';

import { API_QUERY_RETRY_DELAY, shouldRetryApiQuery } from '@/shared/api/query-retry';

import { getCarpoolRequestList } from './get-carpool-request-list';
import type { CarpoolRequestDirection } from './carpool-requests.types';

export const carpoolRequestListQueries = {
  all: () => ['carpools', 'requests'] as const,
  list: (viewerId: number | null, direction: CarpoolRequestDirection) =>
    infiniteQueryOptions({
      queryKey: [...carpoolRequestListQueries.all(), { viewerId }, 'list', direction] as const,
      queryFn: ({ pageParam, signal }) => {
        if (viewerId === null) {
          throw new Error('로그인 사용자 정보를 확인한 뒤 요청 목록을 조회할 수 있습니다.');
        }

        return getCarpoolRequestList({ direction, cursor: pageParam, signal, viewerId });
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.data.next_cursor ?? undefined,
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: false,
      networkMode: 'always',
      placeholderData: undefined,
      throwOnError: false,
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
    }),
};
