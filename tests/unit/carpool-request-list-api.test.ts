import { http, HttpResponse } from 'msw';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  carpoolRequestListQueries,
  getCarpoolRequestList,
} from '@/_pages/chat-list/api/carpool-requests';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

beforeEach(() => {
  const authStore = useAuthStore.getState();
  authStore.setAccessToken('mock-access-token');
  authStore.setVerifiedViewerId('mock-access-token', 7);
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('carpool request list API', () => {
  it('direction을 보내고 첫 페이지 요청에서 cursor를 생략한다', async () => {
    const requestedQuery =
      vi.fn<(query: { direction: string | null; cursor: string | null }) => void>();

    server.use(
      http.get('*/users/me/carpool-requests', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        requestedQuery({
          direction: searchParams.get('direction'),
          cursor: searchParams.get('cursor'),
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'SENT', items: [], next_cursor: null },
        });
      }),
    );

    await getCarpoolRequestList({ viewerId: 7, direction: 'SENT' });

    expect(requestedQuery).toHaveBeenCalledWith({ direction: 'SENT', cursor: null });
  });

  it('후속 페이지의 cursor를 전달한다', async () => {
    const requestedQuery =
      vi.fn<(query: { direction: string | null; cursor: string | null }) => void>();

    server.use(
      http.get('*/users/me/carpool-requests', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        requestedQuery({
          direction: searchParams.get('direction'),
          cursor: searchParams.get('cursor'),
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'RECEIVED', items: [], next_cursor: null },
        });
      }),
    );

    await getCarpoolRequestList({ viewerId: 7, direction: 'RECEIVED', cursor: 'next-page' });

    expect(requestedQuery).toHaveBeenCalledWith({ direction: 'RECEIVED', cursor: 'next-page' });
  });

  it('요청 방향이 다른 응답은 사용하지 않는다', async () => {
    server.use(
      http.get('*/users/me/carpool-requests', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'RECEIVED', items: [], next_cursor: null },
        }),
      ),
    );

    await expect(getCarpoolRequestList({ viewerId: 7, direction: 'SENT' })).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_RESPONSE_DIRECTION',
    });
  });

  it('viewerId와 방향에 따라 목록 캐시 key를 분리한다', () => {
    expect(carpoolRequestListQueries.list(7, 'SENT').queryKey).not.toEqual(
      carpoolRequestListQueries.list(8, 'SENT').queryKey,
    );
    expect(carpoolRequestListQueries.list(7, 'SENT').queryKey).not.toEqual(
      carpoolRequestListQueries.list(7, 'RECEIVED').queryKey,
    );
  });

  it('현재 로그인 사용자와 viewerId가 일치하면 요청 목록을 조회한다', async () => {
    await expect(getCarpoolRequestList({ viewerId: 7, direction: 'SENT' })).resolves.toMatchObject({
      data: { direction: 'SENT' },
    });
  });

  it('현재 로그인 사용자와 viewerId가 다르면 조회를 거부한다', async () => {
    await expect(getCarpoolRequestList({ viewerId: 8, direction: 'SENT' })).rejects.toMatchObject({
      name: 'AuthViewerMismatchError',
    });
  });

  it('요청 중 계정이 바뀌면 이전 계정 응답을 반환하지 않는다', async () => {
    let releaseResponse: (() => void) | undefined;
    let markRequestStarted: (() => void) | undefined;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve;
    });

    server.use(
      http.get('*/users/me/carpool-requests', async () => {
        markRequestStarted?.();
        await responseGate;

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'SENT', items: [], next_cursor: null },
        });
      }),
    );

    const request = getCarpoolRequestList({ viewerId: 7, direction: 'SENT' });
    await requestStarted;
    useAuthStore.getState().setAccessToken('next-access-token');
    useAuthStore.getState().setVerifiedViewerId('next-access-token', 8);
    releaseResponse?.();

    await expect(request).rejects.toMatchObject({ name: 'AuthViewerMismatchError' });
  });

  it('query 취소 신호를 목록 fetch까지 전달한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const query = carpoolRequestListQueries.list(7, 'SENT');
    let requestSignal: AbortSignal | undefined;
    let releaseResponse: (() => void) | undefined;
    let markRequestStarted: (() => void) | undefined;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve;
    });

    server.use(
      http.get('*/users/me/carpool-requests', async ({ request }) => {
        requestSignal = request.signal;
        markRequestStarted?.();
        await responseGate;

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'SENT', items: [], next_cursor: null },
        });
      }),
    );

    const fetchResult = queryClient.fetchInfiniteQuery(query);
    const fetchResultHandled = fetchResult.catch(() => undefined);
    await requestStarted;
    await queryClient.cancelQueries({ queryKey: query.queryKey });

    expect(requestSignal?.aborted).toBe(true);

    releaseResponse?.();
    await fetchResultHandled;
  });
});
