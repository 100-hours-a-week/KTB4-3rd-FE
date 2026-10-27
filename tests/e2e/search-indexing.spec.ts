import { expect, test } from '@playwright/test';

const indexablePaths = ['/', '/posts/1?type=community'];
const excludedPaths = [
  '/login',
  '/signup',
  '/auth/callback',
  '/chat',
  '/chatting',
  '/chatroom/101',
  '/matching',
  '/matching/location',
  '/matching/location/adjust?field=destination',
  '/matching/time',
  '/matching/confirm',
  '/post/create/location',
  '/post/create/type',
  '/posts/write?type=community',
  '/posts/write/location?field=departure',
];

for (const path of indexablePaths) {
  test(`${path}는 검색 색인을 허용한다`, async ({ request }) => {
    const response = await request.get(path);

    expect(response.ok()).toBe(true);
    expect((await response.text()).match(/<meta name="robots" content="[^"]+"/g)).toContain(
      '<meta name="robots" content="index, follow"',
    );
  });
}

test('/는 기본 SEO 메타데이터를 제공한다', async ({ request }) => {
  const response = await request.get('/');

  expect(response.ok()).toBe(true);
  const html = await response.text();

  expect(html).toContain('<title>모여타 | 지도 기반 동행 매칭 서비스</title>');
  expect(html).toContain('name="description"');
  expect(html).toContain('rel="canonical"');
  expect(html).toContain('property="og:title"');
  expect(html).toContain('name="twitter:card"');
});

test('/about는 서비스 JSON-LD를 제공한다', async ({ page }) => {
  await page.goto('/about');

  const jsonLdScript = page.locator('script[type="application/ld+json"]');
  await expect(jsonLdScript).toHaveCount(1, { timeout: 10_000 });

  const jsonLd = JSON.parse((await jsonLdScript.textContent()) ?? '') as {
    '@graph': { '@type': string }[];
  };

  expect(jsonLd['@graph'].map((item) => item['@type'])).toEqual(
    expect.arrayContaining(['Organization', 'WebSite', 'Service', 'WebPage']),
  );
});

for (const path of excludedPaths) {
  test(`${path}는 검색 색인을 제외한다`, async ({ request }) => {
    const response = await request.get(path);

    expect(response.ok()).toBe(true);
    expect((await response.text()).match(/<meta name="robots" content="[^"]+"/g)).toContain(
      '<meta name="robots" content="noindex, nofollow"',
    );
  });
}

for (const path of ['/llms.txt']) {
  test(`${path}는 AI 검색용 안내 파일을 제공한다`, async ({ request }) => {
    const response = await request.get(path);

    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('text/plain');
    const content = await response.text();

    expect(content).toContain('# 모여타');
    expect(content).toContain(
      '혼자 이동하기 부담스러운 순간, 같은 방향으로 가는 사람들을 연결하는 지도 기반 동행 매칭 서비스입니다.',
    );
    expect(content).toContain('🚕 택시팟 자동 매칭');
    expect(content).toContain('🚗 카풀 모집');
    expect(content).toContain('💳 택시팟 정산');
    expect(content).not.toContain('판교 주변');
    expect(content).toContain('📝 커뮤니티');
    expect(content).toContain('[서비스 소개](https://moyeota.com/about)');
    expect(content).toContain('[매칭 홈](https://moyeota.com/matching)');
    expect(content).not.toContain('[매칭 지도](');
    expect(content).not.toContain('[택시팟 매칭](');
    expect(content).not.toContain('[카풀 등록](');
    expect(content).not.toContain('[게시글 상세](');
    expect(content).toContain('택시팟 매칭');
    expect(content).toContain('카풀');
  });
}
