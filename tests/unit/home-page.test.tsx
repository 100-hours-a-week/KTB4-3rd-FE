import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from '@/_pages/home';
import type { MapCoordinate } from '@/shared/types/common';
import type { MapMarker, MapViewport } from '@/shared/ui/map';

type MockMapProps = {
  children?: ReactNode;
  markers?: readonly MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onUserLocationChange?: (coordinate: MapCoordinate) => void;
  onViewportChange?: (viewport: MapViewport) => void;
};

vi.mock('@/shared/ui/map', () => ({
  Map: ({
    children,
    markers = [],
    onMarkerClick,
    onUserLocationChange,
    onViewportChange,
  }: MockMapProps) => {
    useEffect(() => {
      onUserLocationChange?.({ lat: 37.3945, lng: 127.1112 });
      onViewportChange?.({
        northEast: { lat: 37.6, lng: 127.2 },
        northWest: { lat: 37.6, lng: 127 },
        southEast: { lat: 37.3, lng: 127.2 },
        southWest: { lat: 37.3, lng: 127 },
      });
    }, [onUserLocationChange, onViewportChange]);

    return (
      <div data-testid="map">
        {markers.map((marker) => (
          <button
            aria-label={marker.title}
            data-testid={`map-marker-${marker.id}`}
            key={marker.id}
            onClick={() => onMarkerClick?.(marker)}
            type="button"
          />
        ))}
        {children}
      </div>
    );
  },
  MyLocationButton: ({ className }: { className?: string }) => (
    <button aria-label="현재 위치로 이동" className={className} type="button" />
  ),
}));

afterEach(cleanup);

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('지도, 글쓰기 버튼, 바텀시트, 하단 네비게이션을 조합한다', () => {
    renderHomePage();

    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '현재 위치' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '글쓰기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' })).toHaveClass(
      'z-20',
    );
    expect(screen.getByRole('heading', { name: '근처 핀 게시글' })).toBeInTheDocument();
    const bottomNav = screen.getByRole('navigation', { hidden: true, name: '주요 메뉴' });

    expect(bottomNav).toBeInTheDocument();
    expect(bottomNav).toHaveClass('!fixed', '!max-w-[393px]', '!-translate-x-1/2');
  });

  it('지도 핀 API 응답을 지도 마커로 렌더링한다', async () => {
    renderHomePage();

    expect(await screen.findByTestId('map-marker-COMPANION-10')).toBeInTheDocument();
    expect(screen.getByTestId('map-marker-COMMUNITY-88')).toBeInTheDocument();
  });

  it('주변 게시글 API 응답을 바텀시트에 렌더링한다', async () => {
    renderHomePage();

    expect(await screen.findByRole('button', { name: /판교역 → 강남역/ })).toBeInTheDocument();
    expect(screen.getByText('판교역 근처 카페 추천')).toBeInTheDocument();
    expect(screen.getByText(/택시 · 320m/)).toBeInTheDocument();
  });

  it('API로 받은 게시글을 선택하면 상세 API 응답으로 바텀모달을 연다', async () => {
    const user = userEvent.setup();

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 → 강남역/ }));

    const modal = await screen.findByRole('dialog', { name: '바텀모달' });

    expect(modal).toBeInTheDocument();
    expect(modal).toHaveStyle({
      bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 8px)',
    });
    expect(await screen.findByText('택시 같이 타실 분 구해요')).toBeInTheDocument();
    expect(screen.getByText('판교역')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '근처 핀 게시글' })).not.toBeInTheDocument();
  });
});
