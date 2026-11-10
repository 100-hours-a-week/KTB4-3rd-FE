import { describe, expect, it } from 'vitest';

import {
  startTaxiPotMatching,
  type TaxiPotMatchingResponse,
} from '@/features/matching-registration';

const payload = {
  origin_name: '판교역',
  origin_lat: 37.3945,
  origin_lng: 127.1112,
  dest_name: '강남역',
  dest_lat: 37.4979,
  dest_lng: 127.0276,
  departure_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

describe('taxi pots API', () => {
  it('인증 토큰과 택시팟 등록 payload로 매칭을 시작한다', async () => {
    const response = await startTaxiPotMatching('mock-access-token', payload);

    expect(response).toEqual<TaxiPotMatchingResponse>({
      message: '매칭을 시작했습니다',
      data: {
        id: null,
        chat_room_id: null,
        status: 'MATCHING',
        current_count: null,
        capacity: 4,
      },
    });
  });

  it('매칭 중 응답을 MATCHING 상태로 해석한다', async () => {
    const response = await startTaxiPotMatching('mock-access-token', payload);

    expect(response.data).toMatchObject({
      id: null,
      chat_room_id: null,
      status: 'MATCHING',
      current_count: null,
      capacity: 4,
    });
  });

  it('API 오류를 ApiError로 변환한다', async () => {
    await expect(startTaxiPotMatching('invalid-token', payload)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      field: null,
      message: '로그인이 필요합니다',
    });
  });
});
