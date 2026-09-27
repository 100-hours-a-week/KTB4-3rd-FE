import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useChatRoomListQuery } from '@/_pages/chat-list/api/chat-room-list';
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

describe('useChatRoomListQuery', () => {
  it('next_cursor를 이용해 다음 채팅방 목록 페이지를 조회한다', async () => {
    const requestedCursors: (string | null)[] = [];

    server.use(
      http.get('*/chat-rooms', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        requestedCursors.push(cursor);

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: cursor ? 601 : 599,
                companion_id: cursor ? 32 : 30,
                kind: 'TAXI_POT',
                title: cursor ? '다음 페이지' : '첫 페이지',
                host: { profile_image_url: null },
                current_count: 2,
                capacity: 4,
                has_unread: false,
              },
            ],
            next_cursor: cursor ? null : 'next-page',
          },
        });
      }),
    );

    const { result } = renderHook(() => useChatRoomListQuery('matching'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages.flatMap((page) => page.data.items)).toHaveLength(2);
    expect(result.current.hasNextPage).toBe(false);
    expect(requestedCursors).toEqual([null, 'next-page']);
  });
});
