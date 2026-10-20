import { apiFetch } from '@/shared/api/client';

import type { PushTokenPayload } from './push-tokens.types';

export function deletePushToken(accessToken: string, payload: PushTokenPayload): Promise<void> {
  return apiFetch<void>('/push-tokens', {
    method: 'DELETE',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
