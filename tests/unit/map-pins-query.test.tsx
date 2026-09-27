import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useMapPinsQuery } from '@/_pages/home/api/map-pins';
import { server } from '@/shared/api/mocks/server';
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

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

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
});
