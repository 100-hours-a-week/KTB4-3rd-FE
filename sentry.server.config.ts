import * as Sentry from '@sentry/nextjs';

const sentryDsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
});
