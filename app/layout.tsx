import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { ReactNode } from 'react';

import {
  AuthBootstrapProvider,
  LoginRequiredProvider,
  MockApiProvider,
  QueryProvider,
} from '@/_app/providers';

import './globals.css';

export const metadata: Metadata = {
  title: '모여타',
  description: '이동을 모아, 일상을 잇다',
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
          <MockApiProvider>
            <QueryProvider>
              <AuthBootstrapProvider>
                <LoginRequiredProvider>{children}</LoginRequiredProvider>
              </AuthBootstrapProvider>
            </QueryProvider>
          </MockApiProvider>
        </div>
        {googleAnalyticsId ? <GoogleAnalytics gaId={googleAnalyticsId} /> : null}
      </body>
    </html>
  );
}
