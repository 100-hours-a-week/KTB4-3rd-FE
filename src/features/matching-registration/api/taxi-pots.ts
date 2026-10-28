import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';
import type { TaxiPotActiveStatus } from '@/entities/taxi-pot';
import type { MatchingRegistrationPayload } from '@/features/matching-registration/model/matching-registration-store';

export type TaxiPotMatchingData =
  | {
      id: null;
      chat_room_id: null;
      status: 'MATCHING';
      current_count: null;
      capacity: number;
    }
  | {
      id: number;
      chat_room_id: number;
      status: TaxiPotActiveStatus;
      current_count: number;
      capacity: number;
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
