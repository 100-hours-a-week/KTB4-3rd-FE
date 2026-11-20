import { apiFetch } from '@/shared/api/client';

import type { NotificationReadResponse } from './notifications.types';

export function markNotificationRead(
  accessToken: string,
  notificationId: number,
): Promise<NotificationReadResponse> {
  return apiFetch<NotificationReadResponse>(`/notifications/${notificationId}/read_at`, {
    method: 'PATCH',
    token: accessToken,
  });
}
