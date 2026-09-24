const KAKAO_MAP_SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';
const KAKAO_MAP_CDN_URL = 'https://t1.daumcdn.net';
const KAKAO_MAP_CDN_PROXY_PREFIX = '/api/moyeota-kakao-map-cdn';

function createProxyResponse(upstreamResponse: Response, body: string) {
  return new Response(body, {
    status: upstreamResponse.status,
    headers: {
      'cache-control': upstreamResponse.headers.get('cache-control') ?? 'no-store',
      'content-type': upstreamResponse.headers.get('content-type') ?? 'text/plain; charset=utf-8',
    },
  });
}

async function fetchProxyTarget(targetUrl: URL, rewriteBody?: (body: string) => string) {
  try {
    const upstreamResponse = await fetch(targetUrl, { cache: 'no-store' });
    const upstreamBody = await upstreamResponse.text();
    const body = rewriteBody ? rewriteBody(upstreamBody) : upstreamBody;

    return createProxyResponse(upstreamResponse, body);
  } catch {
    return new Response('Kakao proxy request failed.', { status: 502 });
  }
}

export function proxyKakaoMapSdk(request: Request) {
  const requestUrl = new URL(request.url);
  const targetUrl = new URL(KAKAO_MAP_SDK_URL);
  targetUrl.search = requestUrl.search;

  return fetchProxyTarget(targetUrl, (body) =>
    body.replaceAll('//t1.daumcdn.net/mapjsapi/js/', `${KAKAO_MAP_CDN_PROXY_PREFIX}/mapjsapi/js/`),
  );
}

export function proxyKakaoMapCdn(request: Request, path: string[]) {
  const targetPath = path.map((segment) => encodeURIComponent(segment)).join('/');
  const requestUrl = new URL(request.url);
  const targetUrl = new URL(`${KAKAO_MAP_CDN_URL}/mapjsapi/js/${targetPath}`);
  targetUrl.search = requestUrl.search;

  return fetchProxyTarget(targetUrl);
}
