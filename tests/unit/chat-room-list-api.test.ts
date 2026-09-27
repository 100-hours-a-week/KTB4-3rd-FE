import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getChatRoomList } from '@/_pages/chat-list/api/chat-room-list';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('chat room list API', () => {
  it('kind와 cursor를 query parameter로 전달한다', async () => {
    const requestedQuery = vi.fn<(query: { kind: string | null; cursor: string | null }) => void>();

    server.use(
      http.get('*/chat-rooms', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        requestedQuery({
          kind: searchParams.get('kind'),
          cursor: searchParams.get('cursor'),
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { items: [], next_cursor: null },
        });
      }),
    );

    await getChatRoomList({ kind: 'TAXI_POT', cursor: 'next-cursor' });

    expect(requestedQuery).toHaveBeenCalledWith({
      kind: 'TAXI_POT',
      cursor: 'next-cursor',
    });
  });

  it('커뮤니티 채팅방 목록을 조회한다', async () => {
    const response = await getChatRoomList({ kind: 'COMPANION' });

    expect(response.data.items).toEqual([
      expect.objectContaining({
        id: 501,
        kind: 'COMPANION',
        title: '8시 판교역',
      }),
    ]);
  });

  it('잘못된 cursor를 거부한다', async () => {
    await expect(getChatRoomList({ kind: 'TAXI_POT', cursor: 'invalid' })).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_CURSOR',
    });
  });
});
