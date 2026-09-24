import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchKakaoPlaces } from '@/features/location-search/model/kakao-place-search';
import type { KakaoNamespace, KakaoPlaces, KakaoServicesApi } from '@/shared/ui/map';

const { fetchMock, loadKakaoMaps, loadKakaoServices, keywordSearch } = vi.hoisted(() => ({
  fetchMock: vi.fn<typeof fetch>(),
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
  vi.unstubAllGlobals();
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

  it('Storybook 장소검색 프록시 응답을 변환한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_KAKAO_PLACE_SEARCH_URL', '/__moyeota-kakao-place-search__');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      json: async () => ({
        documents: [
          {
            address_name: '서울 강남구 삼성동 131',
            distance: '250',
            id: 'place-2',
            place_name: '코엑스',
            place_url: 'https://place.map.kakao.com/place-2',
            road_address_name: '서울 강남구 영동대로 513',
            x: '127.059',
            y: '37.511',
          },
        ],
      }),
      ok: true,
      status: 200,
    } as Response);

    await expect(searchKakaoPlaces('코엑스')).resolves.toEqual([
      {
        distance: '250m',
        id: 'place-2',
        latitude: 37.511,
        longitude: 127.059,
        placeName: '코엑스',
        placeUrl: 'https://place.map.kakao.com/place-2',
        roadAddress: '서울 강남구 영동대로 513',
      },
    ]);

    const [request] = fetchMock.mock.calls[0] ?? [];
    const requestUrl = new URL(String(request));
    expect(requestUrl.searchParams.get('query')).toBe('코엑스');
    expect(requestUrl.searchParams.get('size')).toBe('15');
    expect(loadKakaoMaps).not.toHaveBeenCalled();
  });
});
