import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getChatRoomDetail,
  getChatRoomMessages,
  markChatRoomAsRead,
} from '@/_pages/chatting/api/chat-room';
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

  it('채팅방 메시지 목록과 양방향 커서를 조회한다', async () => {
    const response = await getChatRoomMessages('501');

    expect(response.data.items).toHaveLength(5);
    expect(response.data.items[0]).toMatchObject({
      id: 1441,
      type: 'TEXT',
    });
    expect(response.data.items[2]).toMatchObject({
      id: 1453,
      type: 'SYSTEM_RIDE_ENDED',
    });
    expect(response.data.items[4]).toMatchObject({
      id: 1439,
      type: 'SYSTEM_LEAVE',
      leaver: { name: '민준' },
    });
    expect(response.data.before_cursor).toBe('v1.eyJpZCI6MTQzMn0');
    expect(response.data.after_cursor).toBeNull();
  });

  it('존재하지 않는 채팅방 오류를 반환한다', async () => {
    await expect(getChatRoomDetail('404')).rejects.toMatchObject({
      status: 404,
      code: 'CHATROOM_NOT_FOUND',
    });
  });

  it('잘못된 메시지 커서를 거부한다', async () => {
    await expect(
      getChatRoomMessages('501', {
        direction: 'before',
        before: 'invalid',
        after: 'current-page',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_CURSOR',
    });
  });

  it('채팅방의 마지막 메시지를 읽음 처리한다', async () => {
    await expect(markChatRoomAsRead('501', '1452')).resolves.toMatchObject({
      message: '읽음 처리되었습니다',
      data: { last_read_message_id: 1452, has_unread: false },
    });
  });

  it('채팅방에 속하지 않은 메시지의 읽음 처리를 거부한다', async () => {
    await expect(markChatRoomAsRead('501', '9999')).rejects.toMatchObject({
      status: 404,
      code: 'CHATROOM_NOT_FOUND',
    });
  });
});
