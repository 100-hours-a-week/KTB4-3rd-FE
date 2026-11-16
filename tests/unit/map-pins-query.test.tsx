import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useMapPinsQuery } from '@/_pages/home/api/map-pins';
import { server } from '@/shared/api/mocks/server';
import type { MapPinsResponse } from '@/entities/map-pin';
import type { MapViewport } from '@/shared/ui/map';

const viewport: MapViewport = {
  northEast: { lat: 37.6, lng: 127.2 },
  northWest: { lat: 37.6, lng: 127 },
  southEast: { lat: 37.3, lng: 127.2 },
  southWest: { lat: 37.3, lng: 127 },
};

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

describe('useMapPinsQuery', () => {
  it('사용자 위치가 없어도 지도 영역이 있으면 핀을 조회한다', async () => {
    const requestedViewport =
      vi.fn<
        (request: {
          ne_lat: string | null;
          ne_lng: string | null;
          sw_lat: string | null;
          sw_lng: string | null;
        }) => void
      >();

    server.use(
      http.get('*/map-pins', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        requestedViewport({
          ne_lat: searchParams.get('ne_lat'),
          ne_lng: searchParams.get('ne_lng'),
          sw_lat: searchParams.get('sw_lat'),
          sw_lng: searchParams.get('sw_lng'),
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [{ type: 'COMMUNITY', id: 88, lat: 37.5123, lng: 127.041 }],
            limit: 500,
            limit_exceeded: false,
          },
        });
      }),
    );

    const { result } = renderHook(() => useMapPinsQuery(viewport), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(requestedViewport).toHaveBeenCalledWith({
      ne_lat: String(viewport.northEast.lat),
      ne_lng: String(viewport.northEast.lng),
      sw_lat: String(viewport.southWest.lat),
      sw_lng: String(viewport.southWest.lng),
    });
    expect(result.current.data?.data.items).toEqual([
      { type: 'COMMUNITY', id: 88, lat: 37.5123, lng: 127.041 },
    ]);
  });

  it('첫 조회 중에는 표시할 이전 응답이 없다', async () => {
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get('*/map-pins', async () => {
        await blocked;
        return mapPinsResponse([1]);
      }),
    );

    const { result } = renderHook(() => useMapPinsQuery(viewport), { wrapper: createWrapper() });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isShowingPreviousRange).toBe(false);
    expect(result.current.isFetching).toBe(true);

    release();
    await waitFor(() => expect(pinIds(result.current.data)).toEqual([1]));
  });

  it('새 범위 요청이 진행되는 동안 직전 범위 핀을 유지하고, 응답이 오면 교체한다', async () => {
    const gate = createGate();
    server.use(
      http.get('*/map-pins', async ({ request }) => {
        if (getSwLat(request) === '38') {
          await gate.wait;
          return mapPinsResponse([2]);
        }
        return mapPinsResponse([1]);
      }),
    );
    const { result, rerender } = renderMapPinsHook();

    await waitFor(() => expect(pinIds(result.current.data)).toEqual([1]));
    const renderedIds: number[][] = [];
    rerender({ currentViewport: viewportAt(38) });
    renderedIds.push(pinIds(result.current.data));

    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(pinIds(result.current.data)).toEqual([1]);
    expect(result.current.isShowingPreviousRange).toBe(true);

    gate.open();
    await waitFor(() => expect(pinIds(result.current.data)).toEqual([2]));
    expect(result.current.isShowingPreviousRange).toBe(false);
    expect(renderedIds).not.toContainEqual([]);
  });

  it('현재 위치 갱신으로 범위가 비어 있는 동안에도 직전 핀을 유지한다', async () => {
    server.use(http.get('*/map-pins', () => mapPinsResponse([1])));
    const { result, rerender } = renderMapPinsHook();

    await waitFor(() => expect(pinIds(result.current.data)).toEqual([1]));
    rerender({ currentViewport: null });

    expect(pinIds(result.current.data)).toEqual([1]);
    expect(result.current.isShowingPreviousRange).toBe(true);
    expect(result.current.isFetching).toBe(false);
  });

  it('새 범위 요청이 실패하면 직전 핀을 유지하고 오류를 알린다', async () => {
    server.use(
      http.get('*/map-pins', ({ request }) =>
        getSwLat(request) === '38'
          ? HttpResponse.json({ message: '서버 오류' }, { status: 500 })
          : mapPinsResponse([1]),
      ),
    );
    const { result, rerender } = renderMapPinsHook();

    await waitFor(() => expect(pinIds(result.current.data)).toEqual([1]));
    rerender({ currentViewport: viewportAt(38) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(pinIds(result.current.data)).toEqual([1]);
    expect(result.current.isShowingPreviousRange).toBe(true);
  });

  it('요청이 성공해 빈 응답이 오면 핀을 비우고, 다음 범위 요청 중에도 다른 범위의 핀을 되살리지 않는다', async () => {
    const gate = createGate();
    server.use(
      http.get('*/map-pins', async ({ request }) => {
        const swLat = getSwLat(request);
        if (swLat === '38') {
          return mapPinsResponse([]);
        }
        if (swLat === '39') {
          await gate.wait;
          return mapPinsResponse([3]);
        }
        return mapPinsResponse([1]);
      }),
    );
    const { result, rerender } = renderMapPinsHook();

    await waitFor(() => expect(pinIds(result.current.data)).toEqual([1]));
    rerender({ currentViewport: viewportAt(38) });
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(pinIds(result.current.data)).toEqual([]);
    expect(result.current.isShowingPreviousRange).toBe(false);

    rerender({ currentViewport: viewportAt(39) });
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(pinIds(result.current.data)).toEqual([]);
    expect(result.current.isShowingPreviousRange).toBe(true);

    gate.open();
    await waitFor(() => expect(pinIds(result.current.data)).toEqual([3]));
  });

  it('캐시된 범위에 돌아오면 그 범위의 캐시를 즉시 보여 주고 백그라운드에서 재검증한다', async () => {
    const gate = createGate();
    let requests = 0;
    server.use(
      http.get('*/map-pins', async () => {
        requests += 1;
        const requestNumber = requests;
        if (requestNumber === 2) {
          await gate.wait;
        }
        return mapPinsResponse([requestNumber]);
      }),
    );
    const { result, rerender } = renderMapPinsHook();

    await waitFor(() => expect(pinIds(result.current.data)).toEqual([1]));
    rerender({ currentViewport: null });
    rerender({ currentViewport: viewport });
    await waitFor(() => expect(requests).toBe(2));
    expect(pinIds(result.current.data)).toEqual([1]);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.isShowingPreviousRange).toBe(false);

    gate.open();
    await waitFor(() => expect(pinIds(result.current.data)).toEqual([2]));
  });

  it('같은 범위의 재조회가 실패해도 기존 핀과 오류를 유지한다', async () => {
    let requests = 0;
    server.use(
      http.get('*/map-pins', () => {
        requests += 1;
        return requests > 1
          ? HttpResponse.json({ message: '서버 오류' }, { status: 500 })
          : mapPinsResponse([1]);
      }),
    );
    const { result } = renderHook(() => useMapPinsQuery(viewport), { wrapper: createWrapper() });

    await waitFor(() => expect(pinIds(result.current.data)).toEqual([1]));
    await result.current.refetch();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(pinIds(result.current.data)).toEqual([1]);
    expect(result.current.isShowingPreviousRange).toBe(false);
  });
});

function viewportAt(swLat: number): MapViewport {
  return { ...viewport, southWest: { ...viewport.southWest, lat: swLat } };
}

function getSwLat(request: Request) {
  return new URL(request.url).searchParams.get('sw_lat');
}

function mapPinsResponse(ids: number[]) {
  return HttpResponse.json({
    message: '조회에 성공했습니다',
    data: {
      items: ids.map((id) => ({ type: 'COMMUNITY', id, lat: 37.5, lng: 127 })),
      limit: 500,
      limit_exceeded: false,
    },
  });
}

function pinIds(data: MapPinsResponse | undefined) {
  return data?.data.items.map((item) => item.id) ?? [];
}

function createGate() {
  let open!: () => void;
  const wait = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { open, wait };
}

function renderMapPinsHook() {
  return renderHook(
    ({ currentViewport }: { currentViewport: MapViewport | null }) =>
      useMapPinsQuery(currentViewport),
    {
      initialProps: { currentViewport: viewport as MapViewport | null },
      wrapper: createWrapper(),
    },
  );
}
