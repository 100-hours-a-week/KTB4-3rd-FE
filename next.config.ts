import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
