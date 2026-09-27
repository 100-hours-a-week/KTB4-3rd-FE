import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatListPage } from '@/_pages/chat-list';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearTokens();
});

describe('ChatListPage API 연결', () => {
  beforeEach(() => {
    useAuthStore.getState().setAccessToken('mock-access-token');
  });

  it('커뮤니티와 매칭 탭의 kind에 맞는 목록을 렌더링한다', async () => {
    const requestedKinds: string[] = [];
    const user = userEvent.setup();

    server.use(
      http.get('*/chat-rooms', ({ request }) => {
        const kind = new URL(request.url).searchParams.get('kind');
        requestedKinds.push(kind ?? '');

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: kind === 'TAXI_POT' ? 599 : 501,
                companion_id: kind === 'TAXI_POT' ? 30 : 10,
                kind,
                title: kind === 'TAXI_POT' ? '매칭 채팅방' : '커뮤니티 채팅방',
                host: { profile_image_url: null },
                current_count: 2,
                capacity: 4,
                has_unread: false,
              },
            ],
            next_cursor: null,
          },
        });
      }),
    );

    render(<ChatListPage />, { wrapper: createWrapper() });

    expect(await screen.findByRole('button', { name: /커뮤니티 채팅방/ })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '매칭' }));

    expect(await screen.findByRole('button', { name: /매칭 채팅방/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(requestedKinds).toEqual(expect.arrayContaining(['COMPANION', 'TAXI_POT']));
    });
  });

  it('조회 실패 시 기존 오류 상태와 재시도 동작을 사용한다', async () => {
    const user = userEvent.setup();
    const requestCount = vi.fn<() => void>();

    server.use(
      http.get('*/chat-rooms', ({ request }) => {
        requestCount();

        if (new URL(request.url).searchParams.get('kind') === 'COMPANION') {
          return HttpResponse.json(
            {
              message: '서버 오류가 발생했습니다',
              error: { code: 'INTERNAL_SERVER_ERROR', field: null },
            },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { items: [], next_cursor: null },
        });
      }),
    );

    render(<ChatListPage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('chat-list-error')).toBeInTheDocument();
    const countBeforeRetry = requestCount.mock.calls.length;

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));

    await waitFor(() => {
      expect(requestCount.mock.calls.length).toBeGreaterThan(countBeforeRetry);
    });
  });
});
