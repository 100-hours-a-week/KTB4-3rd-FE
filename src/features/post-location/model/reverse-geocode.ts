import { loadKakaoMaps, loadKakaoServices } from '@/shared/ui/map';
import type { MapCoordinate } from '@/shared/types/common';

export type ReverseGeocodedLocation = {
  placeName: string | null;
  roadAddress: string | null;
};

export async function reverseGeocodeLocation(
  coordinate: MapCoordinate,
): Promise<ReverseGeocodedLocation> {
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '';

  await loadKakaoMaps(apiKey);
  const services = await loadKakaoServices();

  return new Promise((resolve, reject) => {
    const geocoder = new services.Geocoder();

    geocoder.coord2Address(coordinate.lng, coordinate.lat, (result, status) => {
      if (status !== services.Status.OK) {
        reject(new Error('선택한 위치의 주소를 조회하지 못했습니다.'));
        return;
      }

      const address = result[0];

      resolve({
        placeName: address?.road_address?.building_name ?? null,
        roadAddress: address?.road_address?.address_name ?? null,
      });
    });
  });
}
