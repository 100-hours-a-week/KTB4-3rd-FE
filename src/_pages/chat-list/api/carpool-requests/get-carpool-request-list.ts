import { getAccessToken } from '@/entities/auth';
import { ApiError, apiFetch } from '@/shared/api/client';

import type {
  CarpoolRequestDirection,
  CarpoolRequestListQuery,
  CarpoolRequestListResponse,
} from './carpool-requests.types';

export async function getCarpoolRequestList({ direction, cursor }: CarpoolRequestListQuery) {
  const accessToken = await getAccessToken();
  const searchParams = new URLSearchParams({ direction });

  if (cursor) {
    searchParams.set('cursor', cursor);
  }

  const response = await apiFetch<CarpoolRequestListResponse>(
    `/users/me/carpool-requests?${searchParams.toString()}`,
    { token: accessToken },
  );

  if (response.data.direction !== direction) {
    throw new ApiError(502, {
      message: '요청 방향과 응답 방향이 일치하지 않습니다.',
      error: { code: 'INVALID_RESPONSE_DIRECTION' },
    });
  }

  return response;
}

export function isCarpoolRequestDirection(value: unknown): value is CarpoolRequestDirection {
  return value === 'SENT' || value === 'RECEIVED';
}
