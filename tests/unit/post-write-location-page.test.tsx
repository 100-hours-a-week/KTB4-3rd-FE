import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostWriteLocationPage } from '@/_pages/post-write-location';
import { usePostCreateStore } from '@/features/post-create';

const navigation = vi.hoisted(() => ({
  back: vi.fn<() => void>(),
}));
const searchParams = vi.hoisted(() => ({ field: 'departure' }));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useSearchParams: () => ({
    get: (key: string) => (key === 'field' ? searchParams.field : null),
  }),
}));

vi.mock('@/features/location-search/model/use-kakao-place-search', () => ({
  useKakaoPlaceSearch: (query: string) => {
    const result = query.includes('강남')
      ? {
          id: 'gangnam-station',
          placeName: '강남역',
          distance: '100m',
          roadAddress: '서울 강남구 강남대로 396',
        }
      : {
          id: 'pangyo-station',
          placeName: '판교역',
          distance: '100m',
          roadAddress: '경기 성남시 분당구 판교역로 160',
        };

    return {
      error: null,
      results: query ? [result] : [],
      status: query ? 'success' : 'idle',
    };
  },
}));

afterEach(() => {
  cleanup();
  navigation.back.mockReset();
  searchParams.field = 'departure';
  usePostCreateStore.getState().resetDraft();
});

describe('PostWriteLocationPage', () => {
  it('출발지 검색 라우트는 출발지 인풋에 포커스한다', () => {
    render(<PostWriteLocationPage />);

    expect(screen.getByRole('textbox', { name: '출발지' })).toHaveFocus();
  });

  it('목적지 검색 라우트는 출발지를 유지하고 목적지만 초기화한다', () => {
    searchParams.field = 'destination';
    usePostCreateStore.getState().setCompanionLocation('origin', {
      name: '판교역',
      lat: 37.3945,
      lng: 127.1112,
    });
    usePostCreateStore.getState().setCompanionLocation('destination', {
      name: '강남역',
      lat: 37.4979,
      lng: 127.0276,
    });

    render(<PostWriteLocationPage />);

    expect(screen.getByRole('textbox', { name: '출발지' })).toHaveValue('판교역');
    expect(screen.getByRole('textbox', { name: '도착지' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: '도착지' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: '장소 검색 닫기' }));

    expect(navigation.back).toHaveBeenCalledOnce();
  });

  it('출발지와 목적지를 선택하면 작성 스토어에 저장하고 돌아간다', () => {
    render(<PostWriteLocationPage />);

    fireEvent.change(screen.getByRole('textbox', { name: '출발지' }), {
      target: { value: '판교' },
    });
    fireEvent.click(screen.getByRole('button', { name: /판교역/ }));
    fireEvent.change(screen.getByRole('textbox', { name: '도착지' }), {
      target: { value: '강남' },
    });
    fireEvent.click(screen.getByRole('button', { name: /강남역/ }));

    expect(usePostCreateStore.getState().companion).toMatchObject({
      destination: {
        name: '강남역',
        lat: null,
        lng: null,
      },
      origin: {
        name: '판교역',
        lat: null,
        lng: null,
      },
    });
    expect(navigation.back).toHaveBeenCalledOnce();
  });
});
