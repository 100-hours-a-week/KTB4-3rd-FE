import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useNearbyPostsQuery } from '@/_pages/home/api/nearby-posts';
import { server } from '@/shared/api/mocks/server';
import type { MapViewport } from '@/shared/ui/map';

const SEOUL_STATION_COORDINATE = {
  lat: 37.5547,
  lng: 126.9707,
};

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

describe('useNearbyPostsQuery', () => {
  it('위치 권한이 없으면 서울역 좌표를 기준으로 주변 게시글을 조회한다', async () => {
    const requestCoordinates =
      vi.fn<(coordinates: { lat: string | null; lng: string | null }) => void>();

    server.use(
      http.get('*/nearby-posts', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        requestCoordinates({
          lat: searchParams.get('lat'),
          lng: searchParams.get('lng'),
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { items: [], next_cursor: null },
        });
      }),
    );

    const { result } = renderHook(() => useNearbyPostsQuery(null, viewport), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestCoordinates).toHaveBeenCalledWith({
      lat: String(SEOUL_STATION_COORDINATE.lat),
      lng: String(SEOUL_STATION_COORDINATE.lng),
    });
  });
});
