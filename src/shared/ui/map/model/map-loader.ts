import type { KakaoNamespace } from './kakao-map.types';

const KAKAO_MAP_SCRIPT_ATTRIBUTE = 'data-moyeota-kakao-map';
const KAKAO_MAP_SCRIPT_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';
const KAKAO_MAP_SDK_URL = process.env.NEXT_PUBLIC_KAKAO_MAP_SDK_URL ?? KAKAO_MAP_SCRIPT_URL;
const KAKAO_MAP_LIBRARIES = 'services,clusterer';
const KAKAO_MAP_LOAD_TIMEOUT_MS = 10_000;

let kakaoMapsPromise: Promise<KakaoNamespace> | null = null;

declare global {
  var kakao: KakaoNamespace | undefined;
}

function loadKakaoNamespace(
  resolve: (value: KakaoNamespace) => void,
  reject: (reason?: unknown) => void,
) {
  if (!window.kakao?.maps) {
    reject(new Error('카카오 지도 SDK를 초기화할 수 없습니다.'));
    return;
  }

  try {
    window.kakao.maps.load(() => resolve(window.kakao as KakaoNamespace));
  } catch (error: unknown) {
    reject(error);
  }
}

export function loadKakaoMaps(apiKey: string): Promise<KakaoNamespace> {
  if (!apiKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 설정되지 않았습니다.'));
  }

  if (kakaoMapsPromise) {
    return kakaoMapsPromise;
  }

  kakaoMapsPromise = new Promise<KakaoNamespace>((resolve, reject) => {
    let script: HTMLScriptElement | null = null;
    const timeoutId = window.setTimeout(
      () =>
        rejectMaps(
          new Error('카카오 지도 SDK 초기화 시간이 초과되었습니다. 키와 도메인 설정을 확인하세요.'),
        ),
      KAKAO_MAP_LOAD_TIMEOUT_MS,
    );

    const cleanup = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
    };

    const resolveMaps = (value: KakaoNamespace) => {
      cleanup();
      resolve(value);
    };

    const rejectMaps = (reason?: unknown) => {
      cleanup();
      reject(reason);
    };

    const handleLoad = () => loadKakaoNamespace(resolveMaps, rejectMaps);
    const handleError = () => rejectMaps(new Error('카카오 지도 SDK를 불러오지 못했습니다.'));

    if (window.kakao?.maps) {
      handleLoad();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[${KAKAO_MAP_SCRIPT_ATTRIBUTE}]`,
    );
    const existingLibraries = existingScript
      ? new URL(existingScript.src, window.location.href).searchParams.get('libraries')
      : null;
    const canReuseExistingScript = existingLibraries === KAKAO_MAP_LIBRARIES;

    if (existingScript && !canReuseExistingScript) {
      existingScript.remove();
    }

    const mapScript =
      existingScript && canReuseExistingScript ? existingScript : document.createElement('script');
    script = mapScript;

    mapScript.addEventListener('load', handleLoad, { once: true });
    mapScript.addEventListener('error', handleError, { once: true });

    if (!canReuseExistingScript) {
      const scriptUrl = new URL(KAKAO_MAP_SDK_URL, window.location.href);

      scriptUrl.searchParams.set('appkey', apiKey);
      scriptUrl.searchParams.set('autoload', 'false');
      scriptUrl.searchParams.set('libraries', KAKAO_MAP_LIBRARIES);
      mapScript.src = scriptUrl
        .toString()
        .replace(
          `libraries=${encodeURIComponent(KAKAO_MAP_LIBRARIES)}`,
          `libraries=${KAKAO_MAP_LIBRARIES}`,
        );
      mapScript.async = false;
      mapScript.setAttribute(KAKAO_MAP_SCRIPT_ATTRIBUTE, 'true');
      document.head.appendChild(mapScript);
    }
  }).catch((error: unknown) => {
    kakaoMapsPromise = null;
    document.querySelector(`script[${KAKAO_MAP_SCRIPT_ATTRIBUTE}]`)?.remove();
    throw error;
  });

  return kakaoMapsPromise;
}

export function loadKakaoServices(): Promise<NonNullable<KakaoNamespace['maps']['services']>> {
  const existingServices = window.kakao?.maps?.services;

  if (existingServices) {
    return Promise.resolve(existingServices);
  }

  return Promise.reject(
    new Error(
      '카카오 장소 조회 서비스를 초기화할 수 없습니다. Kakao Maps SDK의 services 라이브러리를 확인하세요.',
    ),
  );
}
