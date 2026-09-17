import { expect, test } from '@playwright/test';

test('shows the frontend starter page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /이동을 모아/ })).toBeVisible();
  await expect(page.getByText('기본 환경 구성 완료')).toBeVisible();
});
