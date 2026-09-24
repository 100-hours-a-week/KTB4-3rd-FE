import type { StorybookConfig } from '@storybook/nextjs-vite';
import type { ServerResponse } from 'node:http';
import { loadEnv, type ViteDevServer } from 'vite';

const KAKAO_MAP_SDK_PROXY_PATH = '/__moyeota-kakao-map-sdk__/dapi.kakao.com/v2/maps/sdk.js';
const KAKAO_MAP_CDN_PROXY_PREFIX = '/__moyeota-kakao-map-cdn__';
const KAKAO_PLACE_SEARCH_PROXY_PATH = '/__moyeota-kakao-place-search__';

async function proxyKakaoResponse(
  targetUrl: URL,
  response: ServerResponse,
  options: { headers?: HeadersInit; rewriteBody?: (body: string) => string } = {},
) {
  const upstreamResponse = await fetch(targetUrl, { headers: options.headers });
  let body = await upstreamResponse.text();

  if (options.rewriteBody) {
    body = options.rewriteBody(body);
  }

  response.statusCode = upstreamResponse.status;
  response.setHeader(
    'content-type',
    upstreamResponse.headers.get('content-type') ?? 'text/plain; charset=utf-8',
  );
  response.setHeader('cache-control', upstreamResponse.headers.get('cache-control') ?? 'no-store');
  response.end(body);
}

function createKakaoMapProxyPlugin(apiKey: string) {
  return {
    name: 'moyeota-kakao-map-storybook-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.url;

        if (!requestUrl) {
          next();
          return;
        }

        try {
          if (requestUrl.startsWith(KAKAO_PLACE_SEARCH_PROXY_PATH)) {
            const requestUrlObject = new URL(requestUrl, 'http://storybook.local');
            const targetUrl = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
            targetUrl.search = requestUrlObject.search;
            const forwardedProtocol = request.headers['x-forwarded-proto'];
            const protocol = typeof forwardedProtocol === 'string' ? forwardedProtocol : 'http';
            const host = request.headers.host ?? 'localhost:6006';

            await proxyKakaoResponse(targetUrl, response, {
              headers: {
                Authorization: `KakaoAK ${apiKey}`,
                KA: `sdk/4.5.26 os/javascript lang/ko-KR device/MacIntel origin/${encodeURIComponent(`${protocol}://${host}`)}`,
              },
            });
            return;
          }

          if (requestUrl.startsWith(KAKAO_MAP_SDK_PROXY_PATH)) {
            const targetUrl = new URL('https://dapi.kakao.com/v2/maps/sdk.js');
            targetUrl.search = new URL(requestUrl, 'http://storybook.local').search;

            await proxyKakaoResponse(targetUrl, response, {
              rewriteBody: (body) =>
                body.replaceAll(
                  '//t1.daumcdn.net/mapjsapi/js/',
                  `${KAKAO_MAP_CDN_PROXY_PREFIX}/mapjsapi/js/`,
                ),
            });
            return;
          }

          if (requestUrl.startsWith(`${KAKAO_MAP_CDN_PROXY_PREFIX}/mapjsapi/js/`)) {
            const cdnPath = requestUrl.slice(KAKAO_MAP_CDN_PROXY_PREFIX.length);
            await proxyKakaoResponse(new URL(`https://t1.daumcdn.net${cdnPath}`), response);
            return;
          }
        } catch (error: unknown) {
          next(error);
          return;
        }

        next();
      });
    },
  };
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    const env = loadEnv('', process.cwd(), 'NEXT_PUBLIC_');
    const isStorybookBuild = process.env.NODE_ENV === 'production';

    return {
      ...config,
      plugins: [
        ...(config.plugins ?? []),
        createKakaoMapProxyPlugin(env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? ''),
      ],
      define: {
        ...config.define,
        'process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY': JSON.stringify(
          env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '',
        ),
        'process.env.NEXT_PUBLIC_KAKAO_MAP_SDK_URL': JSON.stringify(
          isStorybookBuild ? null : KAKAO_MAP_SDK_PROXY_PATH,
        ),
        'process.env.NEXT_PUBLIC_KAKAO_PLACE_SEARCH_URL': JSON.stringify(
          isStorybookBuild ? null : KAKAO_PLACE_SEARCH_PROXY_PATH,
        ),
      },
    };
  },
};

export default config;
