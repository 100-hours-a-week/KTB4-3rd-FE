import { apiFetch } from '@/shared/api/client';

import type { CreateSettlementRequest, CreateSettlementResponse } from './settlements.types';

export function createSettlement(
  accessToken: string,
  payload: CreateSettlementRequest,
): Promise<CreateSettlementResponse> {
  return apiFetch<CreateSettlementResponse>('/settlements', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
