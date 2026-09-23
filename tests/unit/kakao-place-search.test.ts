import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchKakaoPlaces } from '@/features/location-search/model/kakao-place-search';
import type { KakaoNamespace, KakaoPlaces, KakaoServicesApi } from '@/shared/ui/map';

const { loadKakaoMaps, loadKakaoServices, keywordSearch } = vi.hoisted(() => ({
  keywordSearch: vi.fn<(...args: Parameters<KakaoPlaces['keywordSearch']>) => void>(),
  loadKakaoMaps: vi.fn<(apiKey: string) => Promise<KakaoNamespace>>(),
  loadKakaoServices: vi.fn<() => Promise<KakaoServicesApi>>(),
}));

vi.mock('@/shared/ui/map', () => ({
  loadKakaoMaps,
  loadKakaoServices,
}));

const Places = class {
  keywordSearch(...args: Parameters<KakaoPlaces['keywordSearch']>) {
    keywordSearch(...args);
  }
};

const Geocoder = class {
  coord2Address() {}
};

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('searchKakaoPlaces', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_KAKAO_MAP_APP_KEY', 'javascript-key');
    loadKakaoMaps.mockResolvedValue({} as KakaoNamespace);
    loadKakaoServices.mockResolvedValue({
      Geocoder,
      Places,
      Status: { OK: 'OK', RESULT_NOT_FOUND: 'RESULT_NOT_FOUND', ZERO_RESULT: 'ZERO_RESULT' },
    } satisfies KakaoServicesApi);
  });

  it('카카오 장소 검색 결과를 LocationSearchResult로 변환한다', async () => {
    keywordSearch.mockImplementation((_keyword, callback) => {
      callback(
        [
          {
            address_name: '경기 성남시 분당구 판교동',
            distance: '250',
            id: 'place-1',
            place_name: '판교역',
            place_url: 'https://place.map.kakao.com/place-1',
            road_address_name: '경기 성남시 분당구 판교역로',
            x: '127.111',
            y: '37.394',
          },
        ],
        'OK',
      );
    });

    await expect(searchKakaoPlaces('판교역')).resolves.toEqual([
      {
        distance: '250m',
        id: 'place-1',
        latitude: 37.394,
        longitude: 127.111,
        placeName: '판교역',
        placeUrl: 'https://place.map.kakao.com/place-1',
        roadAddress: '경기 성남시 분당구 판교역로',
      },
    ]);
    expect(loadKakaoMaps).toHaveBeenCalledWith('javascript-key');
    expect(keywordSearch).toHaveBeenCalledWith('판교역', expect.any(Function), {
      size: 15,
      sort: 'ACCURACY',
    });
  });

  it('검색 결과가 없으면 빈 배열을 반환한다', async () => {
    keywordSearch.mockImplementation((_keyword, callback) => callback([], 'ZERO_RESULT'));

    await expect(searchKakaoPlaces('없는 장소')).resolves.toEqual([]);
  });
});
