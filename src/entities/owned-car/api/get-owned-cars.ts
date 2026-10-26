import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

import type { OwnedCarListData } from '../model/owned-car'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

export type OwnedCarListResponse = ApiResponse<OwnedCarListData>;

export function getOwnedCars(
  accessToken: string,
  signal?: AbortSignal,
): Promise<OwnedCarListResponse> {
  return apiFetch<OwnedCarListResponse>('/users/me/cars', {
    method: 'GET',
    signal,
    token: accessToken,
  });
}
