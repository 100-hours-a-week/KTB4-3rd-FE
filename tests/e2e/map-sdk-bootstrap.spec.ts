import { expect, test } from '@playwright/test';

test('지도 SDK의 핵심 스크립트를 hydration 전에 요청한다', async ({ page }) => {
  let coreRequested = false;
  await page.route('**/_next/static/chunks/**', (route) => route.abort());
  await page.route('**/moyeota-kakao-map-sdk/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.kakao = { maps: { load: function () {
        const script = document.createElement('script');
        script.src = '/kakao-core-probe.js';
        document.head.appendChild(script);
      } } };`,
    }),
  );
  await page.route('**/kakao-core-probe.js', (route) => {
    coreRequested = true;
    return route.fulfill({ contentType: 'application/javascript', body: '' });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => coreRequested).toBe(true);
});
