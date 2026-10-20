import { describe, expect, it } from 'vitest';

import nextConfig from '@/../next.config';

describe('Next.js 보안 설정', () => {
  it('x-powered-by 헤더를 비활성화한다', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it('모든 경로에 필수 보안 헤더를 적용한다', async () => {
    const headers = await nextConfig.headers?.();
    const securityHeaders = headers?.find(({ source }) => source === '/:path*')?.headers;

    expect(securityHeaders).toEqual(
      expect.arrayContaining([
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ]),
    );

    const contentSecurityPolicy = securityHeaders?.find(
      ({ key }) => key === 'Content-Security-Policy',
    )?.value;

    expect(contentSecurityPolicy).toContain("frame-ancestors 'self'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain('https://dapi.kakao.com');
    expect(contentSecurityPolicy).toContain('https://*.daumcdn.net');
    expect(contentSecurityPolicy).toContain('https://*.clarity.ms');
    expect(contentSecurityPolicy).toContain("connect-src 'self'");
  });
});
