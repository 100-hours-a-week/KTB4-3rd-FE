import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { leaveCompanion } from '@/features/leave-companion';

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('companion post leave API', () => {
  it('현재 사용자를 동행모집에서 내보낸다', async () => {
    await expect(leaveCompanion(10)).resolves.toBeUndefined();
  });

  it('동행모집 나가기 API 오류를 ApiError로 변환한다', async () => {
    await expect(leaveCompanion(999)).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
