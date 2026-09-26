import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';
import type { MatchingRegistrationPayload } from '@/features/matching-registration/model/matching-registration-store';

export type TaxiPotMatchingData = {
  id: number;
  chat_room_id: number;
  status: 'RECRUITING';
  current_count: number;
  capacity: 4;
};

export type TaxiPotMatchingResponse = ApiResponse<TaxiPotMatchingData>;

export function startTaxiPotMatching(
  accessToken: string,
  payload: MatchingRegistrationPayload,
): Promise<TaxiPotMatchingResponse> {
  return apiFetch<TaxiPotMatchingResponse>('/taxi-pots', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
