import { queryOptions } from '@tanstack/react-query';

import { getAccessTokenForViewer } from '@/entities/auth';
import { carpoolDetailQueryKeys } from '@/entities/carpool';
import { API_QUERY_RETRY_DELAY, shouldRetryApiQuery } from '@/shared/api/query-retry';
import { getCarpoolDetail } from '@/shared/api/carpool';

export type CarpoolDetailQueryParams = {
  carpoolId: number | null;
  viewerId: number | null;
  isAuthenticated: boolean;
  authReady: boolean;
  enabled: boolean;
};

export const carpoolDetailQueries = {
  detail: ({
    carpoolId,
    viewerId,
    isAuthenticated,
    authReady,
    enabled,
  }: CarpoolDetailQueryParams) => {
    const resolvedViewerId = isAuthenticated ? viewerId : null;
    const canQueryAsViewer = !isAuthenticated || resolvedViewerId !== null;

    return queryOptions({
      queryKey:
        carpoolId !== null && canQueryAsViewer
          ? carpoolDetailQueryKeys.detail(carpoolId, resolvedViewerId)
          : [...carpoolDetailQueryKeys.all(), 'disabled', { viewerId: resolvedViewerId }],
      queryFn: async ({ signal }) => {
        if (carpoolId === null || !canQueryAsViewer) {
          throw new Error('카풀 정보를 확인한 뒤 상세 내용을 불러올 수 있습니다.');
        }

        const accessToken =
          resolvedViewerId === null ? undefined : await getAccessTokenForViewer(resolvedViewerId);
        return getCarpoolDetail(carpoolId, accessToken, signal);
      },
      enabled: enabled && authReady && carpoolId !== null && canQueryAsViewer,
      staleTime: 0,
      gcTime: 300_000,
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
      networkMode: 'always',
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true,
      refetchInterval: false,
      placeholderData: undefined,
      throwOnError: false,
    });
  },
};
