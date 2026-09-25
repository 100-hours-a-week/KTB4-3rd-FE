import { loadKakaoMaps, loadKakaoServices, type KakaoPlace } from '@/shared/ui/map';

import type { LocationSearchResult } from './location';

function toLocationSearchResult(place: KakaoPlace): LocationSearchResult {
  const latitude = Number(place.y);
  const longitude = Number(place.x);

  return {
    id: place.id,
    placeName: place.place_name,
    distance: place.distance ? `${place.distance}m` : '',
    roadAddress: place.road_address_name || place.address_name,
    ...(Number.isFinite(latitude) && { latitude }),
    ...(Number.isFinite(longitude) && { longitude }),
    ...(place.place_url && { placeUrl: place.place_url }),
  };
}

export async function searchKakaoPlaces(keyword: string): Promise<LocationSearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '';
  await loadKakaoMaps(apiKey);
  const services = await loadKakaoServices();

  return new Promise((resolve, reject) => {
    const places = new services.Places();

    places.keywordSearch(
      keyword,
      (data, status) => {
        if (status === services.Status.OK) {
          resolve(data.map(toLocationSearchResult));
          return;
        }

        if (status === services.Status.RESULT_NOT_FOUND || status === services.Status.ZERO_RESULT) {
          resolve([]);
          return;
        }

        reject(new Error('카카오 장소 검색에 실패했습니다.'));
      },
      {
        size: 15,
        sort: 'accuracy',
      },
    );
  });
}
