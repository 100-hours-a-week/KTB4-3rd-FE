import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  LocationSearchHeader,
  LocationSelectionFooter,
  type LocationSearchHeaderResult,
} from '@/features/post-location';

afterEach(cleanup);

describe('LocationSearchHeader', () => {
  it('검색어를 입력하고 변경 콜백을 호출한다', () => {
    const onValueChange = vi.fn<(value: string) => void>();

    render(<LocationSearchHeader onValueChange={onValueChange} />);

    const searchInput = screen.getByRole('textbox', { name: '장소·주소 검색' });

    expect(searchInput).toHaveAttribute('placeholder', '장소 · 주소를 검색해보세요');
    expect(screen.getByRole('search')).not.toHaveClass('w-full');
    expect(searchInput.parentElement).not.toHaveClass('focus-within:border-2');
    expect(screen.getByRole('link', { name: '뒤로가기' })).toHaveAttribute('href', '/');

    fireEvent.change(searchInput, { target: { value: '판교역' } });

    expect(searchInput).toHaveValue('판교역');
    expect(onValueChange).toHaveBeenCalledWith('판교역');
  });

  it('검색어에 맞는 장소 목록을 표시하고 선택 결과를 전달한다', () => {
    const onResultSelect = vi.fn<(result: LocationSearchHeaderResult) => void>();
    const result: LocationSearchHeaderResult = {
      distance: '100m',
      id: 'pangyo-station',
      latitude: 37.3945,
      longitude: 127.1112,
      placeName: '판교역',
      roadAddress: '경기 성남시 분당구 판교역로 160',
    };

    render(
      <LocationSearchHeader
        onResultSelect={onResultSelect}
        results={[result]}
        searchStatus="success"
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: '장소·주소 검색' }), {
      target: { value: '판교' },
    });

    expect(screen.getByRole('list', { name: '장소 검색 결과' })).toHaveClass('top-[52px]');
    expect(screen.getByRole('button', { name: /판교역/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /판교역/ }));

    expect(onResultSelect).toHaveBeenCalledWith(result);
    expect(screen.getByRole('textbox', { name: '장소·주소 검색' })).toHaveValue('판교역');
    expect(screen.queryByRole('list', { name: '장소 검색 결과' })).not.toBeInTheDocument();
  });
});

describe('LocationSelectionFooter', () => {
  it('선택한 장소 정보와 등록 버튼을 렌더링한다', () => {
    const onRegister = vi.fn<() => void>();

    render(
      <LocationSelectionFooter
        onRegister={onRegister}
        placeName="강남역"
        roadAddress="서울특별시 강남구 강남대로 396"
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: '강남역' })).toBeInTheDocument();
    expect(screen.getByText('서울특별시 강남구 강남대로 396')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '이 위치에 핀 등록' }));

    expect(onRegister).toHaveBeenCalledOnce();
  });
});
