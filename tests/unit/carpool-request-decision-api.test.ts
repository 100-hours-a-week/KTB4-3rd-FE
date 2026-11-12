import { describe, expect, it } from 'vitest';

import { decideCarpoolRequest } from '@/features/carpool-request-decision';

describe('carpool request decision API', () => {
  it('카풀 동승 요청을 수락하고 채팅방과 인원 정보를 반환한다', async () => {
    const response = await decideCarpoolRequest('mock-access-token', 1, 1, {
      status: 'ACCEPTED',
    });

    expect(response).toEqual({
      message: '요청을 수락했습니다',
      data: {
        id: 1,
        status: 'ACCEPTED',
        chat_room_id: 301,
        current_count: 3,
        capacity: 4,
      },
    });
  });

  it('카풀 동승 요청을 거절한다', async () => {
    const response = await decideCarpoolRequest('mock-access-token', 1, 2, {
      status: 'REJECTED',
    });

    expect(response).toEqual({
      message: '요청을 거절했습니다',
      data: { id: 2, status: 'REJECTED' },
    });
  });

  it.each([
    [403, 1, 403, 'HOST_ONLY'],
    [1, 404, 404, 'CARPOOL_REQUEST_NOT_FOUND'],
    [1, 4091, 409, 'REQUEST_ALREADY_HANDLED'],
    [1, 4092, 409, 'CAPACITY_FULL'],
    [1, 4093, 409, 'CARPOOL_CLOSED'],
    [1, 500, 500, 'INTERNAL_SERVER_ERROR'],
  ])('서버 오류를 상태와 코드로 변환한다', async (companionId, requestId, status, code) => {
    await expect(
      decideCarpoolRequest('mock-access-token', companionId, requestId, { status: 'ACCEPTED' }),
    ).rejects.toMatchObject({ status, code });
  });

  it('인증 토큰이 유효하지 않으면 로그인 오류를 반환한다', async () => {
    await expect(
      decideCarpoolRequest('invalid-token', 1, 1, { status: 'ACCEPTED' }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      field: null,
    });

    const response = await fetch('/api/carpools/1/join-requests/1', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });

    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
  });

  it.each([{}, { status: 'INVALID' }])(
    '잘못된 상태 값은 유효성 오류로 변환한다',
    async (payload) => {
      await expect(
        decideCarpoolRequest('mock-access-token', 1, 1, payload as never),
      ).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR',
        field: 'status',
      });
    },
  );

  it('유효성 오류 응답에 문서화된 details 배열을 반환한다', async () => {
    const response = await fetch('/api/carpools/1/join-requests/1', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: '유효하지 않은 상태입니다',
      error: {
        code: 'VALIDATION_ERROR',
        field: 'status',
        details: [{ field: 'status', reason: 'REQUIRED' }],
      },
    });
  });
});
