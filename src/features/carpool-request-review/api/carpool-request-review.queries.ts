import { queryOptions } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/client';
import { getAccessToken } from '@/entities/auth';
import { carpoolRequestQueryKeys } from '@/shared/api/carpool-request-query-keys';

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
        if (carpoolId === null || requestId === null) {
          throw new Error('요청 대상 정보가 없어 상세를 조회할 수 없습니다.');
        }

        return getCarpoolRequestDetail(await getAccessToken(), carpoolId, requestId, signal);
      },
      enabled: enabled && viewerId !== null && carpoolId !== null && requestId !== null,
      staleTime: 0,
      gcTime: 300_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          return error.status >= 500 && error.status < 600 && failureCount < 1;
        }

        return error instanceof TypeError && failureCount < 1;
      },
      retryDelay: 1_000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: false,
      placeholderData: undefined,
      throwOnError: false,
    }),
};
