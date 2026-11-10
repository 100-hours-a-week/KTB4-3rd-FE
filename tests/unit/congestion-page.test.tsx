import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CongestionPage } from '@/_pages/congestion';
import { server } from '@/shared/api/mocks/server';
import type { MapProps, MapRef, MyLocationButtonProps } from '@/shared/ui/map';

const mocks = vi.hoisted(() => ({
  navigation: {
    push: vi.fn<(path: string) => void>(),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/congestion',
  useRouter: () => mocks.navigation,
}));

vi.mock('@/features/user-profile', () => ({
  useCurrentUserQuery: () => ({ data: undefined }),
}));

vi.mock('@/features/header-user', () => ({
  HeaderUser: () => null,
}));

vi.mock('@/shared/ui/map', async () => {
  const { createElement, forwardRef, useEffect, useImperativeHandle } = await import('react');

  const MockMap = forwardRef<MapRef, MapProps>(
    ({ children, markers = [], onMarkerClick, onViewportChange }, ref) => {
      useImperativeHandle(ref, () => ({
        requestCurrentLocation: vi.fn<() => void>(),
        requestLocationPermission: vi.fn<() => void>(),
      }));

      useEffect(() => {
        onViewportChange?.({
          northEast: { lat: 37.6, lng: 127.2 },
          northWest: { lat: 37.6, lng: 127 },
          southEast: { lat: 37.3, lng: 127.2 },
          southWest: { lat: 37.3, lng: 127 },
        });
      }, [onViewportChange]);

      return createElement(
        'div',
        { 'data-testid': 'congestion-map-surface' },
        ...(markers ?? []).map((marker) =>
          createElement(
            'button',
            {
              'aria-label': marker.title,
              'data-marker-image': marker.image?.src,
              'data-testid': `congestion-marker-${marker.id}`,
              key: marker.id,
              onClick: () => onMarkerClick?.(marker),
              type: 'button',
            },
            marker.title,
          ),
        ),
        children,
      );
    },
  );

  return {
    Map: MockMap,
    MyLocationButton: ({ onClick }: MyLocationButtonProps) =>
      createElement('button', { 'aria-label': '현재 위치로 이동', onClick, type: 'button' }),
  };
});

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderCongestionPage(queryClient = createQueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <CongestionPage />
    </QueryClientProvider>,
  );
}

function decodeMarkerImage(marker: HTMLElement) {
  const source = marker.getAttribute('data-marker-image') ?? '';
  return decodeURIComponent(source.split(',')[1] ?? '');
}

afterEach(() => {
  cleanup();
  mocks.navigation.push.mockReset();
  server.resetHandlers();
});

describe('CongestionPage', () => {
  it('지도 viewport로 혼잡도 핀 목록을 조회해 marker를 렌더링한다', async () => {
    const requestedViewport: Record<string, string | null> = {};
    server.use(
      http.get('*/congestion/spots', ({ request }) => {
        const params = new URL(request.url).searchParams;
        requestedViewport.sw_lat = params.get('sw_lat');
        requestedViewport.sw_lng = params.get('sw_lng');
        requestedViewport.ne_lat = params.get('ne_lat');
        requestedViewport.ne_lng = params.get('ne_lng');

        return new Response(
          JSON.stringify({
            message: '조회에 성공했습니다',
            data: {
              items: [
                {
                  id: 5,
                  type: 'STATION',
                  name: '판교역',
                  lat: 37.3947,
                  lng: 127.1112,
                  status: 'CROWDED',
                  window_end: '2026-10-27T08:10:00',
                },
                {
                  id: 12,
                  type: 'STATION',
                  name: '정자역',
                  lat: 37.3667,
                  lng: 127.108,
                  status: 'CONGESTED',
                  window_end: '2026-10-27T08:10:00',
                },
              ],
              limit: 500,
              limit_exceeded: false,
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      }),
    );
    renderCongestionPage();

    expect(await screen.findByTestId('congestion-marker-5')).toBeInTheDocument();
    expect(screen.getByTestId('congestion-marker-12')).toBeInTheDocument();
    expect(requestedViewport).toEqual({
      sw_lat: '37.3',
      sw_lng: '127',
      ne_lat: '37.6',
      ne_lng: '127.2',
    });
  });

  it('핀을 선택하면 상세 API의 reason을 확장 핀 문구에 반영한다', async () => {
    renderCongestionPage();

    const marker = await screen.findByTestId('congestion-marker-5');
    await userEvent.click(marker);

    await waitFor(() => {
      const markerImage = decodeMarkerImage(screen.getByTestId('congestion-marker-5'));

      expect(markerImage).toContain('퇴근 시간대 대기');
      expect(markerImage).toContain('인원 증가');
    });
  });
});
