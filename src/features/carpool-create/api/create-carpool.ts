import { apiFetch } from '@/shared/api/client';

import type { CarpoolCreatePayload, CarpoolCreateResponse } from './carpool-create.types';

export function createCarpool(
  accessToken: string,
  payload: CarpoolCreatePayload,
): Promise<CarpoolCreateResponse> {
  return apiFetch<CarpoolCreateResponse>('/carpools', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
