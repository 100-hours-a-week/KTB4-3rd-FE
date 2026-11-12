import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/_app/config/site-url';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return [];
  }

  return [
    { url: new URL('/', siteUrl).toString() },
    { url: new URL('/about', siteUrl).toString() },
    { url: new URL('/congestion', siteUrl).toString() },
    { url: new URL('/matching', siteUrl).toString() },
  ];
}
