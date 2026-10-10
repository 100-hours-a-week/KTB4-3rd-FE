import { afterEach, describe, expect, it } from 'vitest';

import { useCarpoolCreateStore } from '@/features/carpool-registration';

afterEach(() => {
  useCarpoolCreateStore.getState().reset();
});

describe('useCarpoolCreateStore', () => {
  it('카풀 등록을 시작하면 모든 초안 입력을 비워 둔다', () => {
    expect(useCarpoolCreateStore.getState().draft).toEqual({
      origin: null,
      destination: null,
      departureDate: null,
      departureTime: null,
      recruitCount: null,
    });
  });

  it('위치·날짜·시간·모집 인원을 한 초안에 보관한다', () => {
    const store = useCarpoolCreateStore.getState();
    store.setOrigin({ name: '서울역', lat: 37.5547, lng: 126.9707 });
    store.setDestination({ name: '강남역', lat: 37.4979, lng: 127.0276 });
    store.setDepartureDate('2026-11-01');
    store.setDepartureTime({ period: '오후', hour: 12, minute: 30 });
    store.setRecruitCount(3);

    expect(useCarpoolCreateStore.getState().draft).toEqual({
      origin: { name: '서울역', lat: 37.5547, lng: 126.9707 },
      destination: { name: '강남역', lat: 37.4979, lng: 127.0276 },
      departureDate: '2026-11-01',
      departureTime: { period: '오후', hour: 12, minute: 30 },
      recruitCount: 3,
    });
  });

  it('각 단계의 초안 값을 보존하며 다시 시작할 때 초기 상태로 비운다', () => {
    const store = useCarpoolCreateStore.getState();
    store.setOrigin({ name: '서울역', lat: 37.5547, lng: 126.9707 });
    store.setDepartureDate('2026-11-01');
    store.setDepartureTime({ period: '오후', hour: 12, minute: 30 });
    store.setRecruitCount(2);
    store.setPendingLocation({
      field: 'destination',
      location: { name: '판교역', lat: 37.4, lng: 127.1 },
      roadAddress: '판교역로',
    });
    store.reset();

    expect(useCarpoolCreateStore.getState().draft).toEqual({
      origin: null,
      destination: null,
      departureDate: null,
      departureTime: null,
      recruitCount: null,
    });
    expect(useCarpoolCreateStore.getState().pendingLocation).toBeNull();
  });
});
