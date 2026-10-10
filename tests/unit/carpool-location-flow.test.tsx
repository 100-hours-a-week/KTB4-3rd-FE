import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type * as LocationSearchModule from '@/features/location-search';

import {
  CarpoolCreatePage,
  CarpoolLocationAdjustPage,
  CarpoolLocationPage,
} from '@/_pages/carpool-create';
import type { UseKakaoPlaceSearchResult } from '@/features/location-search';
import { useCarpoolCreateStore } from '@/features/carpool-registration';
import type { MapCoordinate } from '@/shared/types/common';
import type { ReverseGeocodedLocation } from '@/features/post-location';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const { navigation, searchParams, useKakaoPlaceSearch, reverseGeocodeLocation } = vi.hoisted(
  () => ({
    navigation: {
      push: vi.fn<(path: string) => void>(),
      replace: vi.fn<(path: string) => void>(),
    },
    searchParams: new URLSearchParams('field=departure'),
    useKakaoPlaceSearch: vi.fn<(query: string) => UseKakaoPlaceSearchResult>(),
    reverseGeocodeLocation:
      vi.fn<(coordinate: MapCoordinate) => Promise<ReverseGeocodedLocation>>(),
  }),
);

const result = {
  id: 'place-1',
  placeName: '유스페이스1빌딩',
  roadAddress: '경기 성남시 분당구 대왕판교로 660',
  distance: '116m',
  latitude: 37.402,
  longitude: 127.108,
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
    onUserLocationError,
  }: {
    children?: ReactNode;
    onCenterChange?: (coordinate: MapCoordinate) => void;
    onUserLocationChange?: (coordinate: MapCoordinate) => void;
    onUserLocationError?: () => void;
  }) => (
    <div data-testid="map" role="application">
      <button type="button" onClick={() => onUserLocationChange?.({ lat: 37.5, lng: 127.0 })}>
        테스트 현재 위치 지정
      </button>
      <button type="button" onClick={() => onCenterChange?.({ lat: 37.49, lng: 127.02 })}>
        지도 위치 변경
      </button>
      <button type="button" onClick={() => onUserLocationError?.()}>
        위치 조회 실패
      </button>
      {children}
    </div>
  ),
  MyLocationButton: ({ onClick }: { onClick?: () => void }) => (
    <button aria-label="현재 위치로 이동" type="button" onClick={onClick} />
  ),
}));

function renderPage(node: ReactNode) {
  return render(node);
}

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
  navigation.replace.mockReset();
  useKakaoPlaceSearch.mockReset();
  reverseGeocodeLocation.mockReset();
  useCarpoolCreateStore.getState().reset();
  useSnackbarStore.getState().reset();
  searchParams.delete('field');
  searchParams.set('field', 'departure');
});

describe('CarpoolCreatePage', () => {
  it('출발지와 도착지를 각 검색 경로로 연다', async () => {
    renderPage(<CarpoolCreatePage />);

    await userEvent.click(screen.getByRole('button', { name: '출발지' }));
    expect(navigation.push).toHaveBeenCalledWith('/carpools/new/location?field=departure');

    await userEvent.click(screen.getByRole('button', { name: '도착지' }));
    expect(navigation.push).toHaveBeenLastCalledWith('/carpools/new/location?field=destination');
  });

  it('현재 위치를 출발지로 저장하고 역지오코딩 장소명으로 갱신한다', async () => {
    reverseGeocodeLocation.mockResolvedValue({ placeName: '강남역', roadAddress: '강남대로' });
    renderPage(<CarpoolCreatePage />);

    await userEvent.click(screen.getByRole('button', { name: '테스트 현재 위치 지정' }));

    await waitFor(() => {
      expect(useCarpoolCreateStore.getState().draft.origin).toEqual({
        name: '강남역',
        lat: 37.5,
        lng: 127,
      });
    });
  });

  it('현재 위치 조회 실패 시 기존 위치가 없으면 서울역을 유지한다', async () => {
    renderPage(<CarpoolCreatePage />);
    fireEvent.click(screen.getByRole('button', { name: '위치 조회 실패' }));
    expect(useCarpoolCreateStore.getState().draft.origin).toEqual({
      name: '서울역',
      lat: 37.5547,
      lng: 126.9707,
    });
  });

  it('현재 위치 조회 실패 시 사용자가 이미 고른 출발지를 유지한다', () => {
    useCarpoolCreateStore.getState().setOrigin({ name: '판교역', lat: 37.4, lng: 127.1 });
    renderPage(<CarpoolCreatePage />);
    fireEvent.click(screen.getByRole('button', { name: '위치 조회 실패' }));

    expect(useCarpoolCreateStore.getState().draft.origin).toEqual({
      name: '판교역',
      lat: 37.4,
      lng: 127.1,
    });
  });
});

describe('CarpoolLocationPage', () => {
  it('field가 잘못됐으면 출발지 검색 경로로 보낸다', async () => {
    searchParams.set('field', 'invalid');
    renderPage(<CarpoolLocationPage />);
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith('/carpools/new/location?field=departure'),
    );
  });

  it('출발지를 바로 선택하면 초안에 저장하고 도착지 검색으로 전환한다', async () => {
    useKakaoPlaceSearch.mockReturnValue({ error: null, results: [result], status: 'success' });
    renderPage(<CarpoolLocationPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '출발 유스페이스1빌딩' }));

    expect(useCarpoolCreateStore.getState().draft.origin).toEqual({
      name: '유스페이스1빌딩',
      lat: 37.402,
      lng: 127.108,
    });
    expect(navigation.replace).toHaveBeenCalledWith('/carpools/new/location?field=destination');
  });

  it('도착지를 바로 선택하면 초안에 저장하고 추가 정보로 이동한다', async () => {
    searchParams.set('field', 'destination');
    useCarpoolCreateStore.getState().setOrigin({ name: '서울역', lat: 37.55, lng: 126.97 });
    useKakaoPlaceSearch.mockReturnValue({ error: null, results: [result], status: 'success' });
    renderPage(<CarpoolLocationPage />);

    await userEvent.click(screen.getByRole('button', { name: '도착 유스페이스1빌딩' }));

    expect(useCarpoolCreateStore.getState().draft.destination).toEqual({
      name: '유스페이스1빌딩',
      lat: 37.402,
      lng: 127.108,
    });
    expect(navigation.push).toHaveBeenCalledWith('/carpools/new/info');
  });

  it('검색 결과의 장소 정보 클릭은 임시 위치를 저장하고 field를 유지해 조정 화면을 연다', async () => {
    useKakaoPlaceSearch.mockReturnValue({ error: null, results: [result], status: 'success' });
    renderPage(<CarpoolLocationPage />);

    await userEvent.click(
      screen.getByRole('button', {
        name: '유스페이스1빌딩, 경기 성남시 분당구 대왕판교로 660 상세 위치 조정',
      }),
    );

    expect(useCarpoolCreateStore.getState().pendingLocation).toEqual({
      field: 'departure',
      location: { name: '유스페이스1빌딩', lat: 37.402, lng: 127.108 },
      roadAddress: '경기 성남시 분당구 대왕판교로 660',
    });
    expect(navigation.push).toHaveBeenCalledWith('/carpools/new/location/adjust?field=departure');
  });
});

describe('CarpoolLocationAdjustPage', () => {
  it('임시 위치 없이 직접 열면 선택 field로 검색 화면에 돌려보낸다', async () => {
    searchParams.set('field', 'destination');
    renderPage(<CarpoolLocationAdjustPage />);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith('/carpools/new/location?field=destination'),
    );
  });

  it('조정한 도착 좌표와 역지오코딩 장소명을 확정하고 추가 정보로 이동한다', async () => {
    searchParams.set('field', 'destination');
    useCarpoolCreateStore.getState().setPendingLocation({
      field: 'destination',
      location: { name: '초기 장소', lat: 37.402, lng: 127.108 },
      roadAddress: '초기 주소',
    });
    reverseGeocodeLocation.mockResolvedValue({ placeName: '강남역', roadAddress: '강남대로' });
    renderPage(<CarpoolLocationAdjustPage />);

    await userEvent.click(screen.getByRole('button', { name: '지도 위치 변경' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '강남역' })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole('button', { name: '도착지로 설정' }));

    expect(useCarpoolCreateStore.getState().draft.destination).toEqual({
      name: '강남역',
      lat: 37.49,
      lng: 127.02,
    });
    expect(useCarpoolCreateStore.getState().pendingLocation).toBeNull();
    expect(navigation.push).toHaveBeenCalledWith('/carpools/new/info');
  });
});
