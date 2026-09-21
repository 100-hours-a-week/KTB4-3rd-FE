import type { KakaoNamespace } from './kakao-map.types';

const KAKAO_MAP_SCRIPT_ATTRIBUTE = 'data-moyeota-kakao-map';
const KAKAO_MAP_SCRIPT_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';
const KAKAO_SERVICES_SCRIPT_ATTRIBUTE = 'data-moyeota-kakao-services';
const KAKAO_SERVICES_SCRIPT_URL =
  'https://t1.daumcdn.net/mapjsapi/js/libs/services/1.1.1/services.js';

let kakaoMapsPromise: Promise<KakaoNamespace> | null = null;
let kakaoServicesPromise: Promise<NonNullable<KakaoNamespace['maps']['services']>> | null = null;

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

  window.kakao.maps.load(() => resolve(window.kakao as KakaoNamespace));
}

export function loadKakaoMaps(apiKey: string): Promise<KakaoNamespace> {
  if (!apiKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 설정되지 않았습니다.'));
  }

  if (kakaoMapsPromise) {
    return kakaoMapsPromise;
  }

  kakaoMapsPromise = new Promise<KakaoNamespace>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[${KAKAO_MAP_SCRIPT_ATTRIBUTE}]`,
    );

    if (window.kakao?.maps) {
      loadKakaoNamespace(resolve, reject);
      return;
    }

    const script = existingScript ?? document.createElement('script');

    script.addEventListener('load', () => loadKakaoNamespace(resolve, reject), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.')),
      { once: true },
    );

    if (!existingScript) {
      const scriptUrl = new URL(KAKAO_MAP_SCRIPT_URL);

      scriptUrl.searchParams.set('appkey', apiKey);
      scriptUrl.searchParams.set('autoload', 'false');
      scriptUrl.searchParams.set('libraries', 'clusterer');
      script.src = scriptUrl.toString();
      script.async = true;
      script.setAttribute(KAKAO_MAP_SCRIPT_ATTRIBUTE, 'true');
      document.head.appendChild(script);
    }
  });

  return kakaoMapsPromise;
}

export function loadKakaoServices(): Promise<NonNullable<KakaoNamespace['maps']['services']>> {
  const existingServices = window.kakao?.maps?.services;

  if (existingServices) {
    return Promise.resolve(existingServices);
  }

  if (kakaoServicesPromise) {
    return kakaoServicesPromise;
  }

  const servicesPromise = new Promise<NonNullable<KakaoNamespace['maps']['services']>>(
    (resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[${KAKAO_SERVICES_SCRIPT_ATTRIBUTE}]`,
      );
      const script = existingScript ?? document.createElement('script');

      script.addEventListener(
        'load',
        () => {
          const services = window.kakao?.maps?.services;

          if (services) {
            resolve(services);
          } else {
            reject(new Error('카카오 장소 조회 서비스를 초기화할 수 없습니다.'));
          }
        },
        { once: true },
      );
      script.addEventListener(
        'error',
        () => reject(new Error('카카오 장소 조회 서비스를 불러오지 못했습니다.')),
        { once: true },
      );

      if (!existingScript) {
        script.src = KAKAO_SERVICES_SCRIPT_URL;
        script.async = true;
        script.setAttribute(KAKAO_SERVICES_SCRIPT_ATTRIBUTE, 'true');
        document.head.appendChild(script);
      }
    },
  );

  kakaoServicesPromise = servicesPromise.catch((error: unknown) => {
    kakaoServicesPromise = null;
    throw error;
  });

  return kakaoServicesPromise;
}
