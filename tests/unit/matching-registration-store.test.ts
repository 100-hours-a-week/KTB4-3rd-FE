import { afterEach, describe, expect, it } from 'vitest';

import { useMatchingRegistrationStore } from '@/features/matching-registration';

afterEach(() => {
  useMatchingRegistrationStore.getState().reset();
});

describe('useMatchingRegistrationStore', () => {
  it('백엔드 매칭 등록 payload에 맞춰 위치와 탑승 시간을 관리한다', () => {
    const store = useMatchingRegistrationStore.getState();

    store.setOrigin({ name: '판교역', lat: 37.3945, lng: 127.1112 });
    store.setDestination({ name: '강남역', lat: 37.4979, lng: 127.0276 });
    store.setDepartureAt('2026-09-05T08:30:00.000Z');

    expect(useMatchingRegistrationStore.getState().getPayload()).toEqual({
      origin_name: '판교역',
      origin_lat: 37.3945,
      origin_lng: 127.1112,
      dest_name: '강남역',
      dest_lat: 37.4979,
      dest_lng: 127.0276,
      departure_at: '2026-09-05T08:30:00.000Z',
    });
  });

  it('필수 값이 모두 채워지기 전에는 payload를 반환하지 않는다', () => {
    useMatchingRegistrationStore.getState().setOrigin({
      name: '판교역',
      lat: 37.3945,
      lng: 127.1112,
    });

    expect(useMatchingRegistrationStore.getState().getPayload()).toBeNull();
  });

  it('reset으로 등록 데이터를 초기화한다', () => {
    const store = useMatchingRegistrationStore.getState();

    store.setOrigin({ name: '판교역', lat: 37.3945, lng: 127.1112 });
    store.setDestination({ name: '강남역', lat: 37.4979, lng: 127.0276 });
    store.setDepartureAt('2026-09-05T08:30:00.000Z');
    store.reset();

    expect(useMatchingRegistrationStore.getState()).toMatchObject({
      origin_name: null,
      origin_lat: null,
      origin_lng: null,
      dest_name: null,
      dest_lat: null,
      dest_lng: null,
      departure_at: null,
    });
  });
});
