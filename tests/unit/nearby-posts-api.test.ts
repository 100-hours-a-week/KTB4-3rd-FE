import { describe, expect, it } from 'vitest';

import { getNearbyPosts } from '@/_pages/home/api/nearby-posts';

describe('nearby posts API', () => {
  it('사용자 위치와 지도 영역 좌표로 주변 게시글을 조회한다', async () => {
    const response = await getNearbyPosts({
      lat: 37.3945,
      lng: 127.1112,
      sw_lat: 37.3,
      sw_lng: 127,
      ne_lat: 37.6,
      ne_lng: 127.2,
    });

    expect(response.data.items).toEqual([
      {
        type: 'COMPANION',
        id: 10,
        title: '판교역 → 강남역',
        author: { nickname: '우림', profile_image_url: null },
        distance_m: 320,
        current_count: 2,
        capacity: 4,
        departure_at: '2026-09-05T08:30:00.000Z',
        is_expired: false,
        transport_type: 'TAXI',
      },
      {
        type: 'COMMUNITY',
        id: 88,
        title: '판교역 근처 카페 추천',
        author: { nickname: '루디', profile_image_url: null },
        distance_m: 540,
        comment_count: 3,
        created_at: '2026-09-03T10:00:00.000Z',
      },
    ]);
    expect(response.data.next_cursor).toBe('v1.eyJsYXN0X2Rpc3RhbmNlX20iOjU0MH0');
  });

  it('cursor가 있으면 다음 페이지를 조회한다', async () => {
    const response = await getNearbyPosts({
      lat: 37.3945,
      lng: 127.1112,
      sw_lat: 37.3,
      sw_lng: 127,
      ne_lat: 37.6,
      ne_lng: 127.2,
      cursor: 'v1.eyJsYXN0X2Rpc3RhbmNlX20iOjU0MH0',
    });

    expect(response.data.items).toEqual([]);
    expect(response.data.next_cursor).toBeNull();
  });
});
