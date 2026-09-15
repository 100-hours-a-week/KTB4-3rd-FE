import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
