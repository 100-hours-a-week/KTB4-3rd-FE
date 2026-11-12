import type { RouterTransitionType } from 'next';
import type * as Sentry from '@sentry/nextjs';

type SentryModule = typeof Sentry;

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

let sentryModulePromise: Promise<SentryModule | null> | null = null;

export function loadSentry(): Promise<SentryModule | null> {
  if (!sentryDsn) {
    return Promise.resolve(null);
  }

  sentryModulePromise ??= import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      enabled: Boolean(sentryDsn),
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      sendDefaultPii: false,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });

    return Sentry;
  });

  return sentryModulePromise;
}

export function scheduleSentryLoad() {
  if (typeof window === 'undefined') {
    return;
  }

  const load = () => {
    void loadSentry();
  };

  const requestIdleCallback = window.requestIdleCallback;

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(load, { timeout: 2000 });
    return;
  }

  window.setTimeout(load, 0);
}

export function onSentryRouterTransitionStart(url: string, navigationType: RouterTransitionType) {
  void loadSentry().then((Sentry) => {
    Sentry?.captureRouterTransitionStart(url, navigationType);
  });
}
