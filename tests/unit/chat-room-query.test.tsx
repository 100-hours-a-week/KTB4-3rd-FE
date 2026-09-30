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
  it('before_cursor로 이전 메시지 페이지를 조회하며 반대 방향 커서를 유지한다', async () => {
    const requestedParams: {
      direction: string | null;
      before: string | null;
      after: string | null;
    }[] = [];

    server.use(
      http.get('*/chat-rooms/:roomId/messages', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        const direction = searchParams.get('direction');
        const before = searchParams.get('before');
        const after = searchParams.get('after');
        requestedParams.push({ direction, before, after });

        const isBefore = direction === 'before';
        const isAfter = direction === 'after';
        let messageId = 1440;
        let content = '현재 메시지';

        if (isBefore) {
          messageId = 1438;
          content = '이전 메시지';
        } else if (isAfter) {
          messageId = 1454;
          content = '새 메시지';
        }

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: messageId,
                type: 'TEXT',
                sender: { id: 7, nickname: '우림', profile_image_url: null },
                content,
                created_at: '2026-09-05T07:40:00.000Z',
              },
            ],
            before_cursor: isBefore ? null : 'previous-page',
            after_cursor: isAfter ? null : 'newer-page',
          },
        });
      }),
    );

    const { result } = renderHook(() => useChatRoomQueries('501'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.messagesQuery.isSuccess).toBe(true));
    expect(result.current.messagesQuery.data?.pages).toHaveLength(1);
    expect(result.current.hasPreviousMessages).toBe(true);
    expect(result.current.hasNewerMessages).toBe(true);

    act(() => {
      void result.current.fetchPreviousMessages();
    });

    await waitFor(() => expect(result.current.messagesQuery.data?.pages).toHaveLength(2));
    expect(result.current.hasPreviousMessages).toBe(false);
    expect(result.current.hasNewerMessages).toBe(true);
    expect(requestedParams).toEqual([
      { direction: null, before: null, after: null },
      { direction: 'before', before: 'previous-page', after: 'newer-page' },
    ]);

    act(() => {
      void result.current.fetchNewerMessages();
    });

    await waitFor(() => expect(result.current.messagesQuery.data?.pages).toHaveLength(3));
    expect(result.current.hasNewerMessages).toBe(false);
    expect(requestedParams).toEqual([
      { direction: null, before: null, after: null },
      { direction: 'before', before: 'previous-page', after: 'newer-page' },
      { direction: 'after', before: null, after: 'newer-page' },
    ]);
  });
});
