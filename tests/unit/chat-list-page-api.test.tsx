import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatListPage } from '@/_pages/chat-list';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

const navigation = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/chat',
  useRouter: () => navigation,
}));

class MockIntersectionObserver {
  private static observers = new Set<MockIntersectionObserver>();

  static reset() {
    MockIntersectionObserver.observers.clear();
  }

  static trigger() {
    for (const observer of MockIntersectionObserver.observers) {
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      );
    }
  }

  constructor(private readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.observers.add(this);
  }

  observe() {}

  disconnect() {
    MockIntersectionObserver.observers.delete(this);
  }
}

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
  MockIntersectionObserver.reset();
  navigation.push.mockReset();
  useAuthStore.getState().clearTokens();
  vi.unstubAllGlobals();
});

describe('ChatListPage API 연결', () => {
  beforeEach(() => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
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

  it('채팅방 아이템을 클릭하면 해당 채팅방으로 이동한다', async () => {
    const user = userEvent.setup();

    render(<ChatListPage />, { wrapper: createWrapper() });

    await user.click(await screen.findByRole('button', { name: /8시 판교역/ }));

    expect(navigation.push).toHaveBeenCalledWith('/chatroom/501');
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
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("참여 중인 채팅방이 없으면 '글 찾아보기' 클릭 시 홈으로 이동한다", async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/chat-rooms', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { items: [], next_cursor: null },
        }),
      ),
    );

    render(<ChatListPage />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('chat-list-empty')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '글 찾아보기' }));

    expect(navigation.push).toHaveBeenCalledWith('/');
  });

  it('스크롤 하단에 도달하면 next_cursor로 다음 페이지를 이어서 렌더링한다', async () => {
    const requestedCursors: string[] = [];
    const user = userEvent.setup();

    server.use(
      http.get('*/chat-rooms', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        const kind = searchParams.get('kind');
        const cursor = searchParams.get('cursor');

        if (kind === 'TAXI_POT') {
          requestedCursors.push(cursor ?? 'initial');

          return HttpResponse.json({
            message: '조회에 성공했습니다',
            data: {
              items: [
                {
                  id: cursor ? 601 : 599,
                  companion_id: cursor ? 32 : 30,
                  kind: 'TAXI_POT',
                  title: cursor ? '다음 매칭 채팅방' : '첫 매칭 채팅방',
                  host: { profile_image_url: null },
                  current_count: 2,
                  capacity: 4,
                  has_unread: false,
                },
              ],
              next_cursor: cursor ? null : 'matching-next',
            },
          });
        }

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: 501,
                companion_id: 10,
                kind: 'COMPANION',
                title: '첫 커뮤니티 채팅방',
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

    expect(await screen.findByRole('button', { name: /첫 커뮤니티 채팅방/ })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '매칭' }));
    expect(await screen.findByRole('button', { name: /첫 매칭 채팅방/ })).toBeInTheDocument();

    MockIntersectionObserver.trigger();

    expect(await screen.findByRole('button', { name: /다음 매칭 채팅방/ })).toBeInTheDocument();
    expect(requestedCursors).toEqual(['initial', 'matching-next']);
  });
});
