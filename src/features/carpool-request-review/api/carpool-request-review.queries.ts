import { queryOptions } from '@tanstack/react-query';

import { carpoolRequestQueryKeys } from '@/entities/carpool-request';
import { ApiError } from '@/shared/api/client';
import { getAccessTokenForViewer } from '@/entities/auth';

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
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          return error.status >= 500 && error.status < 600 && failureCount < 1;
        }

        return error instanceof TypeError && failureCount < 1;
      },
      retryDelay: 1_000,
      networkMode: 'always',
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: false,
      placeholderData: undefined,
      throwOnError: false,
    }),
};
