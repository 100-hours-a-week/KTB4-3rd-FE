import { afterEach, describe, expect, it } from 'vitest';

import { usePostCreateStore } from '@/features/post-create';

afterEach(() => {
  usePostCreateStore.getState().resetDraft();
});

describe('usePostCreateStore', () => {
  it('멀티스텝 동행모집 입력값을 저장하고 API payload로 변환한다', () => {
    const store = usePostCreateStore.getState();

    store.setType('COMPANION');
    store.setCompanionLocation('origin', {
      name: '판교역',
      lat: 37.3945,
      lng: 127.1112,
    });
    store.setCompanionLocation('destination', {
      name: '강남역',
      lat: 37.4979,
      lng: 127.0276,
    });
    store.setCompanionField('departureDate', '2026-09-05');
    store.setCompanionField('departureTime', { period: '오전', hour: 8, minute: 30 });
    store.setCompanionField('transportType', 'TAXI');
    store.setCompanionField('recruitCount', 3);
    store.setCompanionField('content', '택시 같이 타실 분 구합니다!');

    expect(sessionStorage.getItem('post-create-draft')).toContain('판교역');

    expect(usePostCreateStore.getState().getCompanionPayload()).toEqual({
      origin_name: '판교역',
      origin_lat: 37.3945,
      origin_lng: 127.1112,
      dest_name: '강남역',
      dest_lat: 37.4979,
      dest_lng: 127.0276,
      departure_at: new Date(2026, 8, 5, 8, 30).toISOString(),
      transport_type: 'TAXI',
      recruit_count: 3,
      content: '택시 같이 타실 분 구합니다!',
    });
  });

  it('필수값이 부족하면 동행모집 payload를 만들지 않는다', () => {
    const store = usePostCreateStore.getState();

    store.setCompanionLocation('origin', { name: '판교역', lat: null, lng: null });

    expect(store.getCompanionPayload()).toBeNull();
  });

  it('작성 데이터가 있으면 타입 변경 확인 대상으로 판단한다', () => {
    const store = usePostCreateStore.getState();

    expect(store.hasDraftData()).toBe(false);

    store.setCommunityField('title', '작성 중인 게시글');

    expect(usePostCreateStore.getState().hasDraftData()).toBe(true);
  });

  it('위치만 저장된 상태에서는 타입 변경 확인 대상이 아니다', () => {
    const store = usePostCreateStore.getState();

    store.setPostLocation({ lat: 37.3945, lng: 127.1112 }, '판교역');

    expect(store.hasDraftData()).toBe(false);
  });

  it('커뮤니티 글 입력값과 위치를 저장하고 API payload로 변환한다', () => {
    const store = usePostCreateStore.getState();

    store.setType('COMMUNITY');
    store.setCommunityField('title', '판교역 근처 카페 추천');
    store.setCommunityField('content', '조용히 작업하기 좋은 카페가 있을까요?');
    store.setPostLocation({ lat: 37.3945, lng: 127.1112 }, '판교역');

    expect(store.getCommunityPayload()).toEqual({
      title: '판교역 근처 카페 추천',
      content: '조용히 작업하기 좋은 카페가 있을까요?',
      lat: 37.3945,
      lng: 127.1112,
    });
    expect(usePostCreateStore.getState().postLocationName).toBe('판교역');
  });
});
