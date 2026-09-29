import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LocationSearchResult } from '@/features/location-search/model/location';
import { useKakaoPlaceSearch } from '@/features/location-search/model/use-kakao-place-search';

const { searchKakaoPlaces } = vi.hoisted(() => ({
  searchKakaoPlaces: vi.fn<(keyword: string) => Promise<LocationSearchResult[]>>(),
}));

vi.mock('@/features/location-search/model/kakao-place-search', () => ({
  searchKakaoPlaces,
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('useKakaoPlaceSearch', () => {
  it('새 검색 결과를 기다리는 동안 이전 결과를 유지한다', async () => {
    vi.useFakeTimers();

    const firstResult: LocationSearchResult = {
      id: 'first',
      placeName: '첫 번째 장소',
      distance: '100m',
      roadAddress: '첫 번째 주소',
    };
    const secondResult: LocationSearchResult = {
      id: 'second',
      placeName: '두 번째 장소',
      distance: '200m',
      roadAddress: '두 번째 주소',
    };

    searchKakaoPlaces.mockImplementation((keyword) =>
      Promise.resolve(keyword === '첫 검색' ? [firstResult] : [secondResult]),
    );

    const { rerender, result } = renderHook(
      ({ query }: { query: string }) => useKakaoPlaceSearch(query),
      { initialProps: { query: '첫 검색' } },
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.results).toEqual([firstResult]);

    rerender({ query: '두 검색' });

    expect(result.current.status).toBe('loading');
    expect(result.current.results).toEqual([firstResult]);

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.results).toEqual([secondResult]);
  });
});
