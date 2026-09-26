import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { MatchingLocationAdjustPage, MatchingLocationPage, MatchingPage } from '@/_pages/matching';
import { useMatchingStore } from '@/_pages/matching/model/matching-store';
import type * as LocationSearchModule from '@/features/location-search';
import type { UseKakaoPlaceSearchResult } from '@/features/location-search';
import type { ReverseGeocodedLocation } from '@/features/post-location';
import type { MapCoordinate } from '@/shared/types/common';

const { navigation, useKakaoPlaceSearch, reverseGeocodeLocation, searchParams } = vi.hoisted(
  () => ({
    navigation: {
      push: vi.fn<(path: string) => void>(),
      replace: vi.fn<(path: string) => void>(),
    },
    reverseGeocodeLocation:
      vi.fn<(coordinate: MapCoordinate) => Promise<ReverseGeocodedLocation>>(),
    searchParams: new URLSearchParams('field=destination'),
    useKakaoPlaceSearch: vi.fn<() => UseKakaoPlaceSearchResult>(),
  }),
);

const searchResult = {
  distance: '116m',
  id: 'uspace-1',
  latitude: 37.402,
  longitude: 127.108,
  placeName: '유스페이스1빌딩',
  roadAddress: '경기 성남시 분당구 대왕판교로 660',
};

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useSearchParams: () => searchParams,
}));

vi.mock('@/features/location-search', async () => {
  const actual = await vi.importActual<typeof LocationSearchModule>('@/features/location-search');

  return { ...actual, useKakaoPlaceSearch };
});

vi.mock('@/features/post-location', () => ({ reverseGeocodeLocation }));

vi.mock('@/shared/ui/map', () => ({
  Map: ({
    children,
    onCenterChange,
    onUserLocationChange,
  }: {
    children?: ReactNode;
    onCenterChange?: (coordinate: MapCoordinate) => void;
    onUserLocationChange?: (coordinate: MapCoordinate) => void;
  }) => (
    <div data-testid="map" role="application">
      <button type="button" onClick={() => onCenterChange?.({ lat: 37.402, lng: 127.108 })}>
        조정 지도 위치 변경
      </button>
      <button type="button" onClick={() => onUserLocationChange?.({ lat: 37.5, lng: 127.0 })}>
        테스트 현재 위치 지정
      </button>
      {children}
    </div>
  ),
  MyLocationButton: () => <button aria-label="현재 위치로 이동" type="button" />,
}));

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
  navigation.replace.mockReset();
  useKakaoPlaceSearch.mockReset();
  reverseGeocodeLocation.mockReset();
  useMatchingStore.getState().reset();
  searchParams.delete('field');
  searchParams.set('field', 'destination');
});

describe('MatchingPage', () => {
  it('출발지와 도착지 LocationInputButton을 표시하고 검색 화면으로 이동한다', () => {
    render(<MatchingPage />);

    expect(screen.getByRole('button', { name: '출발지' })).toHaveTextContent('서울역');
    expect(screen.getByRole('button', { name: '도착지' })).toHaveTextContent('어디로 갈까요?');
    expect(screen.getByTestId('map')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '도착지' }));

    expect(navigation.push).toHaveBeenCalledWith('/matching/location?field=destination');
  });

  it('현재 위치를 받으면 출발지를 현위치 장소명으로 갱신한다', async () => {
    reverseGeocodeLocation.mockResolvedValue({
      placeName: '강남역',
      roadAddress: '서울특별시 강남구 강남대로 396',
    });

    render(<MatchingPage />);

    fireEvent.click(screen.getByRole('button', { name: '테스트 현재 위치 지정' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '출발지' })).toHaveTextContent('현위치: 강남역');
    });
  });
});

describe('MatchingLocationPage', () => {
  it('출발지 검색 화면은 장소명만 표시하고 해당 입력에 자동 포커스한다', () => {
    searchParams.set('field', 'departure');
    useMatchingStore.getState().setLocation('departure', {
      ...searchResult,
      id: 'current-location',
      placeName: '유스페이스1',
    });
    useKakaoPlaceSearch.mockReturnValue({ error: null, results: [], status: 'idle' });

    render(<MatchingLocationPage />);

    const departureInput = screen.getByRole('textbox', { name: '출발지' });
    expect(departureInput).toHaveValue('유스페이스1');
    expect(departureInput).toHaveFocus();
  });

  it('검색 결과의 도착 버튼을 누르면 위치를 바로 지정한다', () => {
    useKakaoPlaceSearch.mockReturnValue({
      error: null,
      results: [searchResult],
      status: 'success',
    });

    render(<MatchingLocationPage />);

    expect(screen.getByRole('textbox', { name: '도착지' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: '도착 유스페이스1빌딩' }));

    expect(useMatchingStore.getState().destination).toEqual(searchResult);
    expect(navigation.push).toHaveBeenCalledWith('/matching');
  });

  it('검색 결과 본문을 누르면 위치 세부 조정 화면으로 이동한다', () => {
    useKakaoPlaceSearch.mockReturnValue({
      error: null,
      results: [searchResult],
      status: 'success',
    });

    render(<MatchingLocationPage />);

    fireEvent.click(screen.getByRole('button', { name: /유스페이스1빌딩.*상세 위치 조정/ }));

    expect(useMatchingStore.getState().pendingLocation).toEqual(searchResult);
    expect(navigation.push).toHaveBeenCalledWith('/matching/location/adjust?field=destination');
  });
});

describe('MatchingLocationAdjustPage', () => {
  it('지도 위치를 조정하고 도착지로 설정한다', async () => {
    useMatchingStore.getState().setPendingLocation(searchResult);
    reverseGeocodeLocation.mockResolvedValue({
      placeName: '새로운 장소',
      roadAddress: '새로운 도로명주소',
    });

    render(<MatchingLocationAdjustPage />);

    fireEvent.click(screen.getByRole('button', { name: '조정 지도 위치 변경' }));
    expect(await screen.findByText('새로운 장소')).toBeInTheDocument();
    expect(await screen.findByText('새로운 도로명주소')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '도착지로 설정' }));

    expect(useMatchingStore.getState().destination).toMatchObject({
      latitude: 37.402,
      longitude: 127.108,
      placeName: '새로운 장소',
      roadAddress: '새로운 도로명주소',
    });
    expect(navigation.push).toHaveBeenCalledWith('/matching');
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
