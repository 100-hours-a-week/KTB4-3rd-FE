import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { startTaxiPotMatching } from '@/features/matching-registration';
import { cancelTaxiPotMatching, getCurrentTaxiPot } from '@/features/taxi-pot-matching';
import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';
import { server } from '@/shared/api/mocks/server';
import { resetTaxiPotMockState } from '@/shared/api/mocks/taxi-pots.handlers';

const payload = {
  origin_name: '판교역',
  origin_lat: 37.3945,
  origin_lng: 127.1112,
  dest_name: '강남역',
  dest_lat: 37.4979,
  dest_lng: 127.0276,
  departure_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

async function createMatchingRequest() {
  useAuthStore.getState().setAccessToken(MOCK_ACCESS_TOKEN);
  await startTaxiPotMatching(MOCK_ACCESS_TOKEN, payload);
}

beforeEach(() => {
  resetTaxiPotMockState();
  useAuthStore.getState().clearTokens();
});

afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearTokens();
});

describe('택시팟 매칭 상태 API', () => {
  it('매칭 요청 이후 현재 택시팟을 MATCHING 상태로 조회한다', async () => {
    await createMatchingRequest();

    await expect(getCurrentTaxiPot()).resolves.toMatchObject({
      data: {
        id: null,
        chat_room_id: null,
        status: 'MATCHING',
        current_count: null,
        capacity: 4,
      },
    });
  });

  it('매칭 취소 성공 후 현재 택시팟이 없어지는 것을 확인한다', async () => {
    await createMatchingRequest();

    await expect(cancelTaxiPotMatching()).resolves.toBeUndefined();
    await expect(getCurrentTaxiPot()).resolves.toMatchObject({ data: null });
  });
});
