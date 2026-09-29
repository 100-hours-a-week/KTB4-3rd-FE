import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { KakaoNamespace } from '@/shared/ui/map';

const createKakaoNamespace = (withServices = true): KakaoNamespace =>
  ({
    maps: {
      load: (callback: () => void) => callback(),
      ...(withServices && {
        services: {
          Geocoder: class {},
          Places: class {},
          Status: { OK: 'OK' },
        },
      }),
    },
  }) as unknown as KakaoNamespace;

afterEach(() => {
  document.head.innerHTML = '';
  delete window.kakao;
  vi.resetModules();
});

describe('map-loader', () => {
  beforeEach(() => {
    delete window.kakao;
  });

  it('services와 clusterer 라이브러리를 지도 SDK와 함께 로드한다', async () => {
    const { loadKakaoMaps } = await import('@/shared/ui/map/model/map-loader');
    const loadPromise = loadKakaoMaps('javascript-key');
    const script = document.querySelector<HTMLScriptElement>(
      'script[data-moyeota-kakao-map="true"]',
    );

    expect(script).not.toBeNull();
    if (!script) {
      throw new Error('Kakao Maps SDK script가 생성되지 않았습니다.');
    }

    expect(new URL(script.src).searchParams.get('libraries')).toBe('services,clusterer');
    expect(script.src).toContain('libraries=services,clusterer');
    expect(document.querySelector('script[data-moyeota-kakao-services]')).toBeNull();

    window.kakao = createKakaoNamespace();
    script.dispatchEvent(new Event('load'));

    await expect(loadPromise).resolves.toBe(window.kakao);
  });

  it('SDK 로딩 실패 후 다음 호출에서 다시 로드한다', async () => {
    const { loadKakaoMaps } = await import('@/shared/ui/map/model/map-loader');
    const firstLoad = loadKakaoMaps('javascript-key');
    const firstScript = document.querySelector<HTMLScriptElement>(
      'script[data-moyeota-kakao-map="true"]',
    );

    if (!firstScript) {
      throw new Error('첫 번째 Kakao Maps SDK script가 생성되지 않았습니다.');
    }

    firstScript.dispatchEvent(new Event('error'));

    await expect(firstLoad).rejects.toThrow('카카오 지도 SDK를 불러오지 못했습니다.');
    expect(document.querySelector('script[data-moyeota-kakao-map="true"]')).toBeNull();

    const secondLoad = loadKakaoMaps('javascript-key');
    const secondScript = document.querySelector<HTMLScriptElement>(
      'script[data-moyeota-kakao-map="true"]',
    );

    expect(secondLoad).not.toBe(firstLoad);
    expect(secondScript).not.toBeNull();

    if (!secondScript) {
      throw new Error('두 번째 Kakao Maps SDK script가 생성되지 않았습니다.');
    }

    window.kakao = createKakaoNamespace();
    secondScript.dispatchEvent(new Event('load'));

    await expect(secondLoad).resolves.toBe(window.kakao);
  });

  it('SDK 초기화가 오래 걸리면 원인을 포함한 오류를 반환한다', async () => {
    vi.useFakeTimers();

    try {
      const { loadKakaoMaps } = await import('@/shared/ui/map/model/map-loader');
      const loadPromise = loadKakaoMaps('javascript-key');
      const loadResult = loadPromise.then(
        () => null,
        (error: unknown) => (error instanceof Error ? error.message : String(error)),
      );

      await vi.advanceTimersByTimeAsync(10_000);

      await expect(loadResult).resolves.toContain('키와 도메인 설정을 확인하세요.');
    } finally {
      vi.useRealTimers();
    }
  });

  it('services 라이브러리가 없으면 원인을 포함한 오류를 반환한다', async () => {
    const { loadKakaoServices } = await import('@/shared/ui/map/model/map-loader');
    window.kakao = createKakaoNamespace(false);

    await expect(loadKakaoServices()).rejects.toThrow('services 라이브러리를 확인하세요.');
  });
});
