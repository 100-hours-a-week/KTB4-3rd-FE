import { expect, test } from '@playwright/test';

test('shows the frontend starter page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /이동을 모아/ })).toBeVisible();
  await expect(page.getByText('기본 환경 구성 완료')).toBeVisible();
});

test('loads Pretendard as the global font', async ({ page }) => {
  await page.goto('/');

  const fontFamily = await page
    .locator('body')
    .evaluate((element) => getComputedStyle(element).fontFamily);

  expect(fontFamily).toContain('Pretendard');
  await expect.poll(() => page.evaluate(() => document.fonts.check('16px Pretendard'))).toBe(true);
});
