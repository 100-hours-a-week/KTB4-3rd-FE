import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useCarpoolCreateStore } from '@/features/carpool-registration';

const CARPOOL_CREATE_DRAFT_STORAGE_KEY = 'carpool-create-draft';

beforeEach(() => {
  sessionStorage.removeItem(CARPOOL_CREATE_DRAFT_STORAGE_KEY);
  useCarpoolCreateStore.getState().reset();
});

afterEach(() => {
  useCarpoolCreateStore.getState().reset();
  sessionStorage.removeItem(CARPOOL_CREATE_DRAFT_STORAGE_KEY);
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
    expect(sessionStorage.getItem(CARPOOL_CREATE_DRAFT_STORAGE_KEY)).toContain('서울역');
  });

  it('sessionStorage에 저장된 유효한 초안을 다시 불러온다', async () => {
    sessionStorage.setItem(
      CARPOOL_CREATE_DRAFT_STORAGE_KEY,
      JSON.stringify({
        state: {
          draft: {
            origin: { name: '서울역', lat: 37.5547, lng: 126.9707 },
            destination: { name: '강남역', lat: 37.4979, lng: 127.0276 },
            departureDate: '2026-11-01',
            departureTime: { period: '오후', hour: 12, minute: 30 },
            recruitCount: 3,
          },
          pendingLocation: {
            field: 'destination',
            location: { name: '강남역', lat: 37.4979, lng: 127.0276 },
            roadAddress: '강남대로',
          },
          searchQuery: '강남역',
        },
        version: 0,
      }),
    );

    await useCarpoolCreateStore.persist.rehydrate();

    expect(useCarpoolCreateStore.getState()).toMatchObject({
      draft: {
        origin: { name: '서울역', lat: 37.5547, lng: 126.9707 },
        destination: { name: '강남역', lat: 37.4979, lng: 127.0276 },
        departureDate: '2026-11-01',
        departureTime: { period: '오후', hour: 12, minute: 30 },
        recruitCount: 3,
      },
      pendingLocation: {
        field: 'destination',
        location: { name: '강남역', lat: 37.4979, lng: 127.0276 },
        roadAddress: '강남대로',
      },
      searchQuery: '강남역',
    });
  });

  it('sessionStorage의 잘못된 초안은 무시하고 초기 상태를 유지한다', async () => {
    sessionStorage.setItem(
      CARPOOL_CREATE_DRAFT_STORAGE_KEY,
      JSON.stringify({
        state: {
          draft: {
            origin: { name: '서울역', lat: '잘못된 좌표', lng: 126.9707 },
            destination: null,
            departureDate: '2026-02-30',
            departureTime: { period: '저녁', hour: 13, minute: 25 },
            recruitCount: 4,
          },
          pendingLocation: null,
          searchQuery: 123,
        },
        version: 0,
      }),
    );

    await useCarpoolCreateStore.persist.rehydrate();

    expect(useCarpoolCreateStore.getState().draft).toEqual({
      origin: null,
      destination: null,
      departureDate: null,
      departureTime: null,
      recruitCount: null,
    });
    expect(useCarpoolCreateStore.getState().pendingLocation).toBeNull();
    expect(useCarpoolCreateStore.getState().searchQuery).toBe('');
  });

  it('sessionStorage의 깨진 JSON도 오류 없이 무시한다', async () => {
    sessionStorage.setItem(CARPOOL_CREATE_DRAFT_STORAGE_KEY, '{broken-json');

    await useCarpoolCreateStore.persist.rehydrate();

    expect(useCarpoolCreateStore.getState().draft).toEqual({
      origin: null,
      destination: null,
      departureDate: null,
      departureTime: null,
      recruitCount: null,
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
    expect(
      JSON.parse(sessionStorage.getItem(CARPOOL_CREATE_DRAFT_STORAGE_KEY) ?? '{}'),
    ).toMatchObject({
      state: {
        draft: {
          origin: null,
          destination: null,
          departureDate: null,
          departureTime: null,
          recruitCount: null,
        },
        pendingLocation: null,
        searchQuery: '',
      },
    });
  });
});
