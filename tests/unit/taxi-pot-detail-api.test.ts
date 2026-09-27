import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { getTaxiPotDetail, type TaxiPotDetailResponse } from '@/features/taxi-pot-chat';

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('taxi pot detail API', () => {
  it('인증 토큰으로 택시팟 상세 정보를 조회한다', async () => {
    const response = await getTaxiPotDetail('30');

    expect(response).toEqual<TaxiPotDetailResponse>({
      message: '조회에 성공했습니다',
      data: {
        id: 30,
        chat_room_id: 599,
        status: 'RECRUITING',
        origin_name: '판교역',
        dest_name: '강남역',
        departure_at: '2026-09-05T08:30:00.000Z',
        current_count: 2,
        capacity: 4,
        host_id: 7,
      },
    });
  });

  it('택시팟 상세 API 오류를 ApiError로 변환한다', async () => {
    await expect(getTaxiPotDetail('404')).rejects.toMatchObject({
      status: 404,
      code: 'TAXI_POT_NOT_FOUND',
      field: null,
      message: '존재하지 않는 매칭입니다',
    });
  });
});
