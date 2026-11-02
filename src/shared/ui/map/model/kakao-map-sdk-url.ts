const KAKAO_MAP_SCRIPT_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';
const KAKAO_MAP_SDK_URL = process.env.NEXT_PUBLIC_KAKAO_MAP_SDK_URL ?? KAKAO_MAP_SCRIPT_URL;
export const KAKAO_MAP_LIBRARIES = 'clusterer';

export function getKakaoMapSdkUrl(apiKey: string, libraries = KAKAO_MAP_LIBRARIES): string {
  const scriptUrl = new URL(KAKAO_MAP_SDK_URL, 'http://localhost');
  scriptUrl.searchParams.set('appkey', apiKey);
  scriptUrl.searchParams.set('autoload', 'false');
  scriptUrl.searchParams.set('libraries', libraries);

  const url = KAKAO_MAP_SDK_URL.startsWith('/')
    ? `${scriptUrl.pathname}${scriptUrl.search}`
    : scriptUrl.toString();

  return url.replace(`libraries=${encodeURIComponent(libraries)}`, `libraries=${libraries}`);
}
