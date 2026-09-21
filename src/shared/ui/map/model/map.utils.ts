import type { MapCoordinate } from '@/shared/types/common';

import type { KakaoLatLng, KakaoLatLngBounds } from './kakao-map.types';
import type { MapLocationError, MapViewport } from './map.types';

export const DEFAULT_MAP_CENTER: MapCoordinate = {
  lat: 37.5665,
  lng: 126.978,
};

export function toMapCoordinate(position: KakaoLatLng): MapCoordinate {
  return {
    lat: position.getLat(),
    lng: position.getLng(),
  };
}

export function toMapViewport(bounds: KakaoLatLngBounds): MapViewport {
  const southWest = toMapCoordinate(bounds.getSouthWest());
  const northEast = toMapCoordinate(bounds.getNorthEast());

  return {
    northEast,
    northWest: { lat: northEast.lat, lng: southWest.lng },
    southEast: { lat: southWest.lat, lng: northEast.lng },
    southWest,
  };
}

export function getMapLocationError(error: GeolocationPositionError): MapLocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        code: 'permission-denied',
        message: '위치 권한이 없어 현재 위치를 가져올 수 없습니다.',
      };
    case error.POSITION_UNAVAILABLE:
      return {
        code: 'position-unavailable',
        message: '현재 위치를 확인할 수 없습니다.',
      };
    case error.TIMEOUT:
      return {
        code: 'timeout',
        message: '현재 위치 확인 시간이 초과되었습니다.',
      };
    default:
      return {
        code: 'position-unavailable',
        message: '현재 위치를 가져오지 못했습니다.',
      };
  }
}
