import type { Metadata } from 'next';

import { AboutPage } from '@/_pages/about';
import { getSiteUrl } from '@/_app/config/site-url';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl() ?? 'https://moyeota.com'),
  title: '전국 출퇴근 동행 매칭 지도',
  description:
    '모여타는 전국 지도를 보며 같은 방향으로 이동하는 사람을 찾는 지도 기반 동행 매칭 서비스예요. 카풀과 택시팟을 살펴보고 함께 이동해보세요.',
  alternates: {
    canonical: '/about',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '전국 지도에서 동행을 찾는 모여타',
    description: '전국 지도를 살펴보고 등록된 카풀과 택시팟에서 함께 이동할 방법을 찾아보세요.',
    url: '/about',
    siteName: '모여타',
    locale: 'ko_KR',
    type: 'website',
    images: ['/logos/logo_full.svg'],
  },
};

export default function AboutRoute() {
  return <AboutPage />;
}
