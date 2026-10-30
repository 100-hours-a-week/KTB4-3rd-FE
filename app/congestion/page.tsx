import type { Metadata } from 'next';

import { CongestionPage } from '@/_pages/congestion';

export const metadata: Metadata = {
  title: '혼잡도',
  description: '지도에서 장소별 혼잡도와 제보 정보를 확인해보세요.',
  alternates: {
    canonical: '/congestion',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '혼잡도 | 모여타',
    description: '지도에서 장소별 혼잡도와 제보 정보를 확인해보세요.',
    url: '/congestion',
    type: 'website',
  },
};

export default function CongestionRoute() {
  return <CongestionPage />;
}
