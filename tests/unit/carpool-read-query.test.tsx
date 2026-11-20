import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import {
  isCancelledError,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { carpoolQueries } from '@/shared/api/carpool';
import { carpoolDetailQueries } from '@/features/carpool-detail';
import { ApiError } from '@/shared/api/client';
import { server } from '@/shared/api/mocks/server';

const viewport = { sw_lat: 37.55, sw_lng: 126.96, ne_lat: 37.57, ne_lng: 126.99 };
const conditions = { ...viewport, lat: 37.5547, lng: 126.9707 };
const clients: QueryClient[] = [];
function client() {
  const queryClient = new QueryClient();
  clients.push(queryClient);
  return queryClient;
}
function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
const pinsResponse = { message: '조회', data: { items: [], limit: 500, limit_exceeded: false } };
afterEach(() => {
  cleanup();
  clients.forEach((queryClient) => queryClient.clear());
  clients.length = 0;
});

describe('카풀 조회 query factory', () => {
  it('카풀 상세 key는 viewerId로 나뉘고 명세된 최신성 정책을 사용한다', () => {
    const guest = carpoolDetailQueries.detail({
      carpoolId: 51,
      viewerId: null,
      isAuthenticated: false,
      authReady: true,
      enabled: true,
    });
    const viewer = carpoolDetailQueries.detail({
      carpoolId: 51,
      viewerId: 7,
      isAuthenticated: true,
      authReady: true,
      enabled: true,
    });

    expect(guest.queryKey).toEqual(['carpools', 'detail', 51, { viewerId: null }]);
    expect(viewer.queryKey).toEqual(['carpools', 'detail', 51, { viewerId: 7 }]);
    expect(viewer).toMatchObject({
      staleTime: 0,
      gcTime: 300_000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true,
      refetchInterval: false,
      retryDelay: 1_000,
      enabled: true,
    });
    expect(viewer.placeholderData).toBeUndefined();
  });

  it.each([
    { carpoolId: 51, viewerId: null, isAuthenticated: false, authReady: false, enabled: true },
    { carpoolId: null, viewerId: null, isAuthenticated: false, authReady: true, enabled: true },
    { carpoolId: 51, viewerId: null, isAuthenticated: true, authReady: true, enabled: true },
    { carpoolId: 51, viewerId: 7, isAuthenticated: true, authReady: true, enabled: false },
  ])('인증 초기화·선택·계정 확인이 끝나지 않으면 상세 조회를 막는다: %j', async (params) => {
    let requestCount = 0;
    server.use(
      http.get('*/carpools/:carpoolId', () => {
        requestCount++;
        return HttpResponse.json({ message: '조회', data: {} });
      }),
    );
    const queryClient = client();
    const options = carpoolDetailQueries.detail(params);
    const { result } = renderHook(() => useQuery(options), { wrapper: wrapper(queryClient) });
    await act(async () => {});

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestCount).toBe(0);
  });

  it('선택한 카풀의 상세를 조회하고 같은 사용자 key의 응답에 보관한다', async () => {
    const queryClient = client();
    const options = carpoolDetailQueries.detail({
      carpoolId: 51,
      viewerId: null,
      isAuthenticated: false,
      authReady: true,
      enabled: true,
    });
    const response = await queryClient.fetchQuery(options);

    expect(response.data.id).toBe(51);
    expect(queryClient.getQueryData(options.queryKey)).toEqual(response);
  });

  it('지도 영역이 없으면 두 조회를 실행하지 않는다', async () => {
    let count = 0;
    server.use(
      http.get('*/carpool-pins', () => {
        count++;
        return HttpResponse.json(pinsResponse);
      }),
      http.get('*/carpools', () => {
        count++;
        return HttpResponse.json({ message: '조회', data: { items: [], next_cursor: null } });
      }),
    );
    const { result } = renderHook(
      () => ({
        pins: useQuery(carpoolQueries.pins(null)),
        nearby: useInfiniteQuery(carpoolQueries.nearby(null)),
      }),
      { wrapper: wrapper(client()) },
    );
    await act(async () => {});
    expect(result.current.pins.fetchStatus).toBe('idle');
    expect(result.current.nearby.fetchStatus).toBe('idle');
    expect(count).toBe(0);
  });
  it('핀 key에는 영역만, 목록 key에는 위치와 영역만 포함한다', () => {
    expect(carpoolQueries.pins(viewport).queryKey).toEqual(['carpools', 'pins', viewport]);
    expect(
      carpoolQueries.nearby({ ...conditions, cursor: 'extra' } as typeof conditions).queryKey,
    ).toEqual(['carpools', 'nearby', conditions]);
    for (const field of Object.keys(conditions) as (keyof typeof conditions)[]) {
      expect(
        carpoolQueries.nearby({ ...conditions, [field]: conditions[field] + 0.001 }).queryKey,
      ).not.toEqual(carpoolQueries.nearby(conditions).queryKey);
    }
  });
  it('factory 생성 뒤 원래 입력이 바뀌어도 key와 요청 좌표가 달라지지 않는다', async () => {
    const input = { ...viewport };
    const options = carpoolQueries.pins(input);
    input.sw_lat = 0;
    server.use(
      http.get('*/carpool-pins', ({ request }) => {
        expect(new URL(request.url).searchParams.get('sw_lat')).toBe('37.55');
        return HttpResponse.json(pinsResponse);
      }),
    );
    await client().fetchQuery(options);
    expect(options.queryKey[2]).toEqual(viewport);
  });
  it('명세의 캐시·재조회 정책을 전역 기본값보다 우선 적용한다', () => {
    const pins = carpoolQueries.pins(viewport);
    const nearby = carpoolQueries.nearby(conditions);
    for (const options of [pins, nearby]) {
      expect(options).toMatchObject({
        staleTime: 30_000,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchInterval: false,
        retryDelay: 1_000,
      });
      expect(options.placeholderData).toBeUndefined();
    }
    expect(pins.gcTime).toBe(120_000);
    expect(nearby.gcTime).toBe(300_000);
  });
  it('fresh 캐시를 재사용하고 서로 다른 영역 응답을 분리한다', async () => {
    let count = 0;
    server.use(
      http.get('*/carpool-pins', ({ request }) => {
        count++;
        const id = Number(new URL(request.url).searchParams.get('sw_lat'));
        return HttpResponse.json({
          ...pinsResponse,
          data: { ...pinsResponse.data, items: [{ id, lat: id, lng: 0 }] },
        });
      }),
    );
    const queryClient = client();
    const first = carpoolQueries.pins(viewport);
    const second = carpoolQueries.pins({ ...viewport, sw_lat: 37.56 });
    await queryClient.fetchQuery(first);
    await queryClient.fetchQuery(first);
    await queryClient.fetchQuery(second);
    expect(count).toBe(2);
    expect(queryClient.getQueryData(first.queryKey)?.data.items[0].id).toBe(37.55);
    expect(queryClient.getQueryData(second.queryKey)?.data.items[0].id).toBe(37.56);
  });
  it('커서는 pageParam으로 전달하고 마지막 페이지에서 추가 조회를 종료한다', async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get('*/carpools', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        cursors.push(cursor);
        return HttpResponse.json({
          message: '조회',
          data: { items: [], next_cursor: cursor === null ? 'next +/&' : null },
        });
      }),
    );
    const { result } = renderHook(() => useInfiniteQuery(carpoolQueries.nearby(conditions)), {
      wrapper: wrapper(client()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => {
      const next = await result.current.fetchNextPage();
      expect(next.error).toBeNull();
    });
    expect(cursors).toEqual([null, 'next +/&']);
    await waitFor(() => expect(result.current.data?.pageParams).toEqual([undefined, 'next +/&']));
    expect(result.current.hasNextPage).toBe(false);
  });
  it('조회 조건 변경 시 이전 페이지와 placeholder를 새 목록에 연결하지 않는다', async () => {
    const { result, rerender } = renderHook(
      ({ lat }) => useInfiniteQuery(carpoolQueries.nearby({ ...conditions, lat })),
      { initialProps: { lat: conditions.lat }, wrapper: wrapper(client()) },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].data.items.map((item) => item.id)).toEqual([51, 77]);
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => {
      const next = await result.current.fetchNextPage();
      expect(next.error).toBeNull();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    rerender({ lat: 37.5585 });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0].data.items[0].id).toBe(77);
  });
  it.each([400, 401, 403, 404, 409, 422])('HTTP %s는 자동 재시도하지 않는다', async (status) => {
    let count = 0;
    server.use(
      http.get('*/carpool-pins', () => {
        count++;
        return HttpResponse.json({ error: { code: 'READ_ERROR' } }, { status });
      }),
    );
    await expect(client().fetchQuery(carpoolQueries.pins(viewport))).rejects.toMatchObject({
      status,
    });
    expect(count).toBe(1);
  });
  it.each(['server', 'network'])('%s 오류는 실제 요청을 한 번만 재시도한다', async (kind) => {
    let count = 0;
    server.use(
      http.get('*/carpool-pins', () => {
        count++;
        return kind === 'server'
          ? HttpResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR' } }, { status: 500 })
          : HttpResponse.error();
      }),
    );
    await expect(client().fetchQuery(carpoolQueries.pins(viewport))).rejects.toBeInstanceOf(
      kind === 'server' ? ApiError : TypeError,
    );
    expect(count).toBe(2);
  });
  it('동일 영역 재조회 실패 후 기존 캐시 데이터를 유지한다', async () => {
    const queryClient = client(),
      options = carpoolQueries.pins(viewport);
    const original = await queryClient.fetchQuery(options);
    server.use(
      http.get('*/carpool-pins', () =>
        HttpResponse.json({ error: { code: 'READ_ERROR' } }, { status: 400 }),
      ),
    );
    await queryClient.invalidateQueries({ queryKey: options.queryKey });
    await expect(queryClient.fetchQuery(options)).rejects.toMatchObject({ status: 400 });
    expect(queryClient.getQueryData(options.queryKey)).toEqual(original);
  });
  it('query 취소가 HTTP 요청까지 전달되고 오류로 재시도하지 않는다', async () => {
    let started!: () => void;
    const requestStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    let signal: AbortSignal | undefined,
      count = 0;
    server.use(
      http.get('*/carpool-pins', async ({ request }) => {
        signal = request.signal;
        count++;
        started();
        await delay(100);
        return HttpResponse.json(pinsResponse);
      }),
    );
    const queryClient = client(),
      options = carpoolQueries.pins(viewport);
    const outcome = queryClient.fetchQuery(options).catch((error: unknown) => error);
    await requestStarted;
    await queryClient.cancelQueries({ queryKey: options.queryKey });
    expect(isCancelledError(await outcome)).toBe(true);
    expect(signal?.aborted).toBe(true);
    expect(count).toBe(1);
    expect(queryClient.getQueryState(options.queryKey)?.error).toBeNull();
  });
});
