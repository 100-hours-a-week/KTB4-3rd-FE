import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxyKakaoMapCdn, proxyKakaoMapSdk } from '@/shared/api/kakao-map-proxy';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('kakao-map-proxy', () => {
  it('SDK 응답의 외부 CDN 경로를 Next 프록시 경로로 변경한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('//t1.daumcdn.net/mapjsapi/js/main/4.5.26/kakao.js', {
        status: 200,
        headers: { 'content-type': 'text/javascript' },
      }),
    );

    const response = await proxyKakaoMapSdk(
      new Request(
        'http://localhost:3001/moyeota-kakao-map-sdk/dapi.kakao.com/v2/maps/sdk.js?appkey=test&autoload=false',
      ),
    );

    expect(await response.text()).toBe('/moyeota-kakao-map-cdn/mapjsapi/js/main/4.5.26/kakao.js');
    expect(fetch).toHaveBeenCalledWith(
      new URL('https://dapi.kakao.com/v2/maps/sdk.js?appkey=test&autoload=false'),
      { cache: 'no-store' },
    );
  });

  it('CDN 경로를 카카오 CDN으로 전달한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('kakao sdk body', { status: 200 }),
    );

    const response = await proxyKakaoMapCdn(
      new Request('http://localhost:3001/moyeota-kakao-map-cdn/mapjsapi/js/main.js'),
      ['main', '4.5.26', 'kakao.js'],
    );

    expect(await response.text()).toBe('kakao sdk body');
    expect(fetch).toHaveBeenCalledWith(
      new URL('https://t1.daumcdn.net/mapjsapi/js/main/4.5.26/kakao.js'),
      { cache: 'no-store' },
    );
  });
});
