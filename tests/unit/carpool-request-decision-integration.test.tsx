import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatListPage } from '@/_pages/chat-list';
import { useAuthStore } from '@/entities/auth';
import { SnackbarProvider } from '@/_app/providers';
import {
  carpoolQueries,
  type CarpoolPinsResponse,
  type NearbyCarpoolsResponse,
} from '@/shared/api/carpool';
import type { ChatRoomListResponse } from '@/entities/chat';
import { chatRoomListQueries } from '@/_pages/chat-list/api/chat-room-list';
import {
  carpoolRequestListQueries,
  type CarpoolRequestListResponse,
} from '@/_pages/chat-list/api/carpool-requests';
import { server } from '@/shared/api/mocks/server';

const navigation = vi.hoisted(() => ({ push: vi.fn<(path: string) => void>() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/chat',
  useRouter: () => navigation,
}));

const receivedItem = {
  id: 90,
  carpool_id: 53,
  status: 'PENDING' as const,
  content: '목록 미리보기 메시지',
  counterpart: { id: 9, name: '이루디', profile_image_url: null },
  origin_name: '판교역',
  dest_name: '강남역',
  departure_at: '2026-10-12T08:30:00.000Z',
  created_at: '2026-10-10T08:05:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SnackbarProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SnackbarProvider>
    );
  }

  return { Wrapper, queryClient };
}

async function openReceivedRequests(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('tab', { name: '카풀' }));
  await user.click(screen.getByRole('tab', { name: '받은 요청' }));
  await user.click(await screen.findByRole('button', { name: '요청 확인' }));
}

function requestListHandler(getItems: () => (typeof receivedItem)[] = () => [receivedItem]) {
  return http.get('*/users/me/carpool-requests', ({ request }) => {
    const direction = new URL(request.url).searchParams.get('direction');
    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        direction,
        items: direction === 'RECEIVED' ? getItems() : [],
        next_cursor: null,
      },
    });
  });
}

function detailHandler(onRequest?: (request: Request) => void, body?: () => string) {
  return http.get('*/carpools/:carpoolId/join-requests/:requestId', ({ request, params }) => {
    onRequest?.(request.clone());
    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        id: Number(params.requestId),
        carpool_id: Number(params.carpoolId),
        status: 'PENDING',
        content: body?.() ?? '상세 조회에서 가져온 요청 메시지',
        requester: { id: 9, name: '이루디 상세', profile_image_url: null },
        created_at: '2026-10-10T08:10:00.000Z',
      },
    });
  });
}

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
  useAuthStore.getState().setVerifiedViewerId('mock-access-token', 7);
  server.use(requestListHandler(), detailHandler());
});

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
  useAuthStore.getState().clearTokens();
  server.resetHandlers();
});

describe('채팅 내 받은 카풀 요청 처리', () => {
  it('수락 성공 후 요청을 받은 목록에서 제거하고 카풀·채팅 조회 캐시를 갱신한다', async () => {
    const user = userEvent.setup();
    let receivedItems = [receivedItem];
    const { Wrapper, queryClient } = createWrapper();
    const receivedQuery = carpoolRequestListQueries.list(7, 'RECEIVED');
    const pinsQuery = carpoolQueries.pins({ sw_lat: 1, sw_lng: 2, ne_lat: 3, ne_lng: 4 });
    const nearbyQuery = carpoolQueries.nearby({
      sw_lat: 1,
      sw_lng: 2,
      ne_lat: 3,
      ne_lng: 4,
      lat: 2,
      lng: 3,
    });
    const chatQuery = chatRoomListQueries.list({ kind: 'TAXI_POT' });
    const emptyPage: CarpoolRequestListResponse = {
      message: '조회에 성공했습니다',
      data: { direction: 'RECEIVED', items: [receivedItem], next_cursor: null },
    };
    queryClient.setQueryData<InfiniteData<CarpoolRequestListResponse>>(receivedQuery.queryKey, {
      pages: [emptyPage],
      pageParams: [undefined],
    });
    queryClient.setQueryData<CarpoolPinsResponse>(pinsQuery.queryKey, {
      message: '조회에 성공했습니다',
      data: { items: [], limit: 100, limit_exceeded: false },
    });
    queryClient.setQueryData<InfiniteData<NearbyCarpoolsResponse>>(nearbyQuery.queryKey, {
      pages: [{ message: '조회에 성공했습니다', data: { items: [], next_cursor: null } }],
      pageParams: [undefined],
    });
    queryClient.setQueryData<InfiniteData<ChatRoomListResponse>>(chatQuery.queryKey, {
      pages: [{ message: '조회에 성공했습니다', data: { items: [], next_cursor: null } }],
      pageParams: [undefined],
    });

    server.use(
      requestListHandler(() => receivedItems),
      http.patch('*/carpools/53/join-requests/90', async ({ request }) => {
        expect(await request.json()).toEqual({ status: 'ACCEPTED' });
        receivedItems = [];
        return HttpResponse.json({
          message: '요청을 수락했습니다',
          data: { id: 90, status: 'ACCEPTED', chat_room_id: 301, current_count: 3, capacity: 4 },
        });
      }),
    );

    render(<ChatListPage />, { wrapper: Wrapper });
    await openReceivedRequests(user);
    await user.click(await screen.findByRole('button', { name: '수락' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '카풀 요청 확인' })).not.toBeInTheDocument();
      expect(
        queryClient.getQueryData<InfiniteData<CarpoolRequestListResponse>>(receivedQuery.queryKey)
          ?.pages[0].data.items,
      ).toHaveLength(0);
    });
    expect(await screen.findByText('요청을 수락했어요.')).toBeInTheDocument();
    await waitFor(() => {
      expect(queryClient.getQueryState(pinsQuery.queryKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(nearbyQuery.queryKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(chatQuery.queryKey)?.isInvalidated).toBe(true);
    });
  });

  it('거절 오류에서는 모달과 내용을 유지하고 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    let attempt = 0;
    const { Wrapper } = createWrapper();
    server.use(
      http.patch('*/carpools/53/join-requests/90', () => {
        attempt += 1;
        if (attempt === 1) {
          return HttpResponse.json(
            { message: '입력값을 확인해주세요', error: { code: 'VALIDATION_ERROR' } },
            { status: 400 },
          );
        }
        return HttpResponse.json({
          message: '요청을 거절했습니다',
          data: { id: 90, status: 'REJECTED' },
        });
      }),
    );

    render(<ChatListPage />, { wrapper: Wrapper });
    await openReceivedRequests(user);
    await user.click(await screen.findByRole('button', { name: '거절' }));

    expect(await screen.findByText('입력값을 확인해주세요')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '카풀 요청 확인' })).toBeInTheDocument();
    expect(screen.getByText('상세 조회에서 가져온 요청 메시지')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '거절' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '거절' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '카풀 요청 확인' })).not.toBeInTheDocument(),
    );
    expect(attempt).toBe(2);
  });

  it('처리 중에는 반대 액션과 닫기를 막고 중복 PATCH를 보내지 않는다', async () => {
    const user = userEvent.setup();
    let releasePatch: (() => void) | undefined;
    let patchCount = 0;
    const patchStarted = new Promise<void>((resolve) => {
      server.use(
        http.patch('*/carpools/53/join-requests/90', async () => {
          patchCount += 1;
          resolve();
          await new Promise<void>((resolvePatch) => {
            releasePatch = resolvePatch;
          });
          return HttpResponse.json({
            message: '요청을 수락했습니다',
            data: { id: 90, status: 'ACCEPTED', chat_room_id: 301, current_count: 3, capacity: 4 },
          });
        }),
      );
    });
    const { Wrapper, queryClient } = createWrapper();
    const previousViewerQuery = carpoolRequestListQueries.list(7, 'RECEIVED');

    render(<ChatListPage />, { wrapper: Wrapper });
    await openReceivedRequests(user);
    await user.click(await screen.findByRole('button', { name: '수락' }));
    await patchStarted;

    expect(screen.getByRole('button', { name: '수락' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '거절' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: '카풀 요청 확인' })).toBeInTheDocument();
    expect(patchCount).toBe(1);

    useAuthStore.getState().setAccessToken('another-account-token');
    releasePatch?.();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '카풀 요청 확인' })).not.toBeInTheDocument(),
    );
    expect(await screen.findByText(/로그인 계정이 바뀌어 요청을 닫았어요/)).toBeInTheDocument();
    expect(queryClient.getQueryState(previousViewerQuery.queryKey)?.isInvalidated).toBe(true);
  });

  it('5xx 결과가 불확실하면 상세 상태만 다시 확인하고 자동 PATCH 재전송을 하지 않는다', async () => {
    const user = userEvent.setup();
    let patchCount = 0;
    let detailCount = 0;
    const { Wrapper } = createWrapper();
    server.use(
      detailHandler(() => {
        detailCount += 1;
      }),
      http.patch('*/carpools/53/join-requests/90', () => {
        patchCount += 1;
        return HttpResponse.json(
          { message: '서버 오류가 발생했습니다', error: { code: 'INTERNAL_SERVER_ERROR' } },
          { status: 500 },
        );
      }),
    );

    render(<ChatListPage />, { wrapper: Wrapper });
    await openReceivedRequests(user);
    await user.click(await screen.findByRole('button', { name: '수락' }));

    expect(await screen.findByText(/요청 상태를 확인했어요/)).toBeInTheDocument();
    expect(detailCount).toBeGreaterThanOrEqual(2);
    expect(patchCount).toBe(1);
    expect(screen.getByRole('button', { name: '수락' })).toBeEnabled();
  });

  it.each([
    [403, 'HOST_ONLY', '요청을 처리할 권한이 없어요.', false],
    [404, 'CARPOOL_REQUEST_NOT_FOUND', '요청을 찾을 수 없어 목록을 새로 확인했어요.', false],
    [409, 'CAPACITY_FULL', '모집 인원이 가득 차서 수락할 수 없어요.', true],
    [409, 'CARPOOL_CLOSED', '마감된 카풀이라 요청을 처리할 수 없어요.', false],
    [409, 'REQUEST_ALREADY_HANDLED', '이미 처리된 요청이에요.', false],
  ])('%i %s 응답을 모달 상태에 반영한다', async (status, code, message, remainsOpen) => {
    const user = userEvent.setup();
    const { Wrapper } = createWrapper();
    server.use(
      http.patch('*/carpools/53/join-requests/90', () =>
        HttpResponse.json({ message: '요청을 처리할 수 없습니다', error: { code } }, { status }),
      ),
    );

    render(<ChatListPage />, { wrapper: Wrapper });
    await openReceivedRequests(user);
    await user.click(await screen.findByRole('button', { name: '수락' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '카풀 요청 확인' }) !== null).toBe(remainsOpen),
    );
    expect(screen.queryByRole('button', { name: '거절' }) !== null).toBe(remainsOpen);
  });
});
