import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import {
  MatchingLocationAdjustPage,
  MatchingLocationPage,
  MatchingConfirmationPage,
  MatchingPage,
  MatchingTimePage,
} from '@/_pages/matching';
import {
  getMatchingTimePickerInitialValue,
  isMatchingTimeWithinThreeHours,
} from '@/_pages/matching/model/matching-time';
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
  vi.useRealTimers();
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
    expect(navigation.push).toHaveBeenCalledWith('/matching/time');
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
    expect(navigation.push).toHaveBeenCalledWith('/matching/time');
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

describe('MatchingTimePage', () => {
  it('현재 시각을 다음 10분 단위로 올림해 초기 시간으로 사용한다', () => {
    expect(getMatchingTimePickerInitialValue(new Date(2026, 8, 26, 18, 41, 5))).toEqual({
      period: '오후',
      hour: 6,
      minute: 50,
    });
    expect(getMatchingTimePickerInitialValue(new Date(2026, 8, 26, 23, 59))).toEqual({
      period: '오전',
      hour: 12,
      minute: 0,
    });
  });

  it('선택 시간이 현재 시각으로부터 3시간 이내인지 확인한다', () => {
    const now = new Date(2026, 8, 26, 18, 0);

    expect(isMatchingTimeWithinThreeHours({ period: '오후', hour: 9, minute: 0 }, now)).toBe(true);
    expect(isMatchingTimeWithinThreeHours({ period: '오후', hour: 9, minute: 10 }, now)).toBe(
      false,
    );
  });

  it('유효하지 않은 시간을 다음으로 진행하면 안내 Dialog를 표시한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 26, 18, 0));

    render(<MatchingTimePage />);

    vi.setSystemTime(new Date(2026, 8, 26, 21, 1));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByRole('dialog', { name: '시간을 다시 입력해주세요' })).toBeInTheDocument();
    expect(screen.getByText('현재 시각으로부터 3시간 이내로 설정해주세요')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('초기화 버튼을 누르면 페이지 진입 시각 기준 초기 시간으로 되돌린다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 26, 18, 1));
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(performance.now() + 1000);
      return 0;
    });

    render(<MatchingTimePage />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });
    const minuteWheel = minuteColumn.querySelector('[data-rwp]');

    if (!(minuteWheel instanceof HTMLElement)) {
      throw new Error('분 휠을 찾을 수 없습니다.');
    }

    fireEvent.keyDown(minuteWheel, { key: 'ArrowDown' });
    expect(minuteColumn).toHaveAttribute('aria-valuetext', '20');

    fireEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(minuteColumn).toHaveAttribute('aria-valuetext', '10');
  });

  it('유효한 시간을 다음으로 진행하면 정보 확인 화면으로 이동한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 26, 18, 0));

    render(<MatchingTimePage />);

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(navigation.push).toHaveBeenCalledWith('/matching/confirm');
  });

  it('탑승 희망 시간 선택 화면을 표시한다', () => {
    render(<MatchingTimePage />);

    expect(
      screen.getByRole('heading', { name: '탑승 희망 시간을 입력해주세요' }),
    ).toBeInTheDocument();
    expect(screen.getByText('현재 시각으로부터 3시간 이내만 가능해요')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '탑승 희망 시간' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '초기화' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
  });
});

describe('MatchingConfirmationPage', () => {
  it('선택 정보 확인 화면의 안내와 선택 정보를 표시한다', () => {
    render(<MatchingConfirmationPage />);

    expect(screen.getByRole('heading', { name: '이 정보가 맞나요?' })).toBeInTheDocument();
    expect(screen.getByText('매칭 등록 이후에는 수정할 수 없어요.')).toBeInTheDocument();
    expect(screen.getByText('판교역 2번 출구')).toBeInTheDocument();
    expect(screen.getByText('강남역')).toBeInTheDocument();
    expect(screen.getByText('오후 6:40')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '매칭 시작하기' })).toBeInTheDocument();
  });
});
