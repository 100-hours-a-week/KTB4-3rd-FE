import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { PostLocationPage } from '@/_pages/post-location';
import type { UseKakaoPlaceSearchResult } from '@/features/location-search';
import type {
  ReverseGeocodedLocation,
  reverseGeocodeLocation as ReverseGeocodeLocation,
} from '@/features/post-location';
import type { MapCoordinate } from '@/shared/types/common';

const { reverseGeocodeLocation, useKakaoPlaceSearch } = vi.hoisted(() => ({
  reverseGeocodeLocation: vi.fn<typeof ReverseGeocodeLocation>(),
  useKakaoPlaceSearch: vi.fn<() => UseKakaoPlaceSearchResult>(),
}));

vi.mock('@/shared/ui/map', () => ({
  Map: ({
    className,
    center,
    children,
    onCenterChange,
    selectionMarker,
  }: {
    children?: ReactNode;
    className?: string;
    center?: MapCoordinate;
    onCenterChange?: (center: MapCoordinate) => void;
    selectionMarker?: { src: string };
  }) => (
    <div
      className={className}
      data-center-lat={center?.lat}
      data-center-lng={center?.lng}
      data-testid="map"
      role="application"
    >
      <button type="button" onClick={() => onCenterChange?.({ lat: 37.3945, lng: 127.1112 })}>
        테스트 지도 중앙 이동
      </button>
      <button type="button" onClick={() => onCenterChange?.({ lat: 37.402, lng: 127.108 })}>
        테스트 지도 다른 위치 이동
      </button>
      {selectionMarker ? (
        <span
          data-selection-marker-src={selectionMarker.src}
          data-testid="selection-marker-preview"
        />
      ) : null}
      {children}
    </div>
  ),
  MyLocationButton: ({ className, onClick }: { className?: string; onClick?: () => void }) => (
    <button
      aria-label="현재 위치로 이동"
      className={className}
      data-testid="my-location-button"
      type="button"
      onClick={onClick}
    />
  ),
}));

vi.mock('@/features/post-location', async () => {
  const actual = await vi.importActual('@/features/post-location');

  return { ...actual, reverseGeocodeLocation };
});

vi.mock('@/features/location-search', async () => {
  const actual = await vi.importActual('@/features/location-search');

  return { ...actual, useKakaoPlaceSearch };
});

beforeEach(() => {
  reverseGeocodeLocation.mockResolvedValue({ placeName: null, roadAddress: null });
  useKakaoPlaceSearch.mockReturnValue({ error: null, results: [], status: 'idle' });
});

afterEach(() => {
  cleanup();
  reverseGeocodeLocation.mockReset();
});

describe('PostLocationPage', () => {
  it('장소 선택 화면의 지도, 검색 헤더, 하단 푸터를 구성한다', () => {
    render(<PostLocationPage />);

    expect(screen.getByRole('main', { name: '글 등록 장소 선택' })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('search')).toHaveClass('z-50');
    expect(screen.getByRole('button', { name: '현재 위치로 이동' })).toHaveClass(
      'bottom-[248px]',
      'z-30',
    );
    expect(screen.getByRole('textbox', { name: '장소·주소 검색' })).toBeInTheDocument();
    expect(screen.queryByText('판교역')).not.toBeInTheDocument();
    expect(screen.queryByText('경기도 성남시 분당구 판교역로 166')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이 위치에 핀 등록' })).toHaveClass(
      'h-[52px]',
      'min-h-[52px]',
      '!rounded-[8px]',
      '!bg-[#414650]',
      '!px-4',
      '!py-3',
    );
    expect(screen.getByTestId('selection-marker-preview')).toHaveAttribute(
      'data-selection-marker-src',
      '/map-pins/accompany-marker.svg',
    );
  });

  it('등록 시 지도 중앙의 좌표를 전달한다', () => {
    const onLocationRegister = vi.fn<(coordinate: MapCoordinate) => void>();

    render(<PostLocationPage onLocationRegister={onLocationRegister} />);

    fireEvent.click(screen.getByRole('button', { name: '테스트 지도 중앙 이동' }));
    fireEvent.click(screen.getByRole('button', { name: '이 위치에 핀 등록' }));

    expect(onLocationRegister).toHaveBeenCalledWith({ lat: 37.3945, lng: 127.1112 });
  });

  it('지도 중앙이 변경되면 해당 위치의 장소명과 도로명주소를 표시한다', async () => {
    reverseGeocodeLocation.mockResolvedValue({
      placeName: '판교역',
      roadAddress: '경기 성남시 분당구 판교역로 160',
    });

    render(<PostLocationPage />);

    fireEvent.click(screen.getByRole('button', { name: '테스트 지도 중앙 이동' }));

    expect(await screen.findByText('경기 성남시 분당구 판교역로 160')).toBeInTheDocument();
    expect(reverseGeocodeLocation).toHaveBeenCalledWith({ lat: 37.3945, lng: 127.1112 });
  });

  it('검색 결과를 선택하면 지도 중심을 해당 장소로 이동한다', () => {
    useKakaoPlaceSearch.mockReturnValue({
      error: null,
      results: [
        {
          distance: '100m',
          id: 'pangyo-station',
          latitude: 37.3945,
          longitude: 127.1112,
          placeName: '판교역',
          roadAddress: '경기 성남시 분당구 판교역로 160',
        },
      ],
      status: 'success',
    });

    render(<PostLocationPage />);

    fireEvent.change(screen.getByRole('textbox', { name: '장소·주소 검색' }), {
      target: { value: '판교' },
    });
    fireEvent.click(screen.getByRole('button', { name: /판교역/ }));

    expect(screen.getByTestId('map')).toHaveAttribute('data-center-lat', '37.3945');
    expect(screen.getByTestId('map')).toHaveAttribute('data-center-lng', '127.1112');
  });

  it('새 위치를 조회하는 동안 이전 위치 정보를 유지한다', async () => {
    const firstLocation = {
      placeName: '판교역',
      roadAddress: '경기 성남시 분당구 판교역로 160',
    };
    const secondLocation = {
      placeName: '강남역',
      roadAddress: '서울특별시 강남구 강남대로 396',
    };
    let resolveSecondLocation: ((location: ReverseGeocodedLocation) => void) | undefined;

    reverseGeocodeLocation.mockResolvedValueOnce(firstLocation).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecondLocation = resolve;
        }),
    );

    render(<PostLocationPage />);

    fireEvent.click(screen.getByRole('button', { name: '테스트 지도 중앙 이동' }));
    expect(await screen.findByText(firstLocation.roadAddress)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '테스트 지도 다른 위치 이동' }));

    expect(screen.getByText(firstLocation.roadAddress)).toBeInTheDocument();
    expect(screen.queryByText(secondLocation.roadAddress)).not.toBeInTheDocument();

    resolveSecondLocation?.(secondLocation);

    expect(await screen.findByText(secondLocation.roadAddress)).toBeInTheDocument();
    expect(screen.queryByText(firstLocation.roadAddress)).not.toBeInTheDocument();
  });
});
