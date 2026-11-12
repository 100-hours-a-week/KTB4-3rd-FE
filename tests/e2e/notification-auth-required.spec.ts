import { expect, test } from '@playwright/test';

test('로그인하지 않고 알림 페이지에 접근하면 로그인 안내를 표시한다', async ({ page }) => {
  await page.route('**/api/auth/tokens', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: '로그인이 필요합니다' }),
    }),
  );
  await page.goto('/notification');

  await expect(page.getByRole('dialog', { name: '로그인이 필요해요' })).toBeVisible();
  await page.getByRole('button', { name: '로그인하러가기' }).click();
  await expect(page).toHaveURL('/login');
});
