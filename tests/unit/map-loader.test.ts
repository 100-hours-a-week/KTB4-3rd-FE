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

function getServicesFrame() {
  const frame = document.querySelector<HTMLIFrameElement>('iframe[data-moyeota-kakao-services]');
  const frameWindow = frame?.contentWindow;
  const script = frame?.contentDocument?.querySelector('script');

  if (!frameWindow || !script) {
    throw new Error('카카오 서비스 SDK 프레임이 생성되지 않았습니다.');
  }

  return { frameWindow, script };
}

afterEach(() => {
  document.head.innerHTML = '';
  document
    .querySelectorAll('iframe[data-moyeota-kakao-services]')
    .forEach((frame) => frame.remove());
  delete window.kakao;
  vi.resetModules();
});

describe('map-loader', () => {
  beforeEach(() => {
    delete window.kakao;
  });

  it('지도 SDK는 clusterer만 로드한다', async () => {
    const { loadKakaoMaps } = await import('@/shared/ui/map/model/map-loader');
    const loadPromise = loadKakaoMaps('javascript-key');
    const script = document.querySelector<HTMLScriptElement>(
      'script[data-moyeota-kakao-map="true"]',
    );

    expect(script).not.toBeNull();
    if (!script) {
      throw new Error('Kakao Maps SDK script가 생성되지 않았습니다.');
    }

    expect(new URL(script.src).searchParams.get('libraries')).toBe('clusterer');
    expect(document.querySelector('iframe[data-moyeota-kakao-services]')).toBeNull();

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

  it('services는 요청할 때 별도 문서에서 한 번만 로드한다', async () => {
    const { loadKakaoServices } = await import('@/shared/ui/map/model/map-loader');
    window.kakao = createKakaoNamespace(false);
    const first = loadKakaoServices('javascript-key');
    const second = loadKakaoServices('javascript-key');
    const { frameWindow, script } = getServicesFrame();

    expect(first).toBe(second);
    expect(new URL(script.src).searchParams.get('libraries')).toBe('services');
    expect(window.kakao.maps.services).toBeUndefined();

    const kakao = createKakaoNamespace();
    frameWindow.kakao = kakao;
    script.dispatchEvent(new Event('load'));

    await expect(first).resolves.toBe(kakao.maps.services);
    expect(window.kakao.maps.services).toBeUndefined();
  });

  it('services 로딩이 실패하면 프레임을 제거하고 재시도할 수 있다', async () => {
    const { loadKakaoServices } = await import('@/shared/ui/map/model/map-loader');
    const first = loadKakaoServices('javascript-key');
    getServicesFrame().script.dispatchEvent(new Event('error'));

    await expect(first).rejects.toThrow('카카오 장소 조회 서비스를 불러오지 못했습니다.');
    expect(document.querySelector('iframe[data-moyeota-kakao-services]')).toBeNull();

    const second = loadKakaoServices('javascript-key');
    const { frameWindow, script } = getServicesFrame();
    const kakao = createKakaoNamespace();
    frameWindow.kakao = kakao;
    script.dispatchEvent(new Event('load'));
    await expect(second).resolves.toBe(kakao.maps.services);
  });
});
