import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const DEFAULT_API_BASE_URL = 'http://dev.moyeota.com/api';
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(
  /\/$/,
  '',
);
const KAKAO_MAP_SDK_PROXY_PATH = '/moyeota-kakao-map-sdk/dapi.kakao.com/v2/maps/sdk.js';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_KAKAO_MAP_SDK_URL: KAKAO_MAP_SDK_PROXY_PATH,
  },
  // Docker 런타임 이미지를 최소화하기 위한 설정.
  // 빌드 시 .next/standalone 에 실행에 필요한 최소 파일이 생성된다.
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  webpack: {
    autoInstrumentAppDirectory: true,
    autoInstrumentMiddleware: true,
    autoInstrumentServerFunctions: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
