import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { leaveTaxiPot } from '@/features/taxi-pot-chat';

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('taxi pot leave API', () => {
  it('현재 사용자를 택시팟에서 내보낸다', async () => {
    await expect(leaveTaxiPot(30)).resolves.toBeUndefined();
  });

  it('택시팟 나가기 API 오류를 ApiError로 변환한다', async () => {
    await expect(leaveTaxiPot(999)).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
