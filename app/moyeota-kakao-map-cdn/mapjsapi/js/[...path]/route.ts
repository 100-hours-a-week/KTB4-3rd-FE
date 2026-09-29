import { proxyKakaoMapCdn } from '@/shared/api/kakao-map-proxy';

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  return proxyKakaoMapCdn(request, path);
}
