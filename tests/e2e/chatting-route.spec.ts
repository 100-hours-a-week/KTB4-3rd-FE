import { expect, test } from '@playwright/test';

test('/chatting은 채팅 목록으로 이동한다', async ({ page }) => {
  await page.goto('/chatting');

  await expect(page).toHaveURL('/chat');
});
