import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatListPage } from '@/_pages/chat-list';
import { useAuthStore } from '@/entities/auth';
import { carpoolDetailQueryKeys } from '@/entities/carpool';
import { carpoolRequestQueryKeys } from '@/entities/carpool-request';
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
  return http.get('*/carpools/:carpoolId/join-requests/:requestId', ({ request }) => {
    onRequest?.(request.clone());
    return HttpResponse.json(detailResponse(body?.() ?? '상세 조회에서 가져온 요청 메시지'));
  });
}

function detailResponse(content: string) {
  return {
    message: '조회에 성공했습니다',
    data: {
      id: 90,
      carpool_id: 53,
      status: 'PENDING',
      content,
      requester: { id: 9, name: '이루디 상세', profile_image_url: null },
      created_at: '2026-10-10T08:10:00.000Z',
    },
  };
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
  it('첫 페이지가 비어 있어도 다음 커서가 있으면 항목을 찾을 때까지 조회한다', async () => {
    const user = userEvent.setup();
    let releaseNextPage: (() => void) | undefined;
    let markNextPageStarted: (() => void) | undefined;
    const nextPageStarted = new Promise<void>((resolve) => {
      markNextPageStarted = resolve;
    });
    const cursors: (string | null)[] = [];
    const { Wrapper } = createWrapper();

    server.use(
      http.get('*/users/me/carpool-requests', async ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        const cursor = searchParams.get('cursor');
        if (searchParams.get('direction') === 'RECEIVED') {
          cursors.push(cursor);
        }

        if (cursor === null) {
          return HttpResponse.json({
            message: '조회에 성공했습니다',
            data: { direction: 'RECEIVED', items: [], next_cursor: 'after-empty-page' },
          });
        }

        if (cursor === 'after-empty-page') {
          return HttpResponse.json({
            message: '조회에 성공했습니다',
            data: {
              direction: 'RECEIVED',
              items: [],
              next_cursor: 'after-second-empty-page',
            },
          });
        }

        markNextPageStarted?.();
        await new Promise<void>((resolve) => (releaseNextPage = resolve));
        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'RECEIVED', items: [receivedItem], next_cursor: null },
        });
      }),
    );

    render(<ChatListPage />, { wrapper: Wrapper });
    await user.click(await screen.findByRole('tab', { name: '카풀' }));
    await user.click(screen.getByRole('tab', { name: '받은 요청' }));
    await nextPageStarted;

    expect(screen.queryByTestId('carpool-request-list-empty')).not.toBeInTheDocument();
    expect(cursors).toEqual([null, 'after-empty-page', 'after-second-empty-page']);

    releaseNextPage?.();
    expect(await screen.findByRole('button', { name: '요청 확인' })).toBeInTheDocument();
    expect(screen.queryByTestId('carpool-request-list-empty')).not.toBeInTheDocument();
  });

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
    const carpoolChatQuery = chatRoomListQueries.list({ kind: 'CARPOOL' });
    const detailKey = carpoolDetailQueryKeys.detail(53, 7);
    const requestDetailKey = carpoolRequestQueryKeys.detail(7, 53, 90);
    queryClient.setQueryData(detailKey, {
      message: '조회에 성공했습니다',
      data: {
        id: 53,
        status: 'RECRUITING',
        host: { id: 7, name: '방장', profile_image_url: null },
        origin_name: '서울역',
        dest_name: '판교역',
        departure_at: '2026-10-10T09:40:00',
        car_model: '아반떼',
        current_count: 2,
        capacity: 4,
        is_full: false,
        participants: [],
      },
    });
    queryClient.setQueryData(requestDetailKey, detailResponse('상세 캐시 메시지'));
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
    queryClient.setQueryData<InfiniteData<ChatRoomListResponse>>(carpoolChatQuery.queryKey, {
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
      expect(queryClient.getQueryState(carpoolChatQuery.queryKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
    });
    expect(
      queryClient.getQueryData<{ data: { status: string } }>(requestDetailKey)?.data.status,
    ).toBe('ACCEPTED');
  });

  it('거절 성공 시 받은 목록과 요청 상세만 갱신하고 카풀·채팅 데이터는 유지한다', async () => {
    const user = userEvent.setup();
    let receivedItems = [receivedItem];
    const { Wrapper, queryClient } = createWrapper();
    const receivedQuery = carpoolRequestListQueries.list(7, 'RECEIVED');
    const sentQuery = carpoolRequestListQueries.list(7, 'SENT');
    const pinsQuery = carpoolQueries.pins({ sw_lat: 1, sw_lng: 2, ne_lat: 3, ne_lng: 4 });
    const nearbyQuery = carpoolQueries.nearby({
      sw_lat: 1,
      sw_lng: 2,
      ne_lat: 3,
      ne_lng: 4,
      lat: 2,
      lng: 3,
    });
    const detailKey = carpoolDetailQueryKeys.detail(53, 7);
    const requestDetailKey = carpoolRequestQueryKeys.detail(7, 53, 90);
    const taxiChatQuery = chatRoomListQueries.list({ kind: 'TAXI_POT' });
    const carpoolChatQuery = chatRoomListQueries.list({ kind: 'CARPOOL' });
    for (const key of [
      sentQuery.queryKey,
      pinsQuery.queryKey,
      nearbyQuery.queryKey,
      detailKey,
      taxiChatQuery.queryKey,
      carpoolChatQuery.queryKey,
    ]) {
      queryClient.setQueryData(key, { pages: [], pageParams: [] });
    }
    queryClient.setQueryData(requestDetailKey, detailResponse('요청 메시지'));
    server.use(
      requestListHandler(() => receivedItems),
      http.patch('*/carpools/53/join-requests/90', () => {
        receivedItems = [];
        return HttpResponse.json({
          message: '요청을 거절했습니다',
          data: { id: 90, status: 'REJECTED' },
        });
      }),
    );

    render(<ChatListPage />, { wrapper: Wrapper });
    await openReceivedRequests(user);
    await user.click(await screen.findByRole('button', { name: '거절' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(
        queryClient.getQueryData<InfiniteData<CarpoolRequestListResponse>>(receivedQuery.queryKey)
          ?.pages[0].data.items,
      ).toEqual([]),
    );
    expect(queryClient.getQueryState(sentQuery.queryKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(pinsQuery.queryKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(nearbyQuery.queryKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(taxiChatQuery.queryKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(carpoolChatQuery.queryKey)?.isInvalidated).toBe(false);
    expect(
      queryClient.getQueryData<{ data: { status: string } }>(requestDetailKey)?.data.status,
    ).toBe('REJECTED');
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

  it('상세 확인 실패와 불명확한 PATCH 후 닫았다 다시 열어도 재조회 전에는 처리하지 않는다', async () => {
    const user = userEvent.setup();
    let detailCount = 0;
    let patchCount = 0;
    let releaseDetail: (() => void) | undefined;
    let markDetailStarted: (() => void) | undefined;
    const detailStarted = new Promise<void>((resolve) => (markDetailStarted = resolve));
    server.use(
      http.get('*/carpools/:carpoolId/join-requests/:requestId', async () => {
        detailCount += 1;
        if (detailCount === 1) {
          markDetailStarted?.();
          await new Promise<void>((resolve) => (releaseDetail = resolve));
        }
        if ([1, 3, 4].includes(detailCount)) {
          return HttpResponse.json(
            { message: '조회 실패', error: { code: 'CONFLICT' } },
            { status: 409 },
          );
        }
        return HttpResponse.json(detailResponse('재조회한 상세 내용'));
      }),
      http.patch('*/carpools/53/join-requests/90', () => {
        patchCount += 1;
        if (patchCount === 1) {
          return HttpResponse.json(
            { message: '서버 오류', error: { code: 'INTERNAL_SERVER_ERROR' } },
            { status: 500 },
          );
        }
        return HttpResponse.json({ message: '거절했습니다', data: { id: 90, status: 'REJECTED' } });
      }),
    );

    const { Wrapper } = createWrapper();
    render(<ChatListPage />, { wrapper: Wrapper });
    await openReceivedRequests(user);
    await detailStarted;

    expect(screen.getByText(receivedItem.content)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수락' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '거절' })).toBeDisabled();
    releaseDetail?.();
    await screen.findByRole('button', { name: '다시 불러오기' }, { timeout: 6000 });
    expect(screen.queryByRole('button', { name: '수락' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '거절' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));
    expect(await screen.findByText('재조회한 상세 내용')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: '수락' })).toBeEnabled());
    await user.click(await screen.findByRole('button', { name: '수락' }));
    await screen.findByRole('button', { name: '다시 불러오기' }, { timeout: 6000 });
    await user.click(screen.getByRole('button', { name: '닫기' }));
    await openReceivedRequests(user);
    await screen.findByRole('button', { name: '다시 불러오기' }, { timeout: 6000 });
    expect(screen.queryByRole('button', { name: '수락' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '거절' })).not.toBeInTheDocument();
    expect(patchCount).toBe(1);
    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '수락' })).toBeEnabled());
    expect(patchCount).toBe(1);
    await user.click(screen.getByRole('button', { name: '거절' }));
    await waitFor(() => expect(patchCount).toBe(2));
  });

  it.each([
    [403, 'HOST_ONLY', '요청을 처리할 권한이 없어요.', false],
    [404, 'CARPOOL_REQUEST_NOT_FOUND', '요청을 찾을 수 없어 목록을 새로 확인했어요.', false],
    [409, 'CAPACITY_FULL', '모집 인원이 가득 차서 수락할 수 없어요.', true],
    [409, 'CARPOOL_CLOSED', '마감된 카풀이라 요청을 처리할 수 없어요.', false],
    [409, 'REQUEST_ALREADY_HANDLED', '이미 처리된 요청이에요.', false],
  ])('%i %s 응답을 모달 상태에 반영한다', async (status, code, message, remainsOpen) => {
    const user = userEvent.setup();
    let rejectEnabledAfterCapacityFull = false;
    let acceptEnabledAfterReopen = false;
    const { Wrapper } = createWrapper();
    server.use(
      http.patch('*/carpools/53/join-requests/90', async ({ request }) => {
        const { status: action } = (await request.json()) as { status: string };
        if (code === 'CAPACITY_FULL' && action === 'REJECTED') {
          return HttpResponse.json({ message: '거절했습니다', data: { id: 90, status: action } });
        }
        return HttpResponse.json(
          { message: '요청을 처리할 수 없습니다', error: { code } },
          { status },
        );
      }),
    );

    render(<ChatListPage />, { wrapper: Wrapper });
    await openReceivedRequests(user);
    await user.click(await screen.findByRole('button', { name: '수락' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '카풀 요청 확인' }) !== null).toBe(remainsOpen),
    );
    expect(screen.queryByRole('button', { name: '거절' }) !== null).toBe(remainsOpen);
    expect(Boolean(screen.queryByRole('button', { name: '수락' })?.hasAttribute('disabled'))).toBe(
      code === 'CAPACITY_FULL',
    );
    if (code === 'CAPACITY_FULL') {
      rejectEnabledAfterCapacityFull = !screen
        .getByRole('button', { name: '거절' })
        .hasAttribute('disabled');
      await user.click(screen.getByRole('button', { name: '닫기' }));
      await openReceivedRequests(user);
      await waitFor(() => {
        acceptEnabledAfterReopen = !screen
          .getByRole('button', { name: '수락' })
          .hasAttribute('disabled');
        if (!acceptEnabledAfterReopen) {
          throw new Error('상세 재조회 후 수락을 다시 시도할 수 있어야 합니다.');
        }
      });
      await user.click(screen.getByRole('button', { name: '닫기' }));
    }
    expect(rejectEnabledAfterCapacityFull).toBe(code === 'CAPACITY_FULL');
    expect(acceptEnabledAfterReopen).toBe(code === 'CAPACITY_FULL');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '카풀 요청 확인' }) !== null).toBe(false),
    );
  });
});
