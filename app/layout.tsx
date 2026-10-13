import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { ReactNode } from 'react';

import {
  AuthBootstrapProvider,
  CarpoolRequestAuthCacheSync,
  ClarityProvider,
  LoginRequiredProvider,
  MockApiProvider,
  QueryProvider,
  SnackbarProvider,
} from '@/_app/providers';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '모여타',
    template: '모여타 | %s',
  },
  description: '모여타는 카풀과 택시 동행을 찾고, 지역의 이동 정보를 나누는 커뮤니티 서비스입니다.',
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
    <html lang="ko">
      <body>
        <div id="app-root" className="isolate min-h-dvh">
          <ClarityProvider>
            <MockApiProvider>
              <QueryProvider>
                <CarpoolRequestAuthCacheSync />
                <SnackbarProvider>
                  <AuthBootstrapProvider>
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
