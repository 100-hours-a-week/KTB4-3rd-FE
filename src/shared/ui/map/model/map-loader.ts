import type { KakaoNamespace } from './kakao-map.types';
import { getKakaoMapSdkUrl, KAKAO_MAP_LIBRARIES } from './kakao-map-sdk-url';

const KAKAO_MAP_SCRIPT_ATTRIBUTE = 'data-moyeota-kakao-map';
const KAKAO_SERVICES_FRAME_URL = '/kakao-services-frame.html';
const KAKAO_MAP_LOAD_TIMEOUT_MS = 10_000;

let kakaoMapsPromise: Promise<KakaoNamespace> | null = null;
let kakaoServicesPromise: Promise<NonNullable<KakaoNamespace['maps']['services']>> | null = null;

declare global {
  var kakao: KakaoNamespace | undefined;
  // Window's interface must be augmented for same-origin iframe access.
  // eslint-disable-next-line typescript/consistent-type-definitions
  interface Window {
    kakao?: KakaoNamespace;
  }
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
      mapScript.src = getKakaoMapSdkUrl(apiKey);
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

export function loadKakaoServices(
  apiKey: string,
): Promise<NonNullable<KakaoNamespace['maps']['services']>> {
  const existingServices = window.kakao?.maps?.services;

  if (existingServices) {
    return Promise.resolve(existingServices);
  }

  if (!apiKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 설정되지 않았습니다.'));
  }

  if (kakaoServicesPromise) {
    return kakaoServicesPromise;
  }

  // SDK가 초기화된 뒤에는 라이브러리를 추가할 수 없어 별도의 문서에서 공식 SDK를 로드한다.
  kakaoServicesPromise = new Promise<NonNullable<KakaoNamespace['maps']['services']>>(
    (resolve, reject) => {
      const frame = document.createElement('iframe');
      frame.hidden = true;
      frame.tabIndex = -1;
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('data-moyeota-kakao-services', 'true');
      const timeoutId = window.setTimeout(
        () => fail(new Error('카카오 장소 조회 서비스 초기화 시간이 초과되었습니다.')),
        KAKAO_MAP_LOAD_TIMEOUT_MS,
      );

      function fail(error: Error) {
        window.clearTimeout(timeoutId);
        frame.removeEventListener('load', handleFrameLoad);
        frame.remove();
        reject(error);
      }

      function handleFrameLoad() {
        const frameWindow = frame.contentWindow;
        const frameDocument = frame.contentDocument;

        if (!frameWindow || !frameDocument?.head) {
          fail(new Error('카카오 장소 조회 서비스를 초기화할 수 없습니다.'));
          return;
        }

        const script = frameDocument.createElement('script');
        script.src = getKakaoMapSdkUrl(apiKey, 'services');
        script.onerror = () => fail(new Error('카카오 장소 조회 서비스를 불러오지 못했습니다.'));
        script.onload = () => {
          try {
            const maps = frameWindow.kakao?.maps;
            if (!maps) {
              fail(new Error('카카오 장소 조회 서비스를 초기화할 수 없습니다.'));
              return;
            }

            maps.load(() => {
              if (!maps.services) {
                fail(new Error('카카오 장소 조회 서비스를 초기화할 수 없습니다.'));
                return;
              }

              window.clearTimeout(timeoutId);
              resolve(maps.services);
            });
          } catch {
            fail(new Error('카카오 장소 조회 서비스를 초기화할 수 없습니다.'));
          }
        };
        frameDocument.head.appendChild(script);
      }

      frame.addEventListener('load', handleFrameLoad, { once: true });
      frame.src = new URL(KAKAO_SERVICES_FRAME_URL, window.location.origin).toString();
      document.body.appendChild(frame);
    },
  ).catch((error: unknown) => {
    kakaoServicesPromise = null;
    throw error;
  });

  return kakaoServicesPromise;
}
