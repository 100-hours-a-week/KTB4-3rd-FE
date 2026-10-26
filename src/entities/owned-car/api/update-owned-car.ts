import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import type { OwnedCarRegistrationPayload, OwnedCarUpdateData } from '../model/owned-car'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

export type OwnedCarUpdateResponse = ApiResponse<OwnedCarUpdateData>;

export function updateOwnedCar(
  accessToken: string,
  carId: number,
  payload: OwnedCarRegistrationPayload,
): Promise<OwnedCarUpdateResponse> {
  return apiFetch<OwnedCarUpdateResponse>(`/users/me/cars/${carId}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
    token: accessToken,
  });
}
