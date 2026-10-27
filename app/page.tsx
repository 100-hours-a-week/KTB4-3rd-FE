import type { Metadata } from 'next';

import { getSiteUrl } from '@/_app/config/site-url';

const siteUrl = getSiteUrl() ?? 'https://moyeota.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    absolute: '모여타 | 지도 기반 동행 매칭 서비스',
  },
  description:
    '모여타는 같은 방향으로 이동하는 사람을 찾아 카풀과 택시팟으로 연결하는 지도 기반 동행 매칭 서비스예요.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '전국 지도에서 동행을 찾는 모여타',
    description: '전국 지도를 살펴보고 등록된 카풀과 택시팟에서 함께 이동할 방법을 찾아보세요.',
    url: '/',
    siteName: '모여타',
    locale: 'ko_KR',
    type: 'website',
    images: ['/logos/logo_full.svg'],
  },
  twitter: {
    card: 'summary',
    title: '전국 지도에서 동행을 찾는 모여타',
    description: '전국 지도를 살펴보고 등록된 카풀과 택시팟에서 함께 이동할 방법을 찾아보세요.',
    images: ['/logos/logo_full.svg'],
  },
};

export { HomePage as default } from '@/_pages/home';
