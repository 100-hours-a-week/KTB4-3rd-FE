import { infiniteQueryOptions } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/client';

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

        return getCarpoolRequestList({ direction, cursor: pageParam, signal });
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
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          return error.status >= 500 && error.status < 600 && failureCount < 1;
        }

        return error instanceof TypeError && failureCount < 1;
      },
      retryDelay: 1_000,
    }),
};
