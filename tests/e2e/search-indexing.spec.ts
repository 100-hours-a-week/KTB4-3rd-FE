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

for (const path of excludedPaths) {
  test(`${path}는 검색 색인을 제외한다`, async ({ request }) => {
    const response = await request.get(path);

    expect(response.ok()).toBe(true);
    expect((await response.text()).match(/<meta name="robots" content="[^"]+"/g)).toContain(
      '<meta name="robots" content="noindex, nofollow"',
    );
  });
}
