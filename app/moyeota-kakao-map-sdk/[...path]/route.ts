import { proxyKakaoMapSdk } from '@/shared/api/kakao-map-proxy';

export function GET(request: Request) {
  return proxyKakaoMapSdk(request);
}
