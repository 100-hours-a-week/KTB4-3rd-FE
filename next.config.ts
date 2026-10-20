import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const KAKAO_MAP_SDK_PROXY_PATH = '/moyeota-kakao-map-sdk/dapi.kakao.com/v2/maps/sdk.js';
const API_PROXY_TARGET = (process.env.API_PROXY_TARGET || 'http://dev.moyeota.com').replace(
  /\/$/,
  '',
);
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net https://www.gstatic.com https://www.googletagmanager.com https://*.clarity.ms",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.moyeota.com https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://*.sentry.io wss:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_KAKAO_MAP_SDK_URL: KAKAO_MAP_SDK_PROXY_PATH,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/matching/location',
        destination: '/taxi-pots/new/location',
        permanent: false,
      },
      {
        source: '/matching/location/adjust',
        destination: '/taxi-pots/new/location/adjust',
        permanent: false,
      },
      {
        source: '/matching/time',
        destination: '/taxi-pots/new/time',
        permanent: false,
      },
      {
        source: '/matching/confirm',
        destination: '/taxi-pots/new/confirm',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
  // Docker 런타임 이미지를 최소화하기 위한 설정.
  // 빌드 시 .next/standalone 에 실행에 필요한 최소 파일이 생성된다.
  output: 'standalone',
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
