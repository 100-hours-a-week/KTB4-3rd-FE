import { apiFetch } from '@/shared/api/client';

import type {
  MarkAllNotificationsReadRequest,
  MarkAllNotificationsReadResponse,
} from './notifications.types';

export function markAllNotificationsRead(
  accessToken: string,
  payload: MarkAllNotificationsReadRequest,
): Promise<MarkAllNotificationsReadResponse> {
  return apiFetch<MarkAllNotificationsReadResponse>('/notifications/read-all', {
    method: 'PATCH',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
