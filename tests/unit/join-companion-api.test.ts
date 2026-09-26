import { describe, expect, it } from 'vitest';

import { joinCompanionPost, type JoinCompanionResponse } from '@/features/join-companion';

describe('join companion API', () => {
  it('동행모집 채팅 참여 후 응답의 채팅방 ID를 반환한다', async () => {
    const response = await joinCompanionPost('mock-access-token', 10);

    expect(response).toEqual<JoinCompanionResponse>({
      message: '채팅방에 참여했습니다',
      data: { chat_room_id: 501 },
    });
  });

  it.each([
    [5, 409, 'ALREADY_JOINED'],
    [11, 410, 'COMPANION_POST_CLOSED'],
    [12, 404, 'POST_NOT_FOUND'],
    [999, 500, 'INTERNAL_SERVER_ERROR'],
  ])('API 오류 응답을 상태와 코드로 변환한다', async (companionId, status, code) => {
    await expect(joinCompanionPost('mock-access-token', companionId)).rejects.toMatchObject({
      status,
      code,
    });
  });

  it('인증 토큰이 유효하지 않으면 로그인 오류를 반환한다', async () => {
    await expect(joinCompanionPost('invalid-token', 10)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      field: null,
      message: '로그인이 필요합니다',
    });
  });
});
