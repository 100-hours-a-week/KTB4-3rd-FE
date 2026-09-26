import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getChatRoomDetail, getChatRoomMessages } from '@/_pages/chatting/api/chat-room';
import { useAuthStore } from '@/entities/auth';

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('chat room API', () => {
  it('채팅방 상세 정보를 조회한다', async () => {
    const response = await getChatRoomDetail('501');

    expect(response).toMatchObject({
      message: '조회에 성공했습니다',
      data: {
        id: 501,
        title: '8시 판교역',
        current_count: 3,
        capacity: 4,
        last_read_message_id: 1440,
      },
    });
  });

  it('채팅방 메시지 목록과 다음 커서를 조회한다', async () => {
    const response = await getChatRoomMessages('501');

    expect(response.data.items).toHaveLength(3);
    expect(response.data.items[0]).toMatchObject({
      id: 1452,
      type: 'SYSTEM_RIDE_START_REQUESTED',
    });
    expect(response.data.next_cursor).toBe('v1.eyJsYXN0X2lkIjoxNDQwfQ');
  });

  it('존재하지 않는 채팅방 오류를 반환한다', async () => {
    await expect(getChatRoomDetail('404')).rejects.toMatchObject({
      status: 404,
      code: 'CHATROOM_NOT_FOUND',
    });
  });

  it('잘못된 메시지 커서를 거부한다', async () => {
    await expect(getChatRoomMessages('501', 'invalid')).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_CURSOR',
    });
  });
});
