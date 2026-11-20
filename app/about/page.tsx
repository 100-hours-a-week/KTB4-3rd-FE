import type { Metadata } from 'next';

import { AboutPage } from '@/_pages/about';
import { getSiteUrl } from '@/_app/config/site-url';

const siteUrl = getSiteUrl() ?? 'https://moyeota.com';
const aboutUrl = `${siteUrl}/about`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '지도 기반 동행 매칭 서비스',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: '모여타',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logos/logo_symbol.svg`,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: '모여타',
      url: siteUrl,
      inLanguage: 'ko-KR',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
    },
    {
      '@type': 'Service',
      '@id': `${aboutUrl}#service`,
      name: '모여타 동행 매칭 서비스',
      description:
        '같은 방향으로 이동하는 사람을 찾아 카풀과 택시팟으로 연결하는 지도 기반 동행 매칭 서비스예요.',
      serviceType: '카풀·택시팟·동행 매칭',
      provider: {
        '@id': `${siteUrl}/#organization`,
      },
      areaServed: {
        '@type': 'Country',
        name: '대한민국',
      },
      availableLanguage: 'ko-KR',
      url: aboutUrl,
    },
    {
      '@type': 'WebPage',
      '@id': `${aboutUrl}#webpage`,
      name: '지도 기반 동행 매칭 서비스',
      description: metadata.description,
      url: aboutUrl,
      inLanguage: 'ko-KR',
      isPartOf: {
        '@id': `${siteUrl}/#website`,
      },
      about: {
        '@id': `${siteUrl}/#organization`,
      },
      mainEntity: {
        '@id': `${aboutUrl}#service`,
      },
    },
  ],
};

export default function AboutRoute() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />
      <AboutPage />
    </>
  );
}
