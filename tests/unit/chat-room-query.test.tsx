import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useChatRoomQueries } from '@/_pages/chatting/api/chat-room';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('useChatRoomQueries', () => {
  it('메시지 목록의 next_cursor로 이전 메시지 페이지를 조회한다', async () => {
    const requestedCursors: (string | null)[] = [];

    server.use(
      http.get('*/chat-rooms/:roomId/messages', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        requestedCursors.push(cursor);

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: cursor ? 1438 : 1440,
                type: 'TEXT',
                sender: { id: 7, nickname: '우림', profile_image_url: null },
                content: cursor ? '이전 메시지' : '현재 메시지',
                created_at: '2026-09-05T07:40:00.000Z',
              },
            ],
            next_cursor: cursor ? null : 'previous-page',
          },
        });
      }),
    );

    const { result } = renderHook(() => useChatRoomQueries('501'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.messagesQuery.isSuccess).toBe(true));
    expect(result.current.messagesQuery.data?.pages).toHaveLength(1);
    expect(result.current.messagesQuery.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.messagesQuery.fetchNextPage();
    });

    await waitFor(() => expect(result.current.messagesQuery.data?.pages).toHaveLength(2));
    expect(result.current.messagesQuery.hasNextPage).toBe(false);
    expect(requestedCursors).toEqual([null, 'previous-page']);
  });
});
