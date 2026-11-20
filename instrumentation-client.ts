import { onSentryRouterTransitionStart, scheduleSentryLoad } from '@/_app/monitoring/sentry-client';

scheduleSentryLoad();

export const onRouterTransitionStart = onSentryRouterTransitionStart;
