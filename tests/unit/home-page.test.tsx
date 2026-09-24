import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef, useEffect, useImperativeHandle, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryProvider } from '@/_app/providers';
import { HomePage } from '@/_pages/home';
import type { MapCoordinate } from '@/shared/types/common';
import type { MapLocationError, MapMarker, MapRef, MapViewport } from '@/shared/ui/map';

const mockLocationError = vi.hoisted(() => ({
  code: 'permission-denied' as MapLocationError['code'],
  message: '위치 권한이 없어 현재 위치를 가져올 수 없습니다.',
}));
const mockRequestLocationPermission = vi.hoisted(() => vi.fn<() => void>());

type MockMapProps = {
  children?: ReactNode;
  markers?: readonly MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onUserLocationChange?: (coordinate: MapCoordinate) => void;
  onUserLocationError?: (error: MapLocationError) => void;
  onViewportChange?: (viewport: MapViewport) => void;
};

vi.mock('@/shared/ui/map', () => ({
  Map: forwardRef<MapRef, MockMapProps>(
    (
      {
        children,
        markers = [],
        onMarkerClick,
        onUserLocationChange,
        onUserLocationError,
        onViewportChange,
      },
      ref,
    ) => {
      useImperativeHandle(
        ref,
        () => ({
          requestCurrentLocation: () => onUserLocationError?.(mockLocationError),
          requestLocationPermission: () => {
            mockRequestLocationPermission();
            onUserLocationError?.(mockLocationError);
          },
        }),
        [onUserLocationError],
      );

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
              data-selected={marker.isSelected}
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
  ),
  MyLocationButton: ({ className, onClick }: { className?: string; onClick?: () => void }) => (
    <button aria-label="현재 위치로 이동" className={className} onClick={onClick} type="button" />
  ),
}));

function renderHomePage() {
  return render(
    <QueryProvider>
      <HomePage />
    </QueryProvider>,
  );
}

const navigation = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  usePathname: () => '/',
}));

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
  mockLocationError.code = 'permission-denied';
  mockLocationError.message = '위치 권한이 없어 현재 위치를 가져올 수 없습니다.';
  mockRequestLocationPermission.mockReset();
});

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
    expect(screen.getByRole('navigation', { hidden: true, name: '주요 메뉴' })).toBeInTheDocument();
  });

  it('글쓰기 FAB을 누르면 글 작성 위치 등록 화면으로 이동한다', () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('button', { hidden: true, name: '글쓰기' }));

    expect(navigation.push).toHaveBeenCalledWith('/post/create/location');
  });

  it('지도 핀 목록 조회 응답을 지도 마커로 렌더링한다', async () => {
    renderHomePage();

    expect(await screen.findByTestId('map-marker-COMPANION-10')).toBeInTheDocument();
    expect(screen.getByTestId('map-marker-COMMUNITY-88')).toBeInTheDocument();
  });

  it('지도 핀을 클릭하면 해당 핀만 선택 상태로 표시된다', async () => {
    renderHomePage();

    const communityMarker = await screen.findByTestId('map-marker-COMMUNITY-88');
    fireEvent.click(communityMarker);

    expect(communityMarker).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('map-marker-COMPANION-10')).toHaveAttribute('data-selected', 'false');
  });

  it('커뮤니티 핀을 클릭하면 커뮤니티 상세 데이터가 바텀모달에 표시된다', async () => {
    renderHomePage();

    fireEvent.click(await screen.findByTestId('map-marker-COMMUNITY-88'));

    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '판교역 근처 카페 추천' })).toBeInTheDocument();
    expect(screen.getByText('조용히 작업하기 좋은 카페가 있을까요?')).toBeInTheDocument();
    expect(screen.getByText('루디')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '근처 핀 게시글' })).not.toBeInTheDocument();
  });

  it('동행 모집 핀을 클릭하면 동행 모집 상세 데이터가 바텀모달에 표시된다', async () => {
    renderHomePage();

    fireEvent.click(await screen.findByTestId('map-marker-COMPANION-10'));

    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '판교역 → 강남역' })).toBeInTheDocument();
    expect(screen.getByText('판교역')).toBeInTheDocument();
    expect(screen.getByText('강남역')).toBeInTheDocument();
    expect(screen.getByText('2 / 4명')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '근처 핀 게시글' })).not.toBeInTheDocument();
  });

  it('바텀모달을 닫으면 선택한 게시글 상세가 사라진다', async () => {
    renderHomePage();

    fireEvent.click(await screen.findByTestId('map-marker-COMMUNITY-88'));
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '판교역 근처 카페 추천' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '근처 핀 게시글' })).toBeInTheDocument();
  });

  it('위치 권한이 없으면 허용하기와 닫기 버튼이 있는 dialog를 표시한다', () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' }));

    const locationDialog = screen.getByRole('dialog', { name: '현재 위치를 확인할 수 없어요' });

    expect(locationDialog).toBeInTheDocument();
    expect(locationDialog).toHaveClass('!w-[calc(100%-40px)]', '!max-w-[353px]');
    expect(screen.getByRole('button', { name: '허용하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '재시도하기' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '닫기' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(
      screen.queryByRole('dialog', { name: '현재 위치를 확인할 수 없어요' }),
    ).not.toBeInTheDocument();
  });

  it('허용하기를 누르면 브라우저 위치 권한 요청을 호출한다', () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' }));
    fireEvent.click(screen.getByRole('button', { name: '허용하기' }));

    expect(mockRequestLocationPermission).toHaveBeenCalledOnce();
  });

  it('권한 외 오류면 재시도하기와 닫기 버튼이 있는 dialog를 표시한다', () => {
    mockLocationError.code = 'timeout';
    mockLocationError.message = '현재 위치 확인 시간이 초과되었습니다.';

    renderHomePage();

    fireEvent.click(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' }));

    expect(screen.getByRole('button', { name: '재시도하기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '허용하기' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '닫기' })).toHaveLength(1);
  });
});
