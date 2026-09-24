import { describe, expect, it } from 'vitest';

import { getMapPins } from '@/_pages/home/api/map-pins';

describe('map pins API', () => {
  it('지도 영역의 남서쪽과 북동쪽 좌표로 지도 핀을 조회한다', async () => {
    const response = await getMapPins({
      sw_lat: 37.3,
      sw_lng: 127,
      ne_lat: 37.6,
      ne_lng: 127.2,
    });

    expect(response.data.items).toEqual([
      { type: 'COMPANION', id: 10, lat: 37.3945, lng: 127.1112 },
      { type: 'COMMUNITY', id: 88, lat: 37.5123, lng: 127.041 },
    ]);
    expect(response.data.limit).toBe(500);
    expect(response.data.limit_exceeded).toBe(false);
  });
});
