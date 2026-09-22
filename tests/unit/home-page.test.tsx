import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MapMarker } from '@/shared/ui/map';
import { HomePage } from '@/_pages/home';

type MockMapProps = {
  children?: ReactNode;
  markers?: readonly MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
};

vi.mock('@/shared/ui/map', () => ({
  Map: ({ children, markers = [], onMarkerClick }: MockMapProps) => (
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
  ),
  MyLocationButton: ({ className }: { className?: string }) => (
    <button aria-label="현재 위치로 이동" className={className} type="button" />
  ),
}));

afterEach(cleanup);

describe('HomePage', () => {
  it('지도, 글쓰기 버튼, 바텀시트, 하단 네비게이션을 조합한다', () => {
    render(<HomePage />);

    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '현재 위치' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '글쓰기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' })).toHaveClass(
      'z-20',
    );
    expect(screen.getByRole('heading', { name: '근처 핀 게시글' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { hidden: true, name: '주요 메뉴' })).toBeInTheDocument();
  });

  it('커뮤니티 핀을 클릭하면 커뮤니티 상세 데이터가 바텀모달에 표시된다', () => {
    render(<HomePage />);

    fireEvent.click(screen.getByTestId('map-marker-3'));

    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '판교역 근처 카페 추천' })).toBeInTheDocument();
    expect(screen.getByText('조용히 작업하기 좋은 카페를 찾고 있어요.')).toBeInTheDocument();
    expect(screen.getByText('루디')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '근처 핀 게시글' })).not.toBeInTheDocument();
  });

  it('동행 모집 핀을 클릭하면 동행 모집 상세 데이터가 바텀모달에 표시된다', () => {
    render(<HomePage />);

    fireEvent.click(screen.getByTestId('map-marker-1'));

    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '판교역까지 카풀할 분 찾아요' }),
    ).toBeInTheDocument();
    expect(screen.getByText('서울역에서 판교역까지 함께 이동할 분을 구해요.')).toBeInTheDocument();
    expect(screen.getByText('서울역 10번 출구')).toBeInTheDocument();
    expect(screen.getByText('판교역 1번 출구')).toBeInTheDocument();
    expect(screen.getByText('2 / 4명')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '근처 핀 게시글' })).not.toBeInTheDocument();
  });

  it('바텀모달을 닫으면 선택한 게시글 상세가 사라진다', () => {
    render(<HomePage />);

    fireEvent.click(screen.getByTestId('map-marker-3'));
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '판교역 근처 카페 추천' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '근처 핀 게시글' })).toBeInTheDocument();
  });
});
