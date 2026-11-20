import { infiniteQueryOptions } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { API_QUERY_RETRY_DELAY, shouldRetryApiQuery } from '@/shared/api/query-retry';
import { getNotifications, type NotificationTab } from '@/shared/api/notifications';

export const notificationQueries = {
  all: () => ['notifications'] as const,
  lists: () => [...notificationQueries.all(), 'list'] as const,
  list: (tab: NotificationTab, enabled = true) =>
    infiniteQueryOptions({
      queryKey: [...notificationQueries.lists(), tab] as const,
      queryFn: async ({ pageParam, signal }) =>
        getNotifications(await getAccessToken(), { tab, cursor: pageParam }, signal),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.data.next_cursor ?? undefined,
      enabled,
      staleTime: 0,
      gcTime: 300_000,
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }),
};
