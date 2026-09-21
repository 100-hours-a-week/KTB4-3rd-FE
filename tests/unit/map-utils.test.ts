import { describe, expect, it } from 'vitest';

import { getMapLocationError, toMapViewport } from '@/shared/ui/map/model/map.utils';

describe('map utilities', () => {
  it('converts Kakao map bounds into all four viewport corners', () => {
    const viewport = toMapViewport({
      getNorthEast: () => ({ getLat: () => 37.6, getLng: () => 127.1 }),
      getSouthWest: () => ({ getLat: () => 37.4, getLng: () => 126.8 }),
    });

    expect(viewport).toEqual({
      northEast: { lat: 37.6, lng: 127.1 },
      northWest: { lat: 37.6, lng: 126.8 },
      southEast: { lat: 37.4, lng: 127.1 },
      southWest: { lat: 37.4, lng: 126.8 },
    });
  });

  it('returns a user-facing message for denied location permission', () => {
    const error = {
      code: 1,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
      message: 'denied',
    } as GeolocationPositionError;

    expect(getMapLocationError(error)).toEqual({
      code: 'permission-denied',
      message: '위치 권한이 없어 현재 위치를 가져올 수 없습니다.',
    });
  });
});
