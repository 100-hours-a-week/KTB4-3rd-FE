import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { ReactNode } from 'react';

import { pretendard } from './fonts';
import {
  AuthBootstrapProvider,
  CarpoolRequestAuthCacheSync,
  ClarityProvider,
  LoginRequiredProvider,
  MockApiProvider,
  QueryProvider,
  SnackbarProvider,
} from '@/_app/providers';
import {
  PushNotificationForegroundListener,
  PushTokenRegistrationSync,
} from '@/features/push-token';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '모여타',
    template: '모여타 | %s',
  },
  description:
    '같은 방향의 동행을 지도에서 찾아 카풀·택시팟을 매칭하고, 출퇴근 정보를 나누는 모여타.',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID;

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <div id="app-root" className="isolate min-h-dvh">
          <ClarityProvider>
            <MockApiProvider>
              <QueryProvider>
                <CarpoolRequestAuthCacheSync />
                <SnackbarProvider>
                  <AuthBootstrapProvider>
                    <PushTokenRegistrationSync />
                    <PushNotificationForegroundListener />
                    <LoginRequiredProvider>{children}</LoginRequiredProvider>
                  </AuthBootstrapProvider>
                </SnackbarProvider>
              </QueryProvider>
            </MockApiProvider>
          </ClarityProvider>
        </div>
        {googleAnalyticsId ? <GoogleAnalytics gaId={googleAnalyticsId} /> : null}
      </body>
    </html>
  );
}
