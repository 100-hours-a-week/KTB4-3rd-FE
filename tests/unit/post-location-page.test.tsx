import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostLocationPage } from '@/_pages/post-location';
import type { MapCoordinate } from '@/shared/types/common';

vi.mock('@/shared/ui/map', () => ({
  Map: ({
    className,
    onCenterChange,
    selectionMarker,
  }: {
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
    </div>
  ),
}));

afterEach(cleanup);

describe('PostLocationPage', () => {
  it('장소 선택 화면의 지도, 검색 헤더, 하단 푸터를 구성한다', () => {
    render(<PostLocationPage />);

    expect(screen.getByRole('main', { name: '글 등록 장소 선택' })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '장소·주소 검색' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: '판교역' })).toBeInTheDocument();
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
});
