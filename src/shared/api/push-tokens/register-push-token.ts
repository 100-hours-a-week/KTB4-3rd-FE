import { apiFetch } from '@/shared/api/client';

import type { PushTokenPayload } from './push-tokens.types';

export function registerPushToken(accessToken: string, payload: PushTokenPayload): Promise<void> {
  return apiFetch<void>('/push-tokens', {
    method: 'PUT',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
