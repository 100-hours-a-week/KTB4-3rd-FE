import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { leaveCarpool } from '@/features/leave-carpool';

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('carpool leave API', () => {
  it('현재 사용자를 카풀에서 내보낸다', async () => {
    await expect(leaveCarpool(51)).resolves.toBeUndefined();
  });

  it('카풀 등록자는 운행 종료 전 나갈 수 없다', async () => {
    await expect(leaveCarpool(7)).rejects.toMatchObject({
      status: 403,
      code: 'HOST_CANNOT_LEAVE',
    });
  });

  it('운행 중인 카풀에서는 나갈 수 없다', async () => {
    await expect(leaveCarpool(8)).rejects.toMatchObject({
      status: 409,
      code: 'RIDE_IN_PROGRESS',
    });
  });

  it('존재하지 않는 카풀에서는 나갈 수 없다', async () => {
    await expect(leaveCarpool(404)).rejects.toMatchObject({
      status: 404,
      code: 'CARPOOL_NOT_FOUND',
    });
  });

  it('카풀 나가기 API 오류를 ApiError로 변환한다', async () => {
    await expect(leaveCarpool(999)).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
