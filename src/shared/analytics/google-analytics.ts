'use client';

import { sendGAEvent } from '@next/third-parties/google';

export type AnalyticsParams = Record<string, boolean | number | string>;

export function sendAnalyticsEvent(name: string, params?: AnalyticsParams): void {
  if (!process.env.NEXT_PUBLIC_GA_ID) {
    return;
  }

  sendGAEvent('event', name, params ?? {});
}
