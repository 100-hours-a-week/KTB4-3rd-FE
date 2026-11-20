import { apiFetch } from '@/shared/api/client';

import type {
  UpdateSettlementAmountRequest,
  UpdateSettlementAmountResponse,
} from './settlements.types';

export function updateSettlementAmount(
  accessToken: string,
  settlementId: number,
  payload: UpdateSettlementAmountRequest,
): Promise<UpdateSettlementAmountResponse> {
  return apiFetch<UpdateSettlementAmountResponse>(`/settlements/${settlementId}/amount`, {
    method: 'PUT',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
