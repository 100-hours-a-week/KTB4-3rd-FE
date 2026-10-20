import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import type { OwnedCarRegistrationPayload, OwnedCarRegistrationData } from '../model/owned-car'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

export type OwnedCarRegistrationResponse = ApiResponse<OwnedCarRegistrationData>;

export function registerOwnedCar(
  accessToken: string,
  payload: OwnedCarRegistrationPayload,
): Promise<OwnedCarRegistrationResponse> {
  return apiFetch<OwnedCarRegistrationResponse>('/users/me/cars', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
