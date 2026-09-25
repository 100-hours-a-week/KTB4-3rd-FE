import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { PostLocationPage } from '@/_pages/post-location';
import type { reverseGeocodeLocation as ReverseGeocodeLocation } from '@/features/post-location';
import type { MapCoordinate } from '@/shared/types/common';

const { reverseGeocodeLocation } = vi.hoisted(() => ({
  reverseGeocodeLocation: vi.fn<typeof ReverseGeocodeLocation>(),
}));

vi.mock('@/shared/ui/map', () => ({
  Map: ({
    className,
    children,
    onCenterChange,
    selectionMarker,
  }: {
    children?: ReactNode;
    className?: string;
    onCenterChange?: (center: MapCoordinate) => void;
    selectionMarker?: { src: string };
  }) => (
    <div className={className} data-testid="map" role="application">
      <button type="button" onClick={() => onCenterChange?.({ lat: 37.3945, lng: 127.1112 })}>
        테스트 지도 중앙 이동
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

beforeEach(() => {
  reverseGeocodeLocation.mockResolvedValue({ placeName: null, roadAddress: null });
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
});
