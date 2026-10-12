import { apiFetch } from '@/shared/api/client';

import type { NotificationListQuery, NotificationListResponse } from './notifications.types';

export function getNotifications(
  accessToken: string,
  query: NotificationListQuery,
  signal?: AbortSignal,
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();

  if (query.tab !== undefined) {
    params.set('tab', query.tab);
  }

  if (query.cursor !== undefined) {
    params.set('cursor', query.cursor);
  }

  const search = params.size > 0 ? `?${params.toString()}` : '';

  return apiFetch<NotificationListResponse>(`/notifications${search}`, {
    token: accessToken,
    signal,
  });
}
